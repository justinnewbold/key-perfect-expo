import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStats, UserSettings, DEFAULT_STATS, DEFAULT_SETTINGS, Achievement, ACHIEVEMENTS } from '../types';

// Storage keys
const STORAGE_KEYS = {
  STATS: 'keyPerfect_stats',
  SETTINGS: 'keyPerfect_settings',
  DAILY_CHALLENGE: 'keyPerfect_dailyChallenge',
};

// Stats operations
export async function loadStats(): Promise<UserStats> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
    if (data) {
      return { ...DEFAULT_STATS, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
  return DEFAULT_STATS;
}

export async function saveStats(stats: UserStats): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving stats:', error);
  }
}

// Settings operations
export async function loadSettings(): Promise<UserSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Daily challenge operations
export interface DailyChallenge {
  date: string;
  type: 'notes' | 'chords' | 'intervals' | 'progressions';
  keys: string[];
  completed: boolean;
  score: number;
}

export async function loadDailyChallenge(): Promise<DailyChallenge | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_CHALLENGE);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading daily challenge:', error);
  }
  return null;
}

export async function saveDailyChallenge(challenge: DailyChallenge): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_CHALLENGE, JSON.stringify(challenge));
  } catch (error) {
    console.error('Error saving daily challenge:', error);
  }
}

// Generate daily challenge based on date
export function generateDailyChallenge(date: string): DailyChallenge {
  // Use date as seed for deterministic randomness
  const dateNum = new Date(date).getTime();
  const seed = dateNum % 10000;
  
  const types: DailyChallenge['type'][] = ['notes', 'chords', 'intervals', 'progressions'];
  const typeIndex = seed % types.length;
  const type = types[typeIndex];
  
  let keys: string[] = [];
  
  switch (type) {
    case 'notes':
      keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C#', 'D#', 'F#', 'G#', 'A#'];
      break;
    case 'chords':
      keys = ['C Major', 'D Major', 'E Major', 'F Major', 'G Major', 'A Major', 'C Minor', 'D Minor', 'E Minor', 'A Minor'];
      break;
    case 'intervals':
      keys = ['Minor 2nd', 'Major 2nd', 'Minor 3rd', 'Major 3rd', 'Perfect 4th', 'Perfect 5th', 'Octave'];
      break;
    case 'progressions':
      keys = ['I-IV-V', 'I-V-vi-IV', 'ii-V-I', 'I-vi-IV-V'];
      break;
  }
  
  return {
    date,
    type,
    keys,
    completed: false,
    score: 0,
  };
}

// Streak calculations
export function calculateStreak(lastPracticeDate: string, currentStreak: number): number {
  // Handle empty or invalid date - this is the first practice
  if (!lastPracticeDate || lastPracticeDate === '') {
    return 1;
  }

  const today = new Date().toISOString().split('T')[0];

  // Validate the last practice date before parsing
  const lastDateObj = new Date(lastPracticeDate);
  if (isNaN(lastDateObj.getTime())) {
    return 1; // Invalid date, start fresh
  }

  const last = lastDateObj.toISOString().split('T')[0];

  const todayDate = new Date(today);
  const lastDate = new Date(last);
  const diffTime = todayDate.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return currentStreak; // Same day
  } else if (diffDays === 1) {
    return currentStreak + 1; // Consecutive day
  } else {
    return 1; // Streak broken
  }
}

// XP calculations
export function addXP(stats: UserStats, amount: number): UserStats {
  return {
    ...stats,
    totalXP: stats.totalXP + amount,
  };
}

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

// Achievement checking
export function checkAchievements(stats: UserStats): string[] {
  const newAchievements: string[] = [];
  
  ACHIEVEMENTS.forEach(achievement => {
    if (stats.achievements.includes(achievement.id)) return;
    
    let earned = false;
    
    switch (achievement.type) {
      case 'correct':
        earned = stats.correctAnswers >= achievement.requirement;
        break;
      case 'streak':
        earned = stats.currentStreak >= achievement.requirement || stats.longestStreak >= achievement.requirement;
        break;
      case 'level':
        earned = stats.levelsCompleted >= achievement.requirement;
        break;
      case 'special':
        if (achievement.id === 'speed_demon') {
          earned = stats.speedModeHighScore >= achievement.requirement;
        } else if (achievement.id === 'survivor') {
          earned = stats.survivalModeHighScore >= achievement.requirement;
        } else if (achievement.id === 'daily_devotee') {
          earned = stats.dailyChallengesCompleted >= achievement.requirement;
        } else if (achievement.id === 'chord_master') {
          earned = stats.levelsCompleted >= 5;
        }
        break;
    }
    
    if (earned) {
      newAchievements.push(achievement.id);
    }
  });
  
  return newAchievements;
}

// Weak area detection
export function detectWeakAreas(stats: UserStats): { item: string; type: string; accuracy: number }[] {
  const weakAreas: { item: string; type: string; accuracy: number }[] = [];
  
  // Check notes
  Object.entries(stats.noteAccuracy).forEach(([note, data]) => {
    if (data.total >= 5) {
      const accuracy = (data.correct / data.total) * 100;
      if (accuracy < 70) {
        weakAreas.push({ item: note, type: 'note', accuracy });
      }
    }
  });
  
  // Check chords
  Object.entries(stats.chordAccuracy).forEach(([chord, data]) => {
    if (data.total >= 5) {
      const accuracy = (data.correct / data.total) * 100;
      if (accuracy < 70) {
        weakAreas.push({ item: chord, type: 'chord', accuracy });
      }
    }
  });
  
  // Check intervals
  Object.entries(stats.intervalAccuracy).forEach(([interval, data]) => {
    if (data.total >= 5) {
      const accuracy = (data.correct / data.total) * 100;
      if (accuracy < 70) {
        weakAreas.push({ item: interval, type: 'interval', accuracy });
      }
    }
  });
  
  return weakAreas.sort((a, b) => a.accuracy - b.accuracy);
}

// AI insights generation
export function generateInsights(stats: UserStats): string[] {
  const insights: string[] = [];
  const weakAreas = detectWeakAreas(stats);
  
  if (weakAreas.length > 0) {
    const weakest = weakAreas[0];
    insights.push(`Focus on ${weakest.type} training: "${weakest.item}" needs improvement (${weakest.accuracy.toFixed(0)}% accuracy).`);
  }
  
  if (stats.currentStreak >= 7) {
    insights.push(`Amazing ${stats.currentStreak}-day streak! Consistency is key to ear training success.`);
  } else if (stats.currentStreak >= 3) {
    insights.push(`Nice ${stats.currentStreak}-day streak! Keep it going!`);
  }
  
  const overallAccuracy = stats.totalAttempts > 0 
    ? (stats.correctAnswers / stats.totalAttempts) * 100 
    : 0;
  
  if (overallAccuracy >= 90) {
    insights.push('Excellent accuracy! Consider moving to harder content or game modes.');
  } else if (overallAccuracy >= 70) {
    insights.push('Good progress! Keep practicing to solidify your ear training skills.');
  } else if (overallAccuracy > 0) {
    insights.push('Try slowing down and listening carefully before answering. Quality over speed!');
  }
  
  if (stats.totalPracticeTime > 3600) {
    const hours = Math.floor(stats.totalPracticeTime / 3600);
    insights.push(`You've practiced for ${hours}+ hours. Incredible dedication!`);
  }
  
  return insights;
}

// Clear all data
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}
