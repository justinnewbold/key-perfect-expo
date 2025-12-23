// Instrument types
export type Instrument = 
  | 'piano' 
  | 'guitar' 
  | 'strings' 
  | 'synth' 
  | 'organ' 
  | 'bass' 
  | 'drums' 
  | 'brass' 
  | 'woodwind' 
  | 'vocals';

// Note frequencies (C4 to B4)
export const NOTE_FREQUENCIES: Record<string, number> = {
  'C': 261.63,
  'C#': 277.18,
  'D': 293.66,
  'D#': 311.13,
  'E': 329.63,
  'F': 349.23,
  'F#': 369.99,
  'G': 392.00,
  'G#': 415.30,
  'A': 440.00,
  'A#': 466.16,
  'B': 493.88,
};

// All notes array
export const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const BASIC_NOTES = ['C', 'D', 'E', 'F', 'G'];

// Chord types
export type ChordType = 'major' | 'minor' | 'dorian' | 'phrygian' | 'diminished' | 'augmented' | '7th' | 'maj7' | 'min7';

export interface Chord {
  name: string;
  root: string;
  type: ChordType;
  intervals: number[];
}

// Chord intervals from root
export const CHORD_INTERVALS: Record<ChordType, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dorian: [0, 3, 7, 10],
  phrygian: [0, 1, 5, 8],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  '7th': [0, 4, 7, 10],
  'maj7': [0, 4, 7, 11],
  'min7': [0, 3, 7, 10],
};

// Major and minor chords
export const MAJOR_CHORDS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(note => `${note} Major`);
export const MINOR_CHORDS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(note => `${note} Minor`);

// Level configuration
export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  type: 'single-note' | 'chord';
  keys: string[];
  requiredCorrect: number;
  requiredTotal: number;
  xpReward: number;
}

// All levels
export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Basic Notes',
    description: 'Learn C, D, E, F, G',
    type: 'single-note',
    keys: ['C', 'D', 'E', 'F', 'G'],
    requiredCorrect: 4,
    requiredTotal: 5,
    xpReward: 50,
  },
  {
    id: 2,
    name: 'All Natural Notes',
    description: 'All 7 natural notes A-G',
    type: 'single-note',
    keys: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    requiredCorrect: 6,
    requiredTotal: 8,
    xpReward: 75,
  },
  {
    id: 3,
    name: 'Notes with Sharps',
    description: 'All 12 chromatic notes',
    type: 'single-note',
    keys: ALL_NOTES,
    requiredCorrect: 8,
    requiredTotal: 10,
    xpReward: 100,
  },
  {
    id: 4,
    name: 'Basic Major Chords',
    description: 'C, G, F, D Major chords',
    type: 'chord',
    keys: ['C Major', 'G Major', 'F Major', 'D Major'],
    requiredCorrect: 4,
    requiredTotal: 5,
    xpReward: 125,
  },
  {
    id: 5,
    name: 'All Major Chords',
    description: 'All 7 major chords',
    type: 'chord',
    keys: MAJOR_CHORDS,
    requiredCorrect: 6,
    requiredTotal: 8,
    xpReward: 150,
  },
  {
    id: 6,
    name: 'Major & Minor',
    description: 'Major and minor chords',
    type: 'chord',
    keys: [...MAJOR_CHORDS, ...MINOR_CHORDS],
    requiredCorrect: 10,
    requiredTotal: 12,
    xpReward: 200,
  },
  {
    id: 7,
    name: 'With Dorian Mode',
    description: 'Major, minor, and Dorian',
    type: 'chord',
    keys: [...MAJOR_CHORDS.slice(0, 4), ...MINOR_CHORDS.slice(0, 4), 'C Dorian', 'D Dorian', 'E Dorian', 'F Dorian', 'G Dorian', 'A Dorian', 'B Dorian'],
    requiredCorrect: 12,
    requiredTotal: 15,
    xpReward: 250,
  },
  {
    id: 8,
    name: 'Master Level',
    description: 'All keys + Phrygian mode',
    type: 'chord',
    keys: [...MAJOR_CHORDS, ...MINOR_CHORDS, 'C Phrygian', 'D Phrygian', 'E Phrygian'],
    requiredCorrect: 15,
    requiredTotal: 18,
    xpReward: 500,
  },
];

// Game modes
export type GameMode = 
  | 'speed' 
  | 'survival' 
  | 'daily' 
  | 'intervals' 
  | 'progressions' 
  | 'reverse' 
  | 'inversions' 
  | 'scales';

export interface GameModeConfig {
  id: GameMode;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const GAME_MODES: GameModeConfig[] = [
  { id: 'speed', name: 'Speed Mode', description: '30 seconds to answer as many as possible', icon: 'timer', color: '#FF6B6B' },
  { id: 'survival', name: 'Survival', description: '3 lives, progressive difficulty', icon: 'heart', color: '#4ECDC4' },
  { id: 'daily', name: 'Daily Challenge', description: 'New challenge every day', icon: 'calendar', color: '#FFE66D' },
  { id: 'intervals', name: 'Intervals', description: 'Identify harmonic intervals', icon: 'git-compare', color: '#95E1D3' },
  { id: 'progressions', name: 'Progressions', description: 'Identify chord progressions', icon: 'trending-up', color: '#F38181' },
  { id: 'reverse', name: 'Reverse Mode', description: 'Click to hear, then identify', icon: 'refresh-cw', color: '#AA96DA' },
  { id: 'inversions', name: 'Chord Inversions', description: 'Root position vs inversions', icon: 'layers', color: '#FCBAD3' },
  { id: 'scales', name: 'Scale Recognition', description: 'Identify 14 different scales', icon: 'activity', color: '#A8E6CF' },
];

// Intervals
export interface Interval {
  name: string;
  semitones: number;
  songExample: string;
}

export const INTERVALS: Interval[] = [
  { name: 'Minor 2nd', semitones: 1, songExample: 'Jaws Theme' },
  { name: 'Major 2nd', semitones: 2, songExample: 'Happy Birthday' },
  { name: 'Minor 3rd', semitones: 3, songExample: 'Greensleeves' },
  { name: 'Major 3rd', semitones: 4, songExample: 'Oh When the Saints' },
  { name: 'Perfect 4th', semitones: 5, songExample: 'Here Comes the Bride' },
  { name: 'Tritone', semitones: 6, songExample: 'The Simpsons' },
  { name: 'Perfect 5th', semitones: 7, songExample: 'Star Wars' },
  { name: 'Minor 6th', semitones: 8, songExample: 'The Entertainer' },
  { name: 'Major 6th', semitones: 9, songExample: 'My Bonnie' },
  { name: 'Minor 7th', semitones: 10, songExample: 'Star Trek Theme' },
  { name: 'Major 7th', semitones: 11, songExample: 'Take On Me' },
  { name: 'Octave', semitones: 12, songExample: 'Somewhere Over the Rainbow' },
];

// Scales
export interface Scale {
  name: string;
  intervals: number[];
}

export const SCALES: Scale[] = [
  { name: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11, 12] },
  { name: 'Natural Minor (Aeolian)', intervals: [0, 2, 3, 5, 7, 8, 10, 12] },
  { name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11, 12] },
  { name: 'Melodic Minor', intervals: [0, 2, 3, 5, 7, 9, 11, 12] },
  { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10, 12] },
  { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10, 12] },
  { name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11, 12] },
  { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10, 12] },
  { name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10, 12] },
  { name: 'Pentatonic Major', intervals: [0, 2, 4, 7, 9, 12] },
  { name: 'Pentatonic Minor', intervals: [0, 3, 5, 7, 10, 12] },
  { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10, 12] },
  { name: 'Whole Tone', intervals: [0, 2, 4, 6, 8, 10, 12] },
  { name: 'Chromatic', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
];

// Chord progressions
export interface ChordProgression {
  name: string;
  numerals: string;
  description: string;
}

export const PROGRESSIONS: ChordProgression[] = [
  { name: 'I-IV-V', numerals: 'I-IV-V', description: 'Most common in pop/rock' },
  { name: 'I-V-vi-IV', numerals: 'I-V-vi-IV', description: 'Axis of Awesome progression' },
  { name: 'ii-V-I', numerals: 'ii-V-I', description: 'Jazz turnaround' },
  { name: 'I-vi-IV-V', numerals: 'I-vi-IV-V', description: '50s progression' },
  { name: 'vi-IV-I-V', numerals: 'vi-IV-I-V', description: 'Sensitive progression' },
  { name: 'I-IV-I-V', numerals: 'I-IV-I-V', description: 'Folk/country' },
  { name: 'I-V-IV-V', numerals: 'I-V-IV-V', description: 'Rock progression' },
  { name: 'I-iii-IV-V', numerals: 'I-iii-IV-V', description: 'Pop ballad' },
];

// XP System
export const XP_PER_CORRECT = 10;
export const FIRST_TRY_BONUS = 5;
export const STREAK_3_BONUS = 5;
export const STREAK_5_BONUS = 10;
export const STREAK_10_BONUS = 25;
export const PERFECT_LEVEL_BONUS = 50;
export const DAILY_CHALLENGE_BONUS = 100;

export function calculateXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function getLevelFromXP(totalXP: number): { level: number; currentXP: number; nextLevelXP: number } {
  let level = 1;
  let remainingXP = totalXP;
  let xpNeeded = calculateXPForLevel(level);
  while (remainingXP >= xpNeeded) {
    remainingXP -= xpNeeded;
    level++;
    xpNeeded = calculateXPForLevel(level);
  }
  return {
    level,
    currentXP: remainingXP,
    nextLevelXP: xpNeeded,
  };
}

export function getLevelTitle(level: number): string {
  if (level >= 100) return 'Legend';
  if (level >= 75) return 'Virtuoso';
  if (level >= 50) return 'Master';
  if (level >= 35) return 'Expert';
  if (level >= 20) return 'Advanced';
  if (level >= 10) return 'Intermediate';
  if (level >= 5) return 'Novice';
  return 'Beginner';
}

// Achievements
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'correct' | 'streak' | 'level' | 'accuracy' | 'special';
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_steps', name: 'First Steps', description: 'Complete your first level', icon: '👶', requirement: 1, type: 'level' },
  { id: 'week_warrior', name: 'Week Warrior', description: '7-day practice streak', icon: '🔥', requirement: 7, type: 'streak' },
  { id: 'monthly_master', name: 'Monthly Master', description: '30-day practice streak', icon: '💎', requirement: 30, type: 'streak' },
  { id: 'centurion', name: 'Centurion', description: '100 correct answers', icon: '💯', requirement: 100, type: 'correct' },
  { id: 'practice_champion', name: 'Practice Champion', description: '500 correct answers', icon: '🏆', requirement: 500, type: 'correct' },
  { id: 'legend', name: 'Legend', description: '1000 correct answers', icon: '👑', requirement: 1000, type: 'correct' },
  { id: 'perfect_pitch', name: 'Perfect Pitch', description: 'Complete all levels with 100% accuracy', icon: '🎯', requirement: 8, type: 'special' },
  { id: 'sharp_ears', name: 'Sharp Ears', description: 'Identify all sharps correctly', icon: '🎵', requirement: 1, type: 'special' },
  { id: 'chord_master', name: 'Chord Master', description: 'Complete all chord levels', icon: '🎸', requirement: 5, type: 'special' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Score 20+ in Speed Mode', icon: '⚡', requirement: 20, type: 'special' },
  { id: 'survivor', name: 'Survivor', description: 'Reach level 10 in Survival Mode', icon: '🛡️', requirement: 10, type: 'special' },
  { id: 'daily_devotee', name: 'Daily Devotee', description: 'Complete 10 daily challenges', icon: '📅', requirement: 10, type: 'special' },
];

// Stats interface
export interface ItemAccuracy {
  correct: number;
  total: number;
}

export interface PracticeSession {
  date: string;
  duration: number;
  correct: number;
  total: number;
  mode: string;
}

export interface WeakArea {
  item: string;
  type: 'note' | 'chord' | 'interval' | 'scale';
  attempts: number;
  correct: number;
  accuracy: number;
  lastPracticed?: string;
}

export interface UserStats {
  totalAttempts: number;
  correctAnswers: number;
  wrongAnswers: number;
  currentStreak: number;
  longestStreak: number;
  levelsCompleted: number;
  perfectLevels: number;
  totalPracticeTime: number;
  lastPracticeDate: string;
  practiceDates: string[];
  noteAccuracy: Record<string, ItemAccuracy>;
  chordAccuracy: Record<string, ItemAccuracy>;
  intervalAccuracy: Record<string, ItemAccuracy>;
  scaleAccuracy: Record<string, ItemAccuracy>;
  practiceSessions: PracticeSession[];
  achievements: string[];
  totalXP: number;
  unlockedLevels: number[];
  levelScores: Record<number, { correct: number; total: number; perfect: boolean }>;
  dailyChallengesCompleted: number;
  speedModeHighScore: number;
  survivalModeHighScore: number;
}

export const DEFAULT_STATS: UserStats = {
  totalAttempts: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  currentStreak: 0,
  longestStreak: 0,
  levelsCompleted: 0,
  perfectLevels: 0,
  totalPracticeTime: 0,
  lastPracticeDate: '',
  practiceDates: [],
  noteAccuracy: {},
  chordAccuracy: {},
  intervalAccuracy: {},
  scaleAccuracy: {},
  practiceSessions: [],
  achievements: [],
  totalXP: 0,
  unlockedLevels: [1],
  levelScores: {},
  dailyChallengesCompleted: 0,
  speedModeHighScore: 0,
  survivalModeHighScore: 0,
};

// Settings interface
export interface UserSettings {
  volume: number;
  darkMode: boolean;
  instrument: Instrument;
  reverb: number;
  delay: number;
  autoPlay: boolean;
  showHints: boolean;
  hapticFeedback: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  volume: 80,
  darkMode: false,
  instrument: 'piano',
  reverb: 0,
  delay: 0,
  autoPlay: true,
  showHints: true,
  hapticFeedback: true,
};
