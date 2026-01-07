import { AdaptiveDifficulty, ALL_NOTES, MAJOR_CHORDS, MINOR_CHORDS, INTERVALS, SCALES } from '../types';

// Difficulty levels affect:
// - Number of options presented
// - Types of items included
// - Time limits (for timed modes)
// - Hint availability

export interface DifficultyConfig {
  level: number;
  name: string;
  optionCount: number;
  includesSharps: boolean;
  includesMinorChords: boolean;
  includesAllIntervals: boolean;
  includesAllScales: boolean;
  timeMultiplier: number; // 1.0 = normal, 1.5 = more time, 0.75 = less time
  hintsEnabled: boolean;
}

// Difficulty configurations
export const DIFFICULTY_CONFIGS: DifficultyConfig[] = [
  { level: 1, name: 'Beginner', optionCount: 3, includesSharps: false, includesMinorChords: false, includesAllIntervals: false, includesAllScales: false, timeMultiplier: 1.5, hintsEnabled: true },
  { level: 2, name: 'Easy', optionCount: 4, includesSharps: false, includesMinorChords: false, includesAllIntervals: false, includesAllScales: false, timeMultiplier: 1.3, hintsEnabled: true },
  { level: 3, name: 'Normal', optionCount: 4, includesSharps: true, includesMinorChords: false, includesAllIntervals: false, includesAllScales: false, timeMultiplier: 1.0, hintsEnabled: true },
  { level: 4, name: 'Moderate', optionCount: 5, includesSharps: true, includesMinorChords: true, includesAllIntervals: false, includesAllScales: false, timeMultiplier: 1.0, hintsEnabled: true },
  { level: 5, name: 'Challenging', optionCount: 5, includesSharps: true, includesMinorChords: true, includesAllIntervals: true, includesAllScales: false, timeMultiplier: 0.9, hintsEnabled: true },
  { level: 6, name: 'Hard', optionCount: 6, includesSharps: true, includesMinorChords: true, includesAllIntervals: true, includesAllScales: false, timeMultiplier: 0.85, hintsEnabled: false },
  { level: 7, name: 'Very Hard', optionCount: 6, includesSharps: true, includesMinorChords: true, includesAllIntervals: true, includesAllScales: true, timeMultiplier: 0.8, hintsEnabled: false },
  { level: 8, name: 'Expert', optionCount: 7, includesSharps: true, includesMinorChords: true, includesAllIntervals: true, includesAllScales: true, timeMultiplier: 0.75, hintsEnabled: false },
  { level: 9, name: 'Master', optionCount: 8, includesSharps: true, includesMinorChords: true, includesAllIntervals: true, includesAllScales: true, timeMultiplier: 0.7, hintsEnabled: false },
  { level: 10, name: 'Virtuoso', optionCount: 10, includesSharps: true, includesMinorChords: true, includesAllIntervals: true, includesAllScales: true, timeMultiplier: 0.6, hintsEnabled: false },
];

// Get difficulty config for a level
export function getDifficultyConfig(level: number): DifficultyConfig {
  const clampedLevel = Math.max(1, Math.min(10, level));
  return DIFFICULTY_CONFIGS[clampedLevel - 1];
}

// Update adaptive difficulty based on answer
export function updateAdaptiveDifficulty(
  current: AdaptiveDifficulty,
  correct: boolean
): AdaptiveDifficulty {
  const today = new Date().toISOString().split('T')[0];

  if (correct) {
    const newConsecutiveCorrect = current.consecutiveCorrect + 1;
    const newConsecutiveWrong = 0;

    // Increase difficulty after 5 consecutive correct answers
    if (newConsecutiveCorrect >= 5 && current.currentLevel < 10) {
      return {
        currentLevel: current.currentLevel + 1,
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
        lastAdjustment: today,
      };
    }

    return {
      ...current,
      consecutiveCorrect: newConsecutiveCorrect,
      consecutiveWrong: newConsecutiveWrong,
    };
  } else {
    const newConsecutiveWrong = current.consecutiveWrong + 1;
    const newConsecutiveCorrect = 0;

    // Decrease difficulty after 3 consecutive wrong answers
    if (newConsecutiveWrong >= 3 && current.currentLevel > 1) {
      return {
        currentLevel: current.currentLevel - 1,
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
        lastAdjustment: today,
      };
    }

    return {
      ...current,
      consecutiveCorrect: newConsecutiveCorrect,
      consecutiveWrong: newConsecutiveWrong,
    };
  }
}

// Get available notes for difficulty level
export function getNotesForDifficulty(level: number): string[] {
  const config = getDifficultyConfig(level);

  if (config.includesSharps) {
    return [...ALL_NOTES];
  }

  // Only natural notes for lower difficulties
  return ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
}

// Get available chords for difficulty level
export function getChordsForDifficulty(level: number): string[] {
  const config = getDifficultyConfig(level);

  if (config.includesMinorChords) {
    return [...MAJOR_CHORDS, ...MINOR_CHORDS];
  }

  return [...MAJOR_CHORDS];
}

// Get available intervals for difficulty level
export function getIntervalsForDifficulty(level: number): typeof INTERVALS {
  const config = getDifficultyConfig(level);

  if (config.includesAllIntervals) {
    return [...INTERVALS];
  }

  // Basic intervals only
  return INTERVALS.filter(i =>
    ['Minor 2nd', 'Major 2nd', 'Minor 3rd', 'Major 3rd', 'Perfect 4th', 'Perfect 5th', 'Octave'].includes(i.name)
  );
}

// Get available scales for difficulty level
export function getScalesForDifficulty(level: number): typeof SCALES {
  const config = getDifficultyConfig(level);

  if (config.includesAllScales) {
    return [...SCALES];
  }

  // Basic scales only
  return SCALES.filter(s =>
    ['Major (Ionian)', 'Natural Minor (Aeolian)', 'Pentatonic Major', 'Pentatonic Minor'].includes(s.name)
  );
}

// Calculate adjusted time limit
export function getAdjustedTimeLimit(baseTime: number, level: number): number {
  const config = getDifficultyConfig(level);
  return Math.round(baseTime * config.timeMultiplier);
}

// Check if hints should be available
export function areHintsAvailable(level: number): boolean {
  const config = getDifficultyConfig(level);
  return config.hintsEnabled;
}

// Get recommended starting difficulty based on user stats
export function getRecommendedDifficulty(
  totalCorrect: number,
  accuracy: number,
  levelsCompleted: number
): number {
  // New users start at level 1
  if (totalCorrect < 10) return 1;

  // Calculate base level from accuracy
  let baseLevel = 1;
  if (accuracy >= 95) baseLevel = 7;
  else if (accuracy >= 90) baseLevel = 6;
  else if (accuracy >= 85) baseLevel = 5;
  else if (accuracy >= 80) baseLevel = 4;
  else if (accuracy >= 70) baseLevel = 3;
  else if (accuracy >= 60) baseLevel = 2;

  // Adjust based on levels completed
  const levelBonus = Math.floor(levelsCompleted / 2);

  return Math.min(10, baseLevel + levelBonus);
}

// Get difficulty description
export function getDifficultyDescription(level: number): string {
  const config = getDifficultyConfig(level);

  const features: string[] = [];

  if (config.includesSharps) features.push('all notes including sharps/flats');
  else features.push('natural notes only');

  if (config.includesMinorChords) features.push('major and minor chords');
  else features.push('major chords only');

  if (config.includesAllIntervals) features.push('all intervals');
  else features.push('basic intervals');

  if (!config.hintsEnabled) features.push('no hints');

  return `${config.name} (Level ${level}): ${features.join(', ')}`;
}
