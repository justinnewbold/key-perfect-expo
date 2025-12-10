import { Audio } from 'expo-av';
import { Instrument, NOTE_FREQUENCIES, ALL_NOTES, CHORD_INTERVALS, ChordType } from '../types';

// Audio context simulation for React Native
// We'll use oscillator-like synthesis by generating audio data

class AudioEngine {
  private sound: Audio.Sound | null = null;
  private volume: number = 0.8;
  private currentInstrument: Instrument = 'piano';

  constructor() {
    this.initAudio();
  }

  private async initAudio() {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol / 100));
  }

  setInstrument(instrument: Instrument) {
    this.currentInstrument = instrument;
  }

  // Generate a simple sine wave tone as base64 audio
  private generateTone(frequency: number, duration: number = 1, type: 'sine' | 'square' | 'triangle' = 'sine'): number[] {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const samples: number[] = [];

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // Generate waveform based on type
      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          sample = Math.sign(Math.sin(2 * Math.PI * frequency * t));
          break;
        case 'triangle':
          sample = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
          break;
      }

      // Apply ADSR envelope
      const attackTime = 0.05;
      const decayTime = 0.1;
      const sustainLevel = 0.7;
      const releaseTime = 0.3;

      let envelope = 1;
      if (t < attackTime) {
        envelope = t / attackTime;
      } else if (t < attackTime + decayTime) {
        envelope = 1 - (1 - sustainLevel) * ((t - attackTime) / decayTime);
      } else if (t < duration - releaseTime) {
        envelope = sustainLevel;
      } else {
        envelope = sustainLevel * (1 - (t - (duration - releaseTime)) / releaseTime);
      }

      samples.push(sample * envelope * this.volume);
    }

    return samples;
  }

  // Convert frequency to note name
  frequencyToNote(frequency: number): string {
    const noteNum = 12 * (Math.log2(frequency / 440));
    const note = Math.round(noteNum) + 69;
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return noteNames[note % 12];
  }

  // Get frequency for a note
  getNoteFrequency(note: string, octave: number = 4): number {
    const noteIndex = ALL_NOTES.indexOf(note);
    if (noteIndex === -1) return 440;
    const baseFreq = NOTE_FREQUENCIES[note];
    return baseFreq * Math.pow(2, octave - 4);
  }

  // Get instrument characteristics
  private getInstrumentSettings(instrument: Instrument) {
    const settings = {
      piano: { waveform: 'sine' as const, harmonics: [1, 0.5, 0.3, 0.2, 0.1, 0.05], attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.5 },
      guitar: { waveform: 'triangle' as const, harmonics: [1, 0.8, 0.6, 0.3, 0.1], attack: 0.005, decay: 0.1, sustain: 0.4, release: 0.3 },
      strings: { waveform: 'sine' as const, harmonics: [1, 0.3, 0.2, 0.1], attack: 0.2, decay: 0.1, sustain: 0.8, release: 0.4 },
      synth: { waveform: 'square' as const, harmonics: [1, 0.5, 0.25], attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.3 },
      organ: { waveform: 'sine' as const, harmonics: [1, 1, 0.5, 0.5, 0.3, 0.3], attack: 0.02, decay: 0.05, sustain: 0.9, release: 0.1 },
      bass: { waveform: 'sine' as const, harmonics: [1, 0.7, 0.3], attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.2 },
      drums: { waveform: 'square' as const, harmonics: [1, 0.5], attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
      brass: { waveform: 'triangle' as const, harmonics: [1, 0.6, 0.4, 0.3, 0.2, 0.1], attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.2 },
      woodwind: { waveform: 'sine' as const, harmonics: [1, 0.4, 0.2, 0.1, 0.05], attack: 0.1, decay: 0.1, sustain: 0.7, release: 0.3 },
      vocals: { waveform: 'sine' as const, harmonics: [1, 0.3, 0.15, 0.1, 0.05], attack: 0.15, decay: 0.1, sustain: 0.75, release: 0.35 },
    };
    return settings[instrument];
  }

  // Simple beep for feedback
  async playBeep(success: boolean = true) {
    try {
      // Use a simple approach - just play a quick tone
      const frequency = success ? 880 : 220;
      // For simplicity, we'll rely on haptic feedback instead of audio beeps
    } catch (error) {
      console.log('Error playing beep:', error);
    }
  }

  // Play a single note - simplified for React Native
  async playNote(note: string, octave: number = 4, duration: number = 1): Promise<void> {
    const frequency = this.getNoteFrequency(note, octave);
    console.log(`Playing note: ${note}${octave} at ${frequency}Hz`);
    
    // In a real implementation, you would use expo-av with pre-recorded samples
    // or a native audio synthesis library
    // For now, we'll just log the action
    
    return new Promise((resolve) => {
      setTimeout(resolve, duration * 1000);
    });
  }

  // Play a chord
  async playChord(root: string, type: ChordType, octave: number = 4, duration: number = 1.5): Promise<void> {
    const intervals = CHORD_INTERVALS[type] || [0, 4, 7];
    const rootIndex = ALL_NOTES.indexOf(root);
    
    console.log(`Playing ${root} ${type} chord`);
    
    // Get all notes in the chord
    const notes = intervals.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
      return { note: ALL_NOTES[noteIndex], octave: noteOctave };
    });

    // Play all notes simultaneously (in a real implementation)
    notes.forEach(({ note }) => {
      console.log(`  - ${note}`);
    });

    return new Promise((resolve) => {
      setTimeout(resolve, duration * 1000);
    });
  }

  // Play an interval
  async playInterval(rootNote: string, semitones: number, octave: number = 4): Promise<void> {
    const rootIndex = ALL_NOTES.indexOf(rootNote);
    const secondNoteIndex = (rootIndex + semitones) % 12;
    const secondNote = ALL_NOTES[secondNoteIndex];
    const secondOctave = octave + Math.floor((rootIndex + semitones) / 12);

    console.log(`Playing interval: ${rootNote}${octave} - ${secondNote}${secondOctave}`);

    // Play root note
    await this.playNote(rootNote, octave, 0.5);
    
    // Play second note
    await this.playNote(secondNote, secondOctave, 0.5);
  }

  // Play a scale
  async playScale(root: string, intervals: number[], octave: number = 4): Promise<void> {
    const rootIndex = ALL_NOTES.indexOf(root);
    
    for (const interval of intervals) {
      const noteIndex = (rootIndex + interval) % 12;
      const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
      await this.playNote(ALL_NOTES[noteIndex], noteOctave, 0.3);
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
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
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
