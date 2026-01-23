import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStats } from '../types';

const STORAGE_KEYS = {
  STREAK_REWARDS: 'keyPerfect_streakRewards',
  POWER_UPS: 'keyPerfect_powerUps',
  ACTIVE_MULTIPLIERS: 'keyPerfect_activeMultipliers',
};

export interface StreakMilestone {
  days: number;
  title: string;
  description: string;
  rewards: StreakReward[];
  badge: string;
  claimed: boolean;
}

export interface StreakReward {
  type: 'xp' | 'shield' | 'multiplier' | 'pack' | 'badge';
  amount?: number;
  duration?: number; // minutes for multipliers
  packId?: string;
  badgeId?: string;
}

export interface PowerUp {
  id: string;
  type: 'streak_shield' | 'xp_multiplier' | 'double_xp' | 'time_freeze';
  name: string;
  description: string;
  icon: string;
  quantity: number;
  expiresAt?: string;
}

export interface ActiveMultiplier {
  id: string;
  type: 'xp_2x' | 'xp_3x' | 'xp_5x';
  multiplier: number;
  activatedAt: string;
  expiresAt: string;
}

// Streak milestones with rewards
export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    days: 3,
    title: '3-Day Streak',
    description: 'You\'re building a habit!',
    badge: '🔥',
    claimed: false,
    rewards: [
      { type: 'xp', amount: 100 },
      { type: 'shield', amount: 1 },
    ],
  },
  {
    days: 7,
    title: 'Week Warrior',
    description: 'One full week of practice!',
    badge: '⭐',
    claimed: false,
    rewards: [
      { type: 'xp', amount: 500 },
      { type: 'multiplier', amount: 2, duration: 60 },
      { type: 'shield', amount: 2 },
    ],
  },
  {
    days: 14,
    title: 'Fortnight Fighter',
    description: 'Two weeks strong!',
    badge: '💪',
    claimed: false,
    rewards: [
      { type: 'xp', amount: 1000 },
      { type: 'shield', amount: 3 },
    ],
  },
  {
    days: 30,
    title: 'Monthly Master',
    description: 'A full month of dedication!',
    badge: '🏆',
    claimed: false,
    rewards: [
      { type: 'xp', amount: 3000 },
      { type: 'multiplier', amount: 3, duration: 120 },
      { type: 'shield', amount: 5 },
      { type: 'badge', badgeId: 'monthly_master' },
    ],
  },
  {
    days: 50,
    title: 'Halfway Hero',
    description: 'Halfway to 100!',
    badge: '🌟',
    claimed: false,
    rewards: [
      { type: 'xp', amount: 5000 },
      { type: 'shield', amount: 5 },
    ],
  },
  {
    days: 100,
    title: 'Century Champion',
    description: '100 days of pure dedication!',
    badge: '💯',
    claimed: false,
    rewards: [
      { type: 'xp', amount: 10000 },
      { type: 'multiplier', amount: 5, duration: 180 },
      { type: 'shield', amount: 10 },
      { type: 'pack', packId: 'real_piano' },
      { type: 'badge', badgeId: 'century_champion' },
    ],
  },
  {
    days: 180,
    title: 'Half Year Hero',
    description: 'Six months of consistency!',
    badge: '🎯',
    claimed: false,
    rewards: [
      { type: 'xp', amount: 20000 },
      { type: 'shield', amount: 15 },
      { type: 'pack', packId: 'jazz' },
    ],
  },
  {
    days: 365,
    title: 'Year Legend',
    description: 'A full year! You\'re unstoppable!',
    badge: '👑',
    claimed: false,
    rewards: [
      { type: 'xp', amount: 50000 },
      { type: 'multiplier', amount: 5, duration: 1440 }, // 24 hours
      { type: 'shield', amount: 25 },
      { type: 'pack', packId: 'all_instruments' },
      { type: 'badge', badgeId: 'year_legend' },
    ],
  },
];

// Get claimed milestones
export async function getClaimedMilestones(): Promise<number[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_REWARDS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading claimed milestones:', error);
  }
  return [];
}

// Save claimed milestones
async function saveClaimedMilestones(milestones: number[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.STREAK_REWARDS, JSON.stringify(milestones));
  } catch (error) {
    console.error('Error saving claimed milestones:', error);
  }
}

// Get available milestones for current streak
export async function getAvailableMilestones(currentStreak: number): Promise<StreakMilestone[]> {
  const claimed = await getClaimedMilestones();

  return STREAK_MILESTONES.map(milestone => ({
    ...milestone,
    claimed: claimed.includes(milestone.days),
  })).filter(m => m.days <= currentStreak);
}

// Get next milestone
export function getNextMilestone(currentStreak: number): StreakMilestone | null {
  return STREAK_MILESTONES.find(m => m.days > currentStreak) || null;
}

// Claim milestone rewards
export async function claimMilestoneRewards(
  milestoneDay: number,
  onXpReward: (xp: number) => Promise<void>,
  onPackReward?: (packId: string) => void
): Promise<{
  success: boolean;
  rewards: StreakReward[];
  error?: string;
}> {
  try {
    const claimed = await getClaimedMilestones();

    if (claimed.includes(milestoneDay)) {
      return { success: false, rewards: [], error: 'Already claimed' };
    }

    const milestone = STREAK_MILESTONES.find(m => m.days === milestoneDay);
    if (!milestone) {
      return { success: false, rewards: [], error: 'Milestone not found' };
    }

    // Process rewards
    for (const reward of milestone.rewards) {
      switch (reward.type) {
        case 'xp':
          if (reward.amount) {
            await onXpReward(reward.amount);
          }
          break;

        case 'shield':
          if (reward.amount) {
            await addPowerUp('streak_shield', reward.amount);
          }
          break;

        case 'multiplier':
          if (reward.amount && reward.duration) {
            await activateXpMultiplier(reward.amount, reward.duration);
          }
          break;

        case 'pack':
          if (reward.packId && onPackReward) {
            onPackReward(reward.packId);
          }
          break;

        case 'badge':
          // Badges handled by achievement system
          break;
      }
    }

    // Mark as claimed
    claimed.push(milestoneDay);
    await saveClaimedMilestones(claimed);

    return { success: true, rewards: milestone.rewards };
  } catch (error) {
    console.error('Error claiming milestone:', error);
    return { success: false, rewards: [], error: 'Failed to claim rewards' };
  }
}

// Power-ups management
export async function getPowerUps(): Promise<PowerUp[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.POWER_UPS);
    if (data) {
      const powerUps: PowerUp[] = JSON.parse(data);
      // Filter out expired power-ups
      return powerUps.filter(p => !p.expiresAt || new Date(p.expiresAt) > new Date());
    }
  } catch (error) {
    console.error('Error loading power-ups:', error);
  }
  return [];
}

async function savePowerUps(powerUps: PowerUp[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.POWER_UPS, JSON.stringify(powerUps));
  } catch (error) {
    console.error('Error saving power-ups:', error);
  }
}

// Add power-up
async function addPowerUp(type: PowerUp['type'], quantity: number = 1): Promise<void> {
  const powerUps = await getPowerUps();
  const existing = powerUps.find(p => p.type === type);

  if (existing) {
    existing.quantity += quantity;
  } else {
    const newPowerUp: PowerUp = {
      id: `powerup_${Date.now()}`,
      type,
      name: getPowerUpName(type),
      description: getPowerUpDescription(type),
      icon: getPowerUpIcon(type),
      quantity,
    };
    powerUps.push(newPowerUp);
  }

  await savePowerUps(powerUps);
}

// Use streak shield
export async function useStreakShield(): Promise<boolean> {
  const powerUps = await getPowerUps();
  const shield = powerUps.find(p => p.type === 'streak_shield' && p.quantity > 0);

  if (shield) {
    shield.quantity -= 1;
    await savePowerUps(powerUps);
    return true;
  }

  return false;
}

// Check if user has streak shield
export async function hasStreakShield(): Promise<boolean> {
  const powerUps = await getPowerUps();
  const shield = powerUps.find(p => p.type === 'streak_shield');
  return shield ? shield.quantity > 0 : false;
}

// XP Multiplier management
export async function activateXpMultiplier(multiplier: number, durationMinutes: number): Promise<void> {
  const multipliers = await getActiveMultipliers();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

  const newMultiplier: ActiveMultiplier = {
    id: `mult_${Date.now()}`,
    type: `xp_${multiplier}x` as ActiveMultiplier['type'],
    multiplier,
    activatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  multipliers.push(newMultiplier);
  await saveActiveMultipliers(multipliers);
}

export async function getActiveMultipliers(): Promise<ActiveMultiplier[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_MULTIPLIERS);
    if (data) {
      const multipliers: ActiveMultiplier[] = JSON.parse(data);
      // Filter out expired multipliers
      return multipliers.filter(m => new Date(m.expiresAt) > new Date());
    }
  } catch (error) {
    console.error('Error loading multipliers:', error);
  }
  return [];
}

async function saveActiveMultipliers(multipliers: ActiveMultiplier[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_MULTIPLIERS, JSON.stringify(multipliers));
  } catch (error) {
    console.error('Error saving multipliers:', error);
  }
}

// Get current XP multiplier
export async function getCurrentXpMultiplier(): Promise<number> {
  const multipliers = await getActiveMultipliers();
  if (multipliers.length === 0) return 1.0;

  // Return highest active multiplier
  return Math.max(...multipliers.map(m => m.multiplier));
}

// Apply XP with active multipliers
export async function calculateXpWithMultipliers(baseXp: number): Promise<number> {
  const multiplier = await getCurrentXpMultiplier();
  return Math.round(baseXp * multiplier);
}

// Helper functions
function getPowerUpName(type: PowerUp['type']): string {
  switch (type) {
    case 'streak_shield': return 'Streak Shield';
    case 'xp_multiplier': return 'XP Multiplier';
    case 'double_xp': return 'Double XP';
    case 'time_freeze': return 'Time Freeze';
    default: return 'Power-up';
  }
}

function getPowerUpDescription(type: PowerUp['type']): string {
  switch (type) {
    case 'streak_shield': return 'Protect your streak from breaking once';
    case 'xp_multiplier': return 'Multiply your XP earnings for a limited time';
    case 'double_xp': return 'Earn 2x XP for 1 hour';
    case 'time_freeze': return 'Freeze the timer in Speed Mode';
    default: return 'A special power-up';
  }
}

function getPowerUpIcon(type: PowerUp['type']): string {
  switch (type) {
    case 'streak_shield': return '🛡️';
    case 'xp_multiplier': return '⚡';
    case 'double_xp': return '💫';
    case 'time_freeze': return '❄️';
    default: return '✨';
  }
}

// Get streak statistics
export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalDaysPracticed: number;
  nextMilestone: StreakMilestone | null;
  daysUntilNext: number;
  unclaimedRewards: number;
  streakProtected: boolean;
}

export async function getStreakStats(stats: UserStats): Promise<StreakStats> {
  const available = await getAvailableMilestones(stats.currentStreak);
  const unclaimed = available.filter(m => !m.claimed).length;
  const nextMilestone = getNextMilestone(stats.currentStreak);
  const hasShield = await hasStreakShield();

  return {
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    totalDaysPracticed: stats.levelsCompleted, // Approximation
    nextMilestone,
    daysUntilNext: nextMilestone ? nextMilestone.days - stats.currentStreak : 0,
    unclaimedRewards: unclaimed,
    streakProtected: hasShield,
  };
}
