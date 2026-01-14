import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UserStats, UserSettings, DEFAULT_STATS, DEFAULT_SETTINGS, Instrument, ChordType } from '../types';
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
  playNote: (note: string, octave?: number, duration?: number) => Promise<void>;
  playChord: (root: string, type: string, octave?: number, duration?: number) => Promise<void>;
  
  // Loading state
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  // Use ref to always have access to latest stats (avoids stale closure issues)
  const statsRef = useRef<UserStats>(stats);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // Calculate level info from XP
  const levelInfo = getLevelFromXP(stats.totalXP);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
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
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Update stats - uses ref to avoid stale closure issues
  const updateStats = useCallback(async (updates: Partial<UserStats>) => {
    try {
      const currentStats = statsRef.current;
      const newStats = { ...currentStats, ...updates };
      setStats(newStats);
      await saveStats(newStats);

      // Check for new achievements - use newStats.achievements for comparison
      const earnedAchievements = checkAchievements(newStats);
      const newlyEarned = earnedAchievements.filter(a => !newStats.achievements.includes(a));

      if (newlyEarned.length > 0) {
        setNewAchievements(prev => [...prev, ...newlyEarned]);
        const updatedStats = {
          ...newStats,
          achievements: [...newStats.achievements, ...newlyEarned],
        };
        setStats(updatedStats);
        await saveStats(updatedStats);
      }
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }, []);

  // Record an answer - uses ref to avoid stale closure issues
  const recordAnswer = useCallback(async (
    correct: boolean,
    item: string,
    type: 'note' | 'chord' | 'interval' | 'scale'
  ) => {
    try {
      const currentStats = statsRef.current;
      const today = new Date().toISOString().split('T')[0];
      const accuracyKey = `${type}Accuracy` as keyof Pick<UserStats, 'noteAccuracy' | 'chordAccuracy' | 'intervalAccuracy' | 'scaleAccuracy'>;

      const currentAccuracy = currentStats[accuracyKey][item] || { correct: 0, total: 0 };
      const newAccuracy = {
        correct: currentAccuracy.correct + (correct ? 1 : 0),
        total: currentAccuracy.total + 1,
      };

      const newStreak = calculateStreak(currentStats.lastPracticeDate, currentStats.currentStreak);
      const practiceDates = currentStats.practiceDates.includes(today)
        ? currentStats.practiceDates
        : [...currentStats.practiceDates, today];

      await updateStats({
        totalAttempts: currentStats.totalAttempts + 1,
        correctAnswers: currentStats.correctAnswers + (correct ? 1 : 0),
        wrongAnswers: currentStats.wrongAnswers + (correct ? 0 : 1),
        currentStreak: newStreak,
        longestStreak: Math.max(currentStats.longestStreak, newStreak),
        lastPracticeDate: today,
        practiceDates,
        [accuracyKey]: {
          ...currentStats[accuracyKey],
          [item]: newAccuracy,
        },
      });
    } catch (error) {
      console.error('Error recording answer:', error);
    }
  }, [updateStats]);

  // Add XP - uses ref to avoid stale closure issues
  const addXP = useCallback(async (amount: number) => {
    try {
      const currentStats = statsRef.current;
      await updateStats({
        totalXP: currentStats.totalXP + Math.round(amount),
      });
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  }, [updateStats]);

  // Unlock a level - uses ref to avoid stale closure issues
  const unlockLevel = useCallback(async (levelId: number) => {
    try {
      const currentStats = statsRef.current;
      if (!currentStats.unlockedLevels.includes(levelId)) {
        await updateStats({
          unlockedLevels: [...currentStats.unlockedLevels, levelId],
        });
      }
    } catch (error) {
      console.error('Error unlocking level:', error);
    }
  }, [updateStats]);

  // Complete a level - uses ref to avoid stale closure issues
  const completeLevel = useCallback(async (levelId: number, correct: number, total: number) => {
    try {
      const currentStats = statsRef.current;
      const perfect = correct === total;
      const existingScore = currentStats.levelScores[levelId];

      // Only update if better score or first attempt
      const shouldUpdate = !existingScore || correct > existingScore.correct;

      if (shouldUpdate) {
        await updateStats({
          levelScores: {
            ...currentStats.levelScores,
            [levelId]: { correct, total, perfect },
          },
          levelsCompleted: Math.max(currentStats.levelsCompleted, levelId),
          perfectLevels: currentStats.perfectLevels + (perfect && (!existingScore || !existingScore.perfect) ? 1 : 0),
          unlockedLevels: currentStats.unlockedLevels.includes(levelId + 1)
            ? currentStats.unlockedLevels
            : [...currentStats.unlockedLevels, levelId + 1],
        });
      }
    } catch (error) {
      console.error('Error completing level:', error);
    }
  }, [updateStats]);

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    try {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      await saveSettings(newSettings);

      if (updates.volume !== undefined) {
        audioEngine.setVolume(updates.volume);
      }
      if (updates.instrument !== undefined) {
        audioEngine.setInstrument(updates.instrument);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }, [settings]);

  // Clear new achievements notification
  const clearNewAchievements = useCallback(() => {
    setNewAchievements([]);
  }, []);

  // Audio functions
  const playNote = useCallback(async (note: string, octave: number = 4, duration: number = 1) => {
    await audioEngine.playNote(note, octave, duration);
  }, []);

  const playChord = useCallback(async (root: string, type: string, octave: number = 4, duration: number = 1.5) => {
    await audioEngine.playChord(root, type as ChordType, octave, duration);
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
