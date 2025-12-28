import { ALL_NOTES, NATURAL_NOTES } from '../types';

// Mock expo-av and react-native
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(),
  },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

// Import after mocking
import {
  getRandomNote,
  getRandomChord,
  parseChordName,
  shuffleArray,
  getWrongOptions,
} from '../utils/audioUtils';

describe('Audio Utility Functions', () => {
  describe('getRandomNote', () => {
    it('should return a note from the default ALL_NOTES array', () => {
      const note = getRandomNote();
      expect(ALL_NOTES).toContain(note);
    });

    it('should return a note from a custom array', () => {
      const customNotes = ['C', 'E', 'G'];
      const note = getRandomNote(customNotes);
      expect(customNotes).toContain(note);
    });

    it('should work with NATURAL_NOTES', () => {
      const note = getRandomNote(NATURAL_NOTES);
      expect(NATURAL_NOTES).toContain(note);
    });
  });

  describe('getRandomChord', () => {
    it('should return a chord from the provided array', () => {
      const chords = ['C Major', 'G Major', 'A Minor'];
      const chord = getRandomChord(chords);
      expect(chords).toContain(chord);
    });
  });

  describe('parseChordName', () => {
    it('should parse major chords correctly', () => {
      const result = parseChordName('C Major');
      expect(result).toEqual({ root: 'C', type: 'major' });
    });

    it('should parse minor chords correctly', () => {
      const result = parseChordName('A Minor');
      expect(result).toEqual({ root: 'A', type: 'minor' });
    });

    it('should parse diminished chords', () => {
      const result = parseChordName('B Diminished');
      expect(result).toEqual({ root: 'B', type: 'diminished' });
    });

    it('should parse augmented chords', () => {
      const result = parseChordName('C Augmented');
      expect(result).toEqual({ root: 'C', type: 'augmented' });
    });

    it('should parse dorian mode', () => {
      const result = parseChordName('D Dorian');
      expect(result).toEqual({ root: 'D', type: 'dorian' });
    });

    it('should parse phrygian mode', () => {
      const result = parseChordName('E Phrygian');
      expect(result).toEqual({ root: 'E', type: 'phrygian' });
    });

    it('should parse 7th chords', () => {
      const result = parseChordName('G 7th');
      expect(result).toEqual({ root: 'G', type: '7th' });
    });

    it('should handle sharp notes', () => {
      const result = parseChordName('F# Minor');
      expect(result).toEqual({ root: 'F#', type: 'minor' });
    });
  });

  describe('shuffleArray', () => {
    it('should return an array of the same length', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original);
      expect(shuffled).toHaveLength(original.length);
    });

    it('should contain all original elements', () => {
      const original = ['A', 'B', 'C', 'D'];
      const shuffled = shuffleArray(original);
      original.forEach(item => {
        expect(shuffled).toContain(item);
      });
    });

    it('should not modify the original array', () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];
      shuffleArray(original);
      expect(original).toEqual(originalCopy);
    });

    it('should work with empty array', () => {
      const result = shuffleArray([]);
      expect(result).toEqual([]);
    });

    it('should work with single element', () => {
      const result = shuffleArray(['X']);
      expect(result).toEqual(['X']);
    });
  });

  describe('getWrongOptions', () => {
    it('should return the requested number of options', () => {
      const allOptions = ['A', 'B', 'C', 'D', 'E'];
      const result = getWrongOptions('A', allOptions, 3);
      expect(result).toHaveLength(3);
    });

    it('should not include the correct answer', () => {
      const allOptions = ['A', 'B', 'C', 'D', 'E'];
      const correct = 'A';
      const result = getWrongOptions(correct, allOptions, 3);
      expect(result).not.toContain(correct);
    });

    it('should return elements from allOptions', () => {
      const allOptions = ['A', 'B', 'C', 'D', 'E'];
      const result = getWrongOptions('A', allOptions, 3);
      result.forEach(item => {
        expect(allOptions).toContain(item);
      });
    });

    it('should handle case where count exceeds available options', () => {
      const allOptions = ['A', 'B', 'C'];
      const result = getWrongOptions('A', allOptions, 5);
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should work with numbers', () => {
      const allOptions = [1, 2, 3, 4, 5];
      const result = getWrongOptions(1, allOptions, 2);
      expect(result).toHaveLength(2);
      expect(result).not.toContain(1);
    });

    it('should work with objects using reference equality', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const obj3 = { id: 3 };
      const allOptions = [obj1, obj2, obj3];
      const result = getWrongOptions(obj1, allOptions, 2);
      expect(result).not.toContain(obj1);
      expect(result.length).toBe(2);
    });
  });
});
