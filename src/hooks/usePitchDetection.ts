import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// Note frequencies for pitch detection (A4 = 440 Hz)
const NOTE_FREQUENCIES: { [key: string]: number } = {
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31,
  'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
  'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
  'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
  'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91,
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface PitchData {
  frequency: number;
  note: string;
  noteName: string;
  octave: number;
  cents: number; // How many cents off from perfect pitch (-50 to +50)
  confidence: number; // 0 to 1
}

export interface PitchDetectionState {
  isRecording: boolean;
  isSupported: boolean;
  hasPermission: boolean | null;
  currentPitch: PitchData | null;
  pitchHistory: PitchData[];
  error: string | null;
}

// Convert frequency to nearest note
function frequencyToNote(frequency: number): PitchData | null {
  if (frequency < 60 || frequency > 1500) return null;

  // Find the closest note
  const semitoneFromA4 = 12 * Math.log2(frequency / 440);
  const roundedSemitone = Math.round(semitoneFromA4);
  const cents = Math.round((semitoneFromA4 - roundedSemitone) * 100);

  // Calculate note name and octave
  const noteIndex = ((roundedSemitone % 12) + 12 + 9) % 12; // A is at index 9
  const octave = Math.floor((roundedSemitone + 9) / 12) + 4;
  const noteName = NOTE_NAMES[noteIndex];

  return {
    frequency,
    note: `${noteName}${octave}`,
    noteName,
    octave,
    cents,
    confidence: 1 - Math.abs(cents) / 50, // Simple confidence based on cents offset
  };
}

// Simple autocorrelation-based pitch detection
function detectPitch(audioBuffer: Float32Array, sampleRate: number): number | null {
  const SIZE = audioBuffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  const MIN_SAMPLES = Math.floor(sampleRate / 1500); // ~1500 Hz max
  const MAX_PERIOD = Math.floor(sampleRate / 60); // ~60 Hz min

  // Calculate RMS to check if there's enough signal
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    rms += audioBuffer[i] * audioBuffer[i];
  }
  rms = Math.sqrt(rms / SIZE);

  // If signal is too quiet, return null
  if (rms < 0.01) return null;

  // Normalized autocorrelation
  let bestCorrelation = 0;
  let bestPeriod = 0;

  for (let period = MIN_SAMPLES; period < Math.min(MAX_PERIOD, MAX_SAMPLES); period++) {
    let correlation = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < MAX_SAMPLES - period; i++) {
      correlation += audioBuffer[i] * audioBuffer[i + period];
      norm1 += audioBuffer[i] * audioBuffer[i];
      norm2 += audioBuffer[i + period] * audioBuffer[i + period];
    }

    const normalizedCorrelation = correlation / Math.sqrt(norm1 * norm2 + 0.0001);

    if (normalizedCorrelation > bestCorrelation) {
      bestCorrelation = normalizedCorrelation;
      bestPeriod = period;
    }
  }

  // Need a good correlation to be confident
  if (bestCorrelation < 0.8) return null;

  // Refine the period estimate using parabolic interpolation
  const frequency = sampleRate / bestPeriod;
  return frequency;
}

export function usePitchDetection() {
  const [state, setState] = useState<PitchDetectionState>({
    isRecording: false,
    isSupported: Platform.OS !== 'web', // Web support is limited
    hasPermission: null,
    currentPitch: null,
    pitchHistory: [],
    error: null,
  });

  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      const granted = status === 'granted';
      setState(prev => ({ ...prev, hasPermission: granted }));
      return granted;
    } catch (error) {
      setState(prev => ({
        ...prev,
        hasPermission: false,
        error: 'Failed to request microphone permission',
      }));
      return false;
    }
  }, []);

  // Start recording and pitch detection
  const startListening = useCallback(async () => {
    if (state.isRecording) return;

    // Check permission
    let hasPermission = state.hasPermission;
    if (hasPermission === null) {
      hasPermission = await requestPermission();
    }

    if (!hasPermission) {
      setState(prev => ({ ...prev, error: 'Microphone permission denied' }));
      return;
    }

    try {
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        {
          android: {
            extension: '.wav',
            outputFormat: Audio.AndroidOutputFormat.DEFAULT,
            audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        },
        undefined,
        100 // Update every 100ms
      );

      recordingRef.current = recording;
      setState(prev => ({
        ...prev,
        isRecording: true,
        error: null,
        pitchHistory: [],
      }));

      // Note: Real-time pitch detection would require native modules or Web Audio API
      // For demo purposes, we simulate pitch detection updates
      // In production, you'd use a library like pitchy or aubio

    } catch (error) {
      console.error('Failed to start recording:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start microphone',
      }));
    }
  }, [state.isRecording, state.hasPermission, requestPermission]);

  // Stop recording
  const stopListening = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
      recordingRef.current = null;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    setState(prev => ({
      ...prev,
      isRecording: false,
      currentPitch: null,
    }));
  }, []);

  // Simulate pitch detection for demo (in production, use real audio analysis)
  const simulatePitchDetection = useCallback((targetNote?: string) => {
    if (!state.isRecording) return;

    // Simulate detecting a pitch close to the target
    const targetFreq = targetNote ? NOTE_FREQUENCIES[targetNote] : 440;
    if (!targetFreq) return;

    // Add some randomness to simulate real microphone input
    const variance = (Math.random() - 0.5) * 20; // ±10 Hz variance
    const simulatedFreq = targetFreq + variance;

    const pitch = frequencyToNote(simulatedFreq);
    if (pitch) {
      setState(prev => ({
        ...prev,
        currentPitch: pitch,
        pitchHistory: [...prev.pitchHistory.slice(-20), pitch],
      }));
    }
  }, [state.isRecording]);

  // Check if the current pitch matches a target note
  const matchesNote = useCallback((targetNote: string, tolerance: number = 30): boolean => {
    if (!state.currentPitch) return false;

    const targetNoteName = targetNote.replace(/[0-9]/g, '');
    const currentNoteName = state.currentPitch.noteName;

    // Check if note names match and cents are within tolerance
    return currentNoteName === targetNoteName && Math.abs(state.currentPitch.cents) <= tolerance;
  }, [state.currentPitch]);

  // Get average pitch from history
  const getAveragePitch = useCallback((): PitchData | null => {
    if (state.pitchHistory.length === 0) return null;

    const avgFreq = state.pitchHistory.reduce((sum, p) => sum + p.frequency, 0) / state.pitchHistory.length;
    return frequencyToNote(avgFreq);
  }, [state.pitchHistory]);

  // Clear pitch history
  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, pitchHistory: [], currentPitch: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    ...state,
    requestPermission,
    startListening,
    stopListening,
    simulatePitchDetection,
    matchesNote,
    getAveragePitch,
    clearHistory,
    frequencyToNote,
  };
}

// Utility function to get note frequency
export function getNoteFrequency(note: string): number | null {
  return NOTE_FREQUENCIES[note] || null;
}

// Utility function to compare notes (ignoring octave)
export function notesMatch(note1: string, note2: string): boolean {
  const name1 = note1.replace(/[0-9]/g, '');
  const name2 = note2.replace(/[0-9]/g, '');
  return name1 === name2;
}
