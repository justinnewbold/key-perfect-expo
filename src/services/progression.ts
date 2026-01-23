import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStats } from '../types';

export type AchievementTier = 'beginner' | 'skill' | 'streak' | 'social' | 'secret';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type QuestType = 'daily' | 'weekly' | 'monthly';
export type QuestStatus = 'active' | 'completed' | 'claimed';

export interface Achievement {
  id: string;
  tier: AchievementTier;
  rarity: AchievementRarity;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  current: number;
  isUnlocked: boolean;
  unlockedAt?: number;
  xpReward: number;
  coinReward: number;
  titleReward?: string;
}

export interface Quest {
  id: string;
  type: QuestType;
  name: string;
  description: string;
  requirement: number;
  progress: number;
  status: QuestStatus;
  xpReward: number;
  coinReward: number;
  expiresAt: number;
}

export interface PlayerLevel {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  prestige: number;
}

export interface Title {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockedAt?: number;
}

export interface ProfileCustomization {
  userId: string;
  avatar: string;
  title?: string;
  badge?: string;
  backgroundColor: string;
  borderColor?: string;
}

export interface ProgressionData {
  userId: string;
  level: PlayerLevel;
  achievements: Achievement[];
  quests: Quest[];
  titles: Title[];
  customization: ProfileCustomization;
  lastUpdated: number;
}

const STORAGE_KEYS = {
  PROGRESSION: 'keyPerfect_progression',
  DAILY_LOGIN_STREAK: 'keyPerfect_dailyLoginStreak',
};

// XP required for each level (exponential growth)
function calculateXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

// Define all achievements
const ACHIEVEMENTS_TEMPLATE: Omit<Achievement, 'current' | 'isUnlocked' | 'unlockedAt'>[] = [
  // BEGINNER TIER
  { id: 'begin_1', tier: 'beginner', rarity: 'common', name: 'First Steps', description: 'Complete your first practice session', icon: '🎵', requirement: 1, xpReward: 50, coinReward: 10 },
  { id: 'begin_2', tier: 'beginner', rarity: 'common', name: 'Warming Up', description: 'Complete 10 practice sessions', icon: '🎹', requirement: 10, xpReward: 100, coinReward: 25 },
  { id: 'begin_3', tier: 'beginner', rarity: 'common', name: 'Dedicated Learner', description: 'Complete 50 practice sessions', icon: '📚', requirement: 50, xpReward: 250, coinReward: 50 },
  { id: 'begin_4', tier: 'beginner', rarity: 'rare', name: 'Practice Makes Perfect', description: 'Complete 100 practice sessions', icon: '🎓', requirement: 100, xpReward: 500, coinReward: 100, titleReward: 'The Dedicated' },

  // SKILL TIER - Intervals
  { id: 'skill_int_1', tier: 'skill', rarity: 'common', name: 'Perfect Pitch', description: 'Identify 100 intervals correctly', icon: '🎯', requirement: 100, xpReward: 150, coinReward: 30 },
  { id: 'skill_int_2', tier: 'skill', rarity: 'rare', name: 'Interval Master', description: 'Identify 500 intervals correctly', icon: '🏆', requirement: 500, xpReward: 300, coinReward: 60 },
  { id: 'skill_int_3', tier: 'skill', rarity: 'epic', name: 'Interval Legend', description: 'Identify 1000 intervals correctly', icon: '⭐', requirement: 1000, xpReward: 600, coinReward: 120, titleReward: 'Interval Master' },

  // SKILL TIER - Chords
  { id: 'skill_chord_1', tier: 'skill', rarity: 'common', name: 'Chord Finder', description: 'Identify 100 chords correctly', icon: '🎼', requirement: 100, xpReward: 150, coinReward: 30 },
  { id: 'skill_chord_2', tier: 'skill', rarity: 'rare', name: 'Harmony Expert', description: 'Identify 500 chords correctly', icon: '🎶', requirement: 500, xpReward: 300, coinReward: 60 },
  { id: 'skill_chord_3', tier: 'skill', rarity: 'epic', name: 'Chord Virtuoso', description: 'Identify 1000 chords correctly', icon: '🌟', requirement: 1000, xpReward: 600, coinReward: 120, titleReward: 'Harmony Master' },

  // SKILL TIER - Accuracy
  { id: 'skill_acc_1', tier: 'skill', rarity: 'rare', name: 'Sharpshooter', description: 'Achieve 90% accuracy in a session', icon: '🎯', requirement: 1, xpReward: 200, coinReward: 40 },
  { id: 'skill_acc_2', tier: 'skill', rarity: 'epic', name: 'Perfectionist', description: 'Achieve 95% accuracy in a session', icon: '💯', requirement: 1, xpReward: 400, coinReward: 80 },
  { id: 'skill_acc_3', tier: 'skill', rarity: 'legendary', name: 'Flawless', description: 'Achieve 100% accuracy in a session', icon: '✨', requirement: 1, xpReward: 800, coinReward: 160, titleReward: 'The Flawless' },

  // STREAK TIER
  { id: 'streak_1', tier: 'streak', rarity: 'common', name: 'On a Roll', description: 'Maintain a 3-day streak', icon: '🔥', requirement: 3, xpReward: 100, coinReward: 20 },
  { id: 'streak_2', tier: 'streak', rarity: 'rare', name: 'Committed', description: 'Maintain a 7-day streak', icon: '💪', requirement: 7, xpReward: 250, coinReward: 50 },
  { id: 'streak_3', tier: 'streak', rarity: 'epic', name: 'Unstoppable', description: 'Maintain a 30-day streak', icon: '⚡', requirement: 30, xpReward: 750, coinReward: 150, titleReward: 'The Unstoppable' },
  { id: 'streak_4', tier: 'streak', rarity: 'legendary', name: 'Legendary Dedication', description: 'Maintain a 100-day streak', icon: '👑', requirement: 100, xpReward: 2000, coinReward: 400, titleReward: 'The Legendary' },

  // SOCIAL TIER
  { id: 'social_1', tier: 'social', rarity: 'common', name: 'Friendly', description: 'Add 5 friends', icon: '👥', requirement: 5, xpReward: 100, coinReward: 20 },
  { id: 'social_2', tier: 'social', rarity: 'rare', name: 'Social Butterfly', description: 'Add 20 friends', icon: '🦋', requirement: 20, xpReward: 300, coinReward: 60, titleReward: 'Social Butterfly' },
  { id: 'social_3', tier: 'social', rarity: 'common', name: 'Challenger', description: 'Win 10 challenges', icon: '⚔️', requirement: 10, xpReward: 200, coinReward: 40 },
  { id: 'social_4', tier: 'social', rarity: 'epic', name: 'Champion', description: 'Win 50 challenges', icon: '🏅', requirement: 50, xpReward: 600, coinReward: 120, titleReward: 'The Champion' },
  { id: 'social_5', tier: 'social', rarity: 'rare', name: 'Generous', description: 'Send 25 gifts', icon: '🎁', requirement: 25, xpReward: 250, coinReward: 50 },

  // SECRET TIER
  { id: 'secret_1', tier: 'secret', rarity: 'legendary', name: 'Night Owl', description: 'Practice at 3 AM', icon: '🦉', requirement: 1, xpReward: 500, coinReward: 100 },
  { id: 'secret_2', tier: 'secret', rarity: 'legendary', name: 'Speed Demon', description: 'Complete a session in under 2 minutes', icon: '💨', requirement: 1, xpReward: 500, coinReward: 100 },
  { id: 'secret_3', tier: 'secret', rarity: 'mythic', name: 'The Chosen One', description: 'Reach level 100', icon: '🌠', requirement: 1, xpReward: 5000, coinReward: 1000, titleReward: 'The Chosen One' },
  { id: 'secret_4', tier: 'secret', rarity: 'mythic', name: 'Completionist', description: 'Unlock all achievements', icon: '💫', requirement: 1, xpReward: 10000, coinReward: 2000, titleReward: 'The Completionist' },
];

// Define all titles
const TITLES_TEMPLATE: Omit<Title, 'isUnlocked' | 'unlockedAt'>[] = [
  { id: 'title_1', name: 'The Dedicated', description: 'Complete 100 practice sessions', icon: '🎓' },
  { id: 'title_2', name: 'Interval Master', description: 'Master intervals', icon: '🏆' },
  { id: 'title_3', name: 'Harmony Master', description: 'Master chords', icon: '🌟' },
  { id: 'title_4', name: 'The Flawless', description: 'Achieve perfect accuracy', icon: '✨' },
  { id: 'title_5', name: 'The Unstoppable', description: 'Maintain a 30-day streak', icon: '⚡' },
  { id: 'title_6', name: 'The Legendary', description: 'Maintain a 100-day streak', icon: '👑' },
  { id: 'title_7', name: 'Social Butterfly', description: 'Make many friends', icon: '🦋' },
  { id: 'title_8', name: 'The Champion', description: 'Win 50 challenges', icon: '🏅' },
  { id: 'title_9', name: 'The Chosen One', description: 'Reach level 100', icon: '🌠' },
  { id: 'title_10', name: 'The Completionist', description: 'Unlock everything', icon: '💫' },
];

/**
 * Initialize progression data for a new user
 */
export async function initializeProgression(userId: string): Promise<ProgressionData> {
  const progressionData: ProgressionData = {
    userId,
    level: {
      level: 1,
      currentXP: 0,
      xpToNextLevel: calculateXPForLevel(1),
      totalXP: 0,
      prestige: 0,
    },
    achievements: ACHIEVEMENTS_TEMPLATE.map(achievement => ({
      ...achievement,
      current: 0,
      isUnlocked: false,
    })),
    quests: [],
    titles: TITLES_TEMPLATE.map(title => ({
      ...title,
      isUnlocked: false,
    })),
    customization: {
      userId,
      avatar: '👤',
      backgroundColor: COLORS.surface,
    },
    lastUpdated: Date.now(),
  };

  await AsyncStorage.setItem(
    `${STORAGE_KEYS.PROGRESSION}_${userId}`,
    JSON.stringify(progressionData)
  );

  return progressionData;
}

/**
 * Get user progression data
 */
export async function getProgression(userId: string): Promise<ProgressionData> {
  try {
    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.PROGRESSION}_${userId}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading progression:', error);
  }

  return await initializeProgression(userId);
}

/**
 * Add XP and level up if needed
 */
export async function addXP(userId: string, amount: number): Promise<{ levelsGained: number; newLevel: number }> {
  const progression = await getProgression(userId);

  progression.level.currentXP += amount;
  progression.level.totalXP += amount;

  let levelsGained = 0;

  while (progression.level.currentXP >= progression.level.xpToNextLevel) {
    progression.level.currentXP -= progression.level.xpToNextLevel;
    progression.level.level++;
    levelsGained++;

    // Check for prestige (level 100)
    if (progression.level.level >= 100) {
      progression.level.level = 1;
      progression.level.prestige++;
      // Unlock secret achievement
      await unlockAchievement(userId, 'secret_3');
    }

    progression.level.xpToNextLevel = calculateXPForLevel(progression.level.level);
  }

  progression.lastUpdated = Date.now();

  await AsyncStorage.setItem(
    `${STORAGE_KEYS.PROGRESSION}_${userId}`,
    JSON.stringify(progression)
  );

  return {
    levelsGained,
    newLevel: progression.level.level,
  };
}

/**
 * Unlock achievement
 */
export async function unlockAchievement(userId: string, achievementId: string): Promise<boolean> {
  const progression = await getProgression(userId);
  const achievement = progression.achievements.find(a => a.id === achievementId);

  if (!achievement || achievement.isUnlocked) return false;

  achievement.isUnlocked = true;
  achievement.unlockedAt = Date.now();

  // Award rewards
  await addXP(userId, achievement.xpReward);

  // Unlock title if available
  if (achievement.titleReward) {
    const title = progression.titles.find(t => t.name === achievement.titleReward);
    if (title) {
      title.isUnlocked = true;
      title.unlockedAt = Date.now();
    }
  }

  // Check completionist achievement
  const allUnlocked = progression.achievements.every(a => a.isUnlocked || a.tier === 'secret');
  if (allUnlocked) {
    await unlockAchievement(userId, 'secret_4');
  }

  progression.lastUpdated = Date.now();

  await AsyncStorage.setItem(
    `${STORAGE_KEYS.PROGRESSION}_${userId}`,
    JSON.stringify(progression)
  );

  return true;
}

/**
 * Update achievement progress
 */
export async function updateAchievementProgress(
  userId: string,
  achievementId: string,
  progress: number
): Promise<boolean> {
  const progression = await getProgression(userId);
  const achievement = progression.achievements.find(a => a.id === achievementId);

  if (!achievement || achievement.isUnlocked) return false;

  achievement.current = Math.min(progress, achievement.requirement);

  if (achievement.current >= achievement.requirement) {
    await unlockAchievement(userId, achievementId);
    return true;
  }

  progression.lastUpdated = Date.now();

  await AsyncStorage.setItem(
    `${STORAGE_KEYS.PROGRESSION}_${userId}`,
    JSON.stringify(progression)
  );

  return false;
}

/**
 * Generate daily quests
 */
export async function generateDailyQuests(userId: string): Promise<Quest[]> {
  const now = Date.now();
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);

  const dailyQuests: Quest[] = [
    {
      id: `daily_1_${now}`,
      type: 'daily',
      name: 'Daily Practice',
      description: 'Complete 3 practice sessions',
      requirement: 3,
      progress: 0,
      status: 'active',
      xpReward: 100,
      coinReward: 20,
      expiresAt: tomorrow.getTime(),
    },
    {
      id: `daily_2_${now}`,
      type: 'daily',
      name: 'Accuracy Challenge',
      description: 'Achieve 80% accuracy in a session',
      requirement: 1,
      progress: 0,
      status: 'active',
      xpReward: 150,
      coinReward: 30,
      expiresAt: tomorrow.getTime(),
    },
    {
      id: `daily_3_${now}`,
      type: 'daily',
      name: 'Social Hour',
      description: 'Complete 1 challenge with a friend',
      requirement: 1,
      progress: 0,
      status: 'active',
      xpReward: 200,
      coinReward: 40,
      expiresAt: tomorrow.getTime(),
    },
  ];

  return dailyQuests;
}

/**
 * Generate weekly quests
 */
export async function generateWeeklyQuests(userId: string): Promise<Quest[]> {
  const now = Date.now();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const weeklyQuests: Quest[] = [
    {
      id: `weekly_1_${now}`,
      type: 'weekly',
      name: 'Weekly Warrior',
      description: 'Complete 20 practice sessions this week',
      requirement: 20,
      progress: 0,
      status: 'active',
      xpReward: 500,
      coinReward: 100,
      expiresAt: nextWeek.getTime(),
    },
    {
      id: `weekly_2_${now}`,
      type: 'weekly',
      name: 'Streak Master',
      description: 'Maintain a 7-day streak',
      requirement: 7,
      progress: 0,
      status: 'active',
      xpReward: 750,
      coinReward: 150,
      expiresAt: nextWeek.getTime(),
    },
    {
      id: `weekly_3_${now}`,
      type: 'weekly',
      name: 'Social Champion',
      description: 'Win 10 challenges',
      requirement: 10,
      progress: 0,
      status: 'active',
      xpReward: 1000,
      coinReward: 200,
      expiresAt: nextWeek.getTime(),
    },
  ];

  return weeklyQuests;
}

/**
 * Update quest progress
 */
export async function updateQuestProgress(
  userId: string,
  questId: string,
  progress: number
): Promise<boolean> {
  const progression = await getProgression(userId);
  const quest = progression.quests.find(q => q.id === questId);

  if (!quest || quest.status !== 'active') return false;

  quest.progress = Math.min(progress, quest.requirement);

  if (quest.progress >= quest.requirement) {
    quest.status = 'completed';
  }

  progression.lastUpdated = Date.now();

  await AsyncStorage.setItem(
    `${STORAGE_KEYS.PROGRESSION}_${userId}`,
    JSON.stringify(progression)
  );

  return quest.status === 'completed';
}

/**
 * Claim quest rewards
 */
export async function claimQuestReward(userId: string, questId: string): Promise<boolean> {
  const progression = await getProgression(userId);
  const quest = progression.quests.find(q => q.id === questId);

  if (!quest || quest.status !== 'completed') return false;

  quest.status = 'claimed';
  await addXP(userId, quest.xpReward);

  progression.lastUpdated = Date.now();

  await AsyncStorage.setItem(
    `${STORAGE_KEYS.PROGRESSION}_${userId}`,
    JSON.stringify(progression)
  );

  return true;
}

/**
 * Update profile customization
 */
export async function updateCustomization(
  userId: string,
  customization: Partial<ProfileCustomization>
): Promise<void> {
  const progression = await getProgression(userId);

  progression.customization = {
    ...progression.customization,
    ...customization,
  };

  progression.lastUpdated = Date.now();

  await AsyncStorage.setItem(
    `${STORAGE_KEYS.PROGRESSION}_${userId}`,
    JSON.stringify(progression)
  );
}

/**
 * Get progression statistics
 */
export function getProgressionStats(progression: ProgressionData): {
  totalAchievements: number;
  unlockedAchievements: number;
  achievementProgress: number;
  totalTitles: number;
  unlockedTitles: number;
  completedQuests: number;
  activeQuests: number;
} {
  const totalAchievements = progression.achievements.length;
  const unlockedAchievements = progression.achievements.filter(a => a.isUnlocked).length;
  const achievementProgress = Math.round((unlockedAchievements / totalAchievements) * 100);

  const totalTitles = progression.titles.length;
  const unlockedTitles = progression.titles.filter(t => t.isUnlocked).length;

  const completedQuests = progression.quests.filter(q => q.status === 'claimed').length;
  const activeQuests = progression.quests.filter(q => q.status === 'active').length;

  return {
    totalAchievements,
    unlockedAchievements,
    achievementProgress,
    totalTitles,
    unlockedTitles,
    completedQuests,
    activeQuests,
  };
}

/**
 * Get achievements by tier
 */
export function getAchievementsByTier(
  progression: ProgressionData,
  tier: AchievementTier
): Achievement[] {
  return progression.achievements.filter(a => a.tier === tier);
}

/**
 * Get achievements by rarity
 */
export function getAchievementsByRarity(
  progression: ProgressionData,
  rarity: AchievementRarity
): Achievement[] {
  return progression.achievements.filter(a => a.rarity === rarity);
}

// Import COLORS from theme
const COLORS = {
  surface: '#1a1a2e',
};
