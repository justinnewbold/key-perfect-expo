import {
  calculateXPForLevel,
  getLevelFromXP,
  getLevelTitle,
  ALL_NOTES,
  NATURAL_NOTES,
  CHORD_INTERVALS,
  INTERVALS,
  SCALES,
  PROGRESSIONS,
  ACHIEVEMENTS,
} from '../types';

describe('XP System', () => {
  describe('calculateXPForLevel', () => {
    it('should return correct XP for level 1', () => {
      expect(calculateXPForLevel(1)).toBe(100);
    });

    it('should return increasing XP for higher levels', () => {
      const level1 = calculateXPForLevel(1);
      const level2 = calculateXPForLevel(2);
      const level5 = calculateXPForLevel(5);

      expect(level2).toBeGreaterThan(level1);
      expect(level5).toBeGreaterThan(level2);
    });

    it('should follow the formula 100 * level^1.5', () => {
      expect(calculateXPForLevel(4)).toBe(Math.floor(100 * Math.pow(4, 1.5)));
    });
  });

  describe('getLevelFromXP', () => {
    it('should return level 1 for 0 XP', () => {
      const result = getLevelFromXP(0);
      expect(result.level).toBe(1);
      expect(result.currentXP).toBe(0);
    });

    it('should return level 1 with progress for 50 XP', () => {
      const result = getLevelFromXP(50);
      expect(result.level).toBe(1);
      expect(result.currentXP).toBe(50);
    });

    it('should return level 2 after accumulating enough XP', () => {
      const level1XP = calculateXPForLevel(1);
      const result = getLevelFromXP(level1XP + 10);
      expect(result.level).toBe(2);
      expect(result.currentXP).toBe(10);
    });

    it('should correctly calculate high levels', () => {
      const result = getLevelFromXP(10000);
      expect(result.level).toBeGreaterThan(5);
    });
  });

  describe('getLevelTitle', () => {
    it('should return Beginner for low levels', () => {
      expect(getLevelTitle(1)).toBe('Beginner');
      expect(getLevelTitle(4)).toBe('Beginner');
    });

    it('should return Novice for level 5-9', () => {
      expect(getLevelTitle(5)).toBe('Novice');
      expect(getLevelTitle(9)).toBe('Novice');
    });

    it('should return Intermediate for level 10-19', () => {
      expect(getLevelTitle(10)).toBe('Intermediate');
      expect(getLevelTitle(19)).toBe('Intermediate');
    });

    it('should return Legend for level 100+', () => {
      expect(getLevelTitle(100)).toBe('Legend');
      expect(getLevelTitle(150)).toBe('Legend');
    });
  });
});

describe('Music Theory Constants', () => {
  describe('Notes', () => {
    it('should have 12 chromatic notes', () => {
      expect(ALL_NOTES).toHaveLength(12);
    });

    it('should have 7 natural notes', () => {
      expect(NATURAL_NOTES).toHaveLength(7);
    });

    it('should have all natural notes in chromatic notes', () => {
      NATURAL_NOTES.forEach(note => {
        expect(ALL_NOTES).toContain(note);
      });
    });

    it('should start with C', () => {
      expect(ALL_NOTES[0]).toBe('C');
      expect(NATURAL_NOTES[0]).toBe('C');
    });
  });

  describe('Chord Intervals', () => {
    it('should have major chord with correct intervals (root, major 3rd, perfect 5th)', () => {
      expect(CHORD_INTERVALS.major).toEqual([0, 4, 7]);
    });

    it('should have minor chord with correct intervals (root, minor 3rd, perfect 5th)', () => {
      expect(CHORD_INTERVALS.minor).toEqual([0, 3, 7]);
    });

    it('should have diminished chord with correct intervals', () => {
      expect(CHORD_INTERVALS.diminished).toEqual([0, 3, 6]);
    });

    it('should have augmented chord with correct intervals', () => {
      expect(CHORD_INTERVALS.augmented).toEqual([0, 4, 8]);
    });

    it('should have 7th chord with 4 notes', () => {
      expect(CHORD_INTERVALS['7th']).toHaveLength(4);
      expect(CHORD_INTERVALS['7th']).toEqual([0, 4, 7, 10]);
    });
  });

  describe('Intervals', () => {
    it('should have 12 intervals (including octave)', () => {
      expect(INTERVALS).toHaveLength(12);
    });

    it('should have correct semitones for common intervals', () => {
      const perfect5th = INTERVALS.find(i => i.name === 'Perfect 5th');
      const octave = INTERVALS.find(i => i.name === 'Octave');
      const majorThird = INTERVALS.find(i => i.name === 'Major 3rd');

      expect(perfect5th?.semitones).toBe(7);
      expect(octave?.semitones).toBe(12);
      expect(majorThird?.semitones).toBe(4);
    });

    it('should have song examples for all intervals', () => {
      INTERVALS.forEach(interval => {
        expect(interval.songExample).toBeTruthy();
        expect(interval.songExample.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Scales', () => {
    it('should have at least 10 scales', () => {
      expect(SCALES.length).toBeGreaterThanOrEqual(10);
    });

    it('should have Major scale starting at 0', () => {
      const majorScale = SCALES.find(s => s.name.includes('Major') && s.name.includes('Ionian'));
      expect(majorScale?.intervals[0]).toBe(0);
    });

    it('should have chromatic scale with all 12 semitones', () => {
      const chromatic = SCALES.find(s => s.name === 'Chromatic');
      expect(chromatic?.intervals).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });
  });

  describe('Progressions', () => {
    it('should have common progressions', () => {
      const progressionNames = PROGRESSIONS.map(p => p.name);
      expect(progressionNames).toContain('I-IV-V');
      expect(progressionNames).toContain('ii-V-I');
    });

    it('should have descriptions for all progressions', () => {
      PROGRESSIONS.forEach(prog => {
        expect(prog.description).toBeTruthy();
        expect(prog.numerals).toBeTruthy();
      });
    });
  });

  describe('Achievements', () => {
    it('should have at least 10 achievements', () => {
      expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(10);
    });

    it('should have unique IDs', () => {
      const ids = ACHIEVEMENTS.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required fields', () => {
      ACHIEVEMENTS.forEach(achievement => {
        expect(achievement.id).toBeTruthy();
        expect(achievement.name).toBeTruthy();
        expect(achievement.description).toBeTruthy();
        expect(achievement.icon).toBeTruthy();
        expect(typeof achievement.requirement).toBe('number');
        expect(['correct', 'streak', 'level', 'accuracy', 'special']).toContain(achievement.type);
      });
    });
  });
});
