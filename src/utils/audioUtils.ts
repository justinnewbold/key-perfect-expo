import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Instrument, NOTE_FREQUENCIES, ALL_NOTES, CHORD_INTERVALS, ChordType } from '../types';

// Audio context for Web Audio API
let audioContext: AudioContext | null = null;

// Get or create AudioContext (web only)
function getAudioContext(): AudioContext | null {
  if (Platform.OS === 'web') {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (browsers require user interaction)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    return audioContext;
  }
  return null;
}

class AudioEngine {
  private volume: number = 0.8;
  private currentInstrument: Instrument = 'piano';
  private isInitialized: boolean = false;
  private isPlaying: boolean = false;

  constructor() {
    this.initAudio();
  }

  private async initAudio() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      this.isInitialized = true;
    } catch (error) {
      console.log('Audio init error:', error);
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol / 100));
  }

  setInstrument(instrument: Instrument) {
    this.currentInstrument = instrument;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // Get frequency for a note at a given octave
  getNoteFrequency(note: string, octave: number = 4): number {
    const noteIndex = ALL_NOTES.indexOf(note);
    if (noteIndex === -1) return 440;
    const baseFreq = NOTE_FREQUENCIES[note];
    return baseFreq * Math.pow(2, octave - 4);
  }

  // Get instrument characteristics for synthesis
  private getInstrumentSettings(instrument: Instrument) {
    const settings: Record<Instrument, {
      waveform: OscillatorType;
      attack: number;
      decay: number;
      sustain: number;
      release: number;
      harmonics: number[];
    }> = {
      piano: { waveform: 'triangle', attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.5, harmonics: [1, 0.5, 0.25, 0.125] },
      guitar: { waveform: 'sawtooth', attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.3, harmonics: [1, 0.8, 0.4] },
      strings: { waveform: 'sine', attack: 0.2, decay: 0.1, sustain: 0.8, release: 0.4, harmonics: [1, 0.3, 0.2] },
      synth: { waveform: 'square', attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.3, harmonics: [1, 0.5] },
      organ: { waveform: 'sine', attack: 0.02, decay: 0.05, sustain: 0.9, release: 0.1, harmonics: [1, 1, 0.5, 0.5, 0.3] },
      bass: { waveform: 'sine', attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.2, harmonics: [1, 0.7] },
      drums: { waveform: 'square', attack: 0.001, decay: 0.1, sustain: 0, release: 0.1, harmonics: [1] },
      brass: { waveform: 'sawtooth', attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.2, harmonics: [1, 0.6, 0.4, 0.3] },
      woodwind: { waveform: 'sine', attack: 0.1, decay: 0.1, sustain: 0.7, release: 0.3, harmonics: [1, 0.4, 0.2] },
      vocals: { waveform: 'sine', attack: 0.15, decay: 0.1, sustain: 0.75, release: 0.35, harmonics: [1, 0.3, 0.15] },
    };
    return settings[instrument];
  }

  // Play a note using Web Audio API (works on web)
  private playNoteWeb(frequency: number, duration: number = 1): void {
    const ctx = getAudioContext();
    if (!ctx) return;

    const settings = this.getInstrumentSettings(this.currentInstrument);
    const now = ctx.currentTime;

    // Create master gain
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = this.volume * 0.3;

    // Create oscillators for each harmonic
    settings.harmonics.forEach((harmonic, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = settings.waveform;
      osc.frequency.value = frequency * (index + 1);

      gain.connect(masterGain);
      osc.connect(gain);

      // ADSR envelope
      const attackEnd = now + settings.attack;
      const decayEnd = attackEnd + settings.decay;
      const releaseStart = now + duration - settings.release;
      const releaseEnd = now + duration;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(harmonic * this.volume, attackEnd);
      gain.gain.linearRampToValueAtTime(harmonic * settings.sustain * this.volume, decayEnd);
      gain.gain.setValueAtTime(harmonic * settings.sustain * this.volume, releaseStart);
      gain.gain.linearRampToValueAtTime(0, releaseEnd);

      osc.start(now);
      osc.stop(releaseEnd);
    });
  }

  // Generate WAV data for a note (for native platforms)
  private generateWavData(frequency: number, duration: number = 1): ArrayBuffer {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;

    // WAV header + data
    const dataSize = numSamples * numChannels * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
    view.setUint16(32, numChannels * bytesPerSample, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Generate audio samples
    const settings = this.getInstrumentSettings(this.currentInstrument);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // Generate waveform with harmonics
      settings.harmonics.forEach((harmonic, index) => {
        const freq = frequency * (index + 1);
        let wave = 0;

        switch (settings.waveform) {
          case 'sine':
            wave = Math.sin(2 * Math.PI * freq * t);
            break;
          case 'square':
            wave = Math.sign(Math.sin(2 * Math.PI * freq * t));
            break;
          case 'sawtooth':
            wave = 2 * ((freq * t) % 1) - 1;
            break;
          case 'triangle':
            wave = 4 * Math.abs(((freq * t) % 1) - 0.5) - 1;
            break;
        }

        sample += wave * harmonic;
      });

      // Normalize by number of harmonics
      sample /= settings.harmonics.length;

      // Apply ADSR envelope
      let envelope = 1;
      const attackTime = settings.attack;
      const decayTime = settings.decay;
      const sustainLevel = settings.sustain;
      const releaseTime = settings.release;

      if (t < attackTime) {
        envelope = t / attackTime;
      } else if (t < attackTime + decayTime) {
        envelope = 1 - (1 - sustainLevel) * ((t - attackTime) / decayTime);
      } else if (t < duration - releaseTime) {
        envelope = sustainLevel;
      } else {
        envelope = sustainLevel * (1 - (t - (duration - releaseTime)) / releaseTime);
      }

      sample *= envelope * this.volume;

      // Clamp and convert to 16-bit
      sample = Math.max(-1, Math.min(1, sample));
      const intSample = Math.floor(sample * 32767);
      view.setInt16(44 + i * 2, intSample, true);
    }

    return buffer;
  }

  // Convert ArrayBuffer to base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Play a single note
  async playNote(note: string, octave: number = 4, duration: number = 1): Promise<void> {
    if (this.isPlaying) return;

    this.isPlaying = true;
    const frequency = this.getNoteFrequency(note, octave);

    try {
      if (Platform.OS === 'web') {
        this.playNoteWeb(frequency, duration);
        await new Promise(resolve => setTimeout(resolve, duration * 1000));
      } else {
        // Native platforms: use expo-av with generated WAV
        const wavData = this.generateWavData(frequency, duration);
        const base64 = this.arrayBufferToBase64(wavData);
        const uri = `data:audio/wav;base64,${base64}`;

        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { volume: this.volume }
        );
        await sound.playAsync();

        // Wait for playback to complete
        await new Promise(resolve => setTimeout(resolve, duration * 1000));
        await sound.unloadAsync();
      }
    } catch (error) {
      console.log('Error playing note:', error);
    } finally {
      this.isPlaying = false;
    }
  }

  // Play a chord (multiple notes simultaneously)
  async playChord(root: string, type: ChordType, octave: number = 4, duration: number = 1.5): Promise<void> {
    if (this.isPlaying) return;

    this.isPlaying = true;
    const intervals = CHORD_INTERVALS[type] || [0, 4, 7];
    const rootIndex = ALL_NOTES.indexOf(root);

    try {
      if (Platform.OS === 'web') {
        // Play all notes simultaneously on web
        intervals.forEach(interval => {
          const noteIndex = (rootIndex + interval) % 12;
          const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
          const frequency = this.getNoteFrequency(ALL_NOTES[noteIndex], noteOctave);
          this.playNoteWeb(frequency, duration);
        });
        await new Promise(resolve => setTimeout(resolve, duration * 1000));
      } else {
        // For native, generate a combined chord WAV
        const frequencies = intervals.map(interval => {
          const noteIndex = (rootIndex + interval) % 12;
          const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
          return this.getNoteFrequency(ALL_NOTES[noteIndex], noteOctave);
        });

        const wavData = this.generateChordWavData(frequencies, duration);
        const base64 = this.arrayBufferToBase64(wavData);
        const uri = `data:audio/wav;base64,${base64}`;

        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { volume: this.volume }
        );
        await sound.playAsync();
        await new Promise(resolve => setTimeout(resolve, duration * 1000));
        await sound.unloadAsync();
      }
    } catch (error) {
      console.log('Error playing chord:', error);
    } finally {
      this.isPlaying = false;
    }
  }

  // Generate WAV data for a chord (multiple frequencies)
  private generateChordWavData(frequencies: number[], duration: number = 1.5): ArrayBuffer {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;

    const dataSize = numSamples * numChannels * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
    view.setUint16(32, numChannels * bytesPerSample, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    const settings = this.getInstrumentSettings(this.currentInstrument);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // Add each frequency in the chord
      frequencies.forEach(frequency => {
        settings.harmonics.forEach((harmonic, index) => {
          const freq = frequency * (index + 1);
          let wave = 0;

          switch (settings.waveform) {
            case 'sine':
              wave = Math.sin(2 * Math.PI * freq * t);
              break;
            case 'square':
              wave = Math.sign(Math.sin(2 * Math.PI * freq * t));
              break;
            case 'sawtooth':
              wave = 2 * ((freq * t) % 1) - 1;
              break;
            case 'triangle':
              wave = 4 * Math.abs(((freq * t) % 1) - 0.5) - 1;
              break;
          }

          sample += wave * harmonic;
        });
      });

      // Normalize
      sample /= (frequencies.length * settings.harmonics.length);

      // ADSR envelope
      let envelope = 1;
      if (t < settings.attack) {
        envelope = t / settings.attack;
      } else if (t < settings.attack + settings.decay) {
        envelope = 1 - (1 - settings.sustain) * ((t - settings.attack) / settings.decay);
      } else if (t < duration - settings.release) {
        envelope = settings.sustain;
      } else {
        envelope = settings.sustain * (1 - (t - (duration - settings.release)) / settings.release);
      }

      sample *= envelope * this.volume;
      sample = Math.max(-1, Math.min(1, sample));
      const intSample = Math.floor(sample * 32767);
      view.setInt16(44 + i * 2, intSample, true);
    }

    return buffer;
  }

  // Play an interval (two notes sequentially)
  async playInterval(rootNote: string, semitones: number, octave: number = 4): Promise<void> {
    const rootIndex = ALL_NOTES.indexOf(rootNote);
    const secondNoteIndex = (rootIndex + semitones) % 12;
    const secondNote = ALL_NOTES[secondNoteIndex];
    const secondOctave = octave + Math.floor((rootIndex + semitones) / 12);

    await this.playNote(rootNote, octave, 0.5);
    await new Promise(resolve => setTimeout(resolve, 100));
    await this.playNote(secondNote, secondOctave, 0.5);
  }

  // Play a scale
  async playScale(root: string, intervals: number[], octave: number = 4): Promise<void> {
    const rootIndex = ALL_NOTES.indexOf(root);

    for (const interval of intervals) {
      const noteIndex = (rootIndex + interval) % 12;
      const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
      await this.playNote(ALL_NOTES[noteIndex], noteOctave, 0.25);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // Play a chord progression
  async playProgression(chords: { root: string; type: ChordType }[], octave: number = 4): Promise<void> {
    for (const chord of chords) {
      await this.playChord(chord.root, chord.type, octave, 1);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Stop all sounds
  async stopAll() {
    if (Platform.OS === 'web' && audioContext) {
      await audioContext.close();
      audioContext = null;
    }
    this.isPlaying = false;
  }

  // Cleanup
  async cleanup() {
    await this.stopAll();
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();

// Helper functions
export function getRandomNote(notes: string[] = ALL_NOTES): string {
  return notes[Math.floor(Math.random() * notes.length)];
}

export function getRandomChord(chords: string[]): string {
  return chords[Math.floor(Math.random() * chords.length)];
}

export function parseChordName(chordName: string): { root: string; type: ChordType } {
  const parts = chordName.split(' ');
  const root = parts[0];
  const typeStr = parts.slice(1).join(' ').toLowerCase();

  let type: ChordType = 'major';
  if (typeStr.includes('minor') || typeStr === 'min') type = 'minor';
  else if (typeStr.includes('dorian')) type = 'dorian';
  else if (typeStr.includes('phrygian')) type = 'phrygian';
  else if (typeStr.includes('diminished') || typeStr === 'dim') type = 'diminished';
  else if (typeStr.includes('augmented') || typeStr === 'aug') type = 'augmented';
  else if (typeStr === '7' || typeStr === '7th') type = '7th';
  else if (typeStr === 'maj7') type = 'maj7';
  else if (typeStr === 'min7') type = 'min7';

  return { root, type };
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getWrongOptions<T>(correct: T, allOptions: T[], count: number = 3): T[] {
  const available = allOptions.filter(opt => opt !== correct);
  const shuffled = shuffleArray(available);
  return shuffled.slice(0, count);
}

export default audioEngine;
