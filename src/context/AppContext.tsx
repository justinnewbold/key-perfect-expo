import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserStats, UserSettings, DEFAULT_STATS, DEFAULT_SETTINGS, Instrument } from '../types';
import { 
  loadStats, 
  saveStats, 
  loadSettings, 
  saveSettings, 
  calculateStreak,
  getLevelFromXP,
  checkAchievements,
} from '../utils/storage';
import { audioEngine } from '../utils/audioUtils';

interface AppContextType {
  // Stats
  stats: UserStats;
  updateStats: (updates: Partial<UserStats>) => Promise<void>;
  recordAnswer: (correct: boolean, item: string, type: 'note' | 'chord' | 'interval' | 'scale') => Promise<void>;
  addXP: (amount: number) => Promise<void>;
  unlockLevel: (levelId: number) => Promise<void>;
  completeLevel: (levelId: number, correct: number, total: number) => Promise<void>;
  
  // Settings
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  
  // XP/Level info
  levelInfo: { level: number; currentXP: number; nextLevelXP: number };
  
  // Achievements
  newAchievements: string[];
  clearNewAchievements: () => void;
  
  // Audio
  playNote: (note: string, octave?: number) => Promise<void>;
  playChord: (root: string, type: string, octave?: number) => Promise<void>;
  
  // Loading state
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  // Calculate level info from XP
  const levelInfo = getLevelFromXP(stats.totalXP);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      const [loadedStats, loadedSettings] = await Promise.all([
        loadStats(),
        loadSettings(),
      ]);
      
      // Update streak based on last practice date
      const today = new Date().toISOString().split('T')[0];
      if (loadedStats.lastPracticeDate && loadedStats.lastPracticeDate !== today) {
        const newStreak = calculateStreak(loadedStats.lastPracticeDate, loadedStats.currentStreak);
        loadedStats.currentStreak = newStreak;
      }
      
      setStats(loadedStats);
      setSettings(loadedSettings);
      audioEngine.setVolume(loadedSettings.volume);
      audioEngine.setInstrument(loadedSettings.instrument);
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Update stats
  const updateStats = useCallback(async (updates: Partial<UserStats>) => {
    const newStats = { ...stats, ...updates };
    setStats(newStats);
    await saveStats(newStats);
    
    // Check for new achievements
    const earnedAchievements = checkAchievements(newStats);
    const newlyEarned = earnedAchievements.filter(a => !stats.achievements.includes(a));
    
    if (newlyEarned.length > 0) {
      setNewAchievements(prev => [...prev, ...newlyEarned]);
      const updatedStats = {
        ...newStats,
        achievements: [...newStats.achievements, ...newlyEarned],
      };
      setStats(updatedStats);
      await saveStats(updatedStats);
    }
  }, [stats]);

  // Record an answer
  const recordAnswer = useCallback(async (
    correct: boolean, 
    item: string, 
    type: 'note' | 'chord' | 'interval' | 'scale'
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const accuracyKey = `${type}Accuracy` as keyof Pick<UserStats, 'noteAccuracy' | 'chordAccuracy' | 'intervalAccuracy' | 'scaleAccuracy'>;
    
    const currentAccuracy = stats[accuracyKey][item] || { correct: 0, total: 0 };
    const newAccuracy = {
      correct: currentAccuracy.correct + (correct ? 1 : 0),
      total: currentAccuracy.total + 1,
    };
    
    const newStreak = calculateStreak(stats.lastPracticeDate, stats.currentStreak);
    const practiceDates = stats.practiceDates.includes(today) 
      ? stats.practiceDates 
      : [...stats.practiceDates, today];
    
    await updateStats({
      totalAttempts: stats.totalAttempts + 1,
      correctAnswers: stats.correctAnswers + (correct ? 1 : 0),
      wrongAnswers: stats.wrongAnswers + (correct ? 0 : 1),
      currentStreak: newStreak,
      longestStreak: Math.max(stats.longestStreak, newStreak),
      lastPracticeDate: today,
      practiceDates,
      [accuracyKey]: {
        ...stats[accuracyKey],
        [item]: newAccuracy,
      },
    });
  }, [stats, updateStats]);

  // Add XP
  const addXP = useCallback(async (amount: number) => {
    await updateStats({
      totalXP: stats.totalXP + amount,
    });
  }, [stats, updateStats]);

  // Unlock a level
  const unlockLevel = useCallback(async (levelId: number) => {
    if (!stats.unlockedLevels.includes(levelId)) {
      await updateStats({
        unlockedLevels: [...stats.unlockedLevels, levelId],
      });
    }
  }, [stats, updateStats]);

  // Complete a level
  const completeLevel = useCallback(async (levelId: number, correct: number, total: number) => {
    const perfect = correct === total;
    const existingScore = stats.levelScores[levelId];
    
    // Only update if better score or first attempt
    const shouldUpdate = !existingScore || correct > existingScore.correct;
    
    if (shouldUpdate) {
      await updateStats({
        levelScores: {
          ...stats.levelScores,
          [levelId]: { correct, total, perfect },
        },
        levelsCompleted: Math.max(stats.levelsCompleted, levelId),
        perfectLevels: stats.perfectLevels + (perfect && (!existingScore || !existingScore.perfect) ? 1 : 0),
        unlockedLevels: stats.unlockedLevels.includes(levelId + 1) 
          ? stats.unlockedLevels 
          : [...stats.unlockedLevels, levelId + 1],
      });
    }
  }, [stats, updateStats]);

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await saveSettings(newSettings);
    
    if (updates.volume !== undefined) {
      audioEngine.setVolume(updates.volume);
    }
    if (updates.instrument !== undefined) {
      audioEngine.setInstrument(updates.instrument);
    }
  }, [settings]);

  // Clear new achievements notification
  const clearNewAchievements = useCallback(() => {
    setNewAchievements([]);
  }, []);

  // Audio functions
  const playNote = useCallback(async (note: string, octave: number = 4) => {
    await audioEngine.playNote(note, octave);
  }, []);

  const playChord = useCallback(async (root: string, type: string, octave: number = 4) => {
    await audioEngine.playChord(root, type as any, octave);
  }, []);

  const value: AppContextType = {
    stats,
    updateStats,
    recordAnswer,
    addXP,
    unlockLevel,
    completeLevel,
    settings,
    updateSettings,
    levelInfo,
    newAchievements,
    clearNewAchievements,
    playNote,
    playChord,
    isLoading,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
