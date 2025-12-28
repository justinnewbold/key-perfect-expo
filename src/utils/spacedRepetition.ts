import { UserStats, ItemAccuracy, WeakArea } from '../types';

// Spaced repetition intervals (in days)
const SR_INTERVALS = [1, 2, 4, 7, 14, 30, 60];

// Minimum attempts before considering item for spaced repetition
const MIN_ATTEMPTS_THRESHOLD = 3;

// Accuracy thresholds
const WEAK_THRESHOLD = 0.6; // Below 60% is weak
const STRONG_THRESHOLD = 0.85; // Above 85% is strong

export interface SpacedRepetitionItem {
  item: string;
  type: 'note' | 'chord' | 'interval' | 'scale';
  accuracy: number;
  totalAttempts: number;
  lastPracticed?: string;
  priority: number; // Higher = more urgent
  intervalIndex: number; // Current interval in SR_INTERVALS
}

export interface PracticeRecommendation {
  items: SpacedRepetitionItem[];
  focusArea: 'note' | 'chord' | 'interval' | 'scale' | null;
  message: string;
}

// Calculate priority score for an item
function calculatePriority(
  accuracy: number,
  totalAttempts: number,
  lastPracticed?: string
): number {
  let priority = 0;

  // Lower accuracy = higher priority
  if (accuracy < WEAK_THRESHOLD) {
    priority += (1 - accuracy) * 100;
  } else if (accuracy < STRONG_THRESHOLD) {
    priority += (1 - accuracy) * 50;
  }

  // More attempts with low accuracy = higher priority
  if (totalAttempts >= MIN_ATTEMPTS_THRESHOLD && accuracy < STRONG_THRESHOLD) {
    priority += Math.min(totalAttempts, 20);
  }

  // Items not practiced recently get higher priority
  if (lastPracticed) {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastPracticed).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince > 0) {
      priority += Math.min(daysSince * 2, 30);
    }
  } else {
    // Never practiced = high priority
    priority += 40;
  }

  return priority;
}

// Get the appropriate interval index based on accuracy
function getIntervalIndex(accuracy: number, currentIndex: number): number {
  if (accuracy >= STRONG_THRESHOLD) {
    // Move to next interval (item is learned)
    return Math.min(currentIndex + 1, SR_INTERVALS.length - 1);
  } else if (accuracy < WEAK_THRESHOLD) {
    // Reset to beginning (item needs more practice)
    return 0;
  }
  // Stay at current interval
  return currentIndex;
}

// Analyze accuracy data for a specific type
function analyzeAccuracyData(
  accuracyData: Record<string, ItemAccuracy>,
  type: 'note' | 'chord' | 'interval' | 'scale'
): SpacedRepetitionItem[] {
  const items: SpacedRepetitionItem[] = [];

  Object.entries(accuracyData).forEach(([item, data]) => {
    if (data.total < 1) return; // Skip items with no attempts

    const accuracy = data.total > 0 ? data.correct / data.total : 0;
    // Note: We don't have per-item lastPracticed data, so use undefined
    // This gives items without recent practice higher priority
    const priority = calculatePriority(accuracy, data.total, undefined);
    const intervalIndex = getIntervalIndex(accuracy, 0);

    items.push({
      item,
      type,
      accuracy,
      totalAttempts: data.total,
      lastPracticed: undefined,
      priority,
      intervalIndex,
    });
  });

  return items;
}

// Get all items that need practice based on spaced repetition
export function getItemsForPractice(stats: UserStats): SpacedRepetitionItem[] {
  const allItems: SpacedRepetitionItem[] = [
    ...analyzeAccuracyData(stats.noteAccuracy, 'note'),
    ...analyzeAccuracyData(stats.chordAccuracy, 'chord'),
    ...analyzeAccuracyData(stats.intervalAccuracy, 'interval'),
    ...analyzeAccuracyData(stats.scaleAccuracy, 'scale'),
  ];

  // Sort by priority (highest first)
  return allItems.sort((a, b) => b.priority - a.priority);
}

// Get weak areas that need focused practice
export function getWeakAreas(stats: UserStats): WeakArea[] {
  const weakAreas: WeakArea[] = [];

  // Helper to add weak items
  const addWeakItems = (
    accuracyData: Record<string, ItemAccuracy>,
    type: 'note' | 'chord' | 'interval' | 'scale'
  ) => {
    Object.entries(accuracyData).forEach(([item, data]) => {
      if (data.total >= MIN_ATTEMPTS_THRESHOLD) {
        const accuracy = data.correct / data.total;
        if (accuracy < WEAK_THRESHOLD) {
          weakAreas.push({
            item,
            type,
            attempts: data.total,
            correct: data.correct,
            accuracy: accuracy * 100,
            // Note: We don't have per-item lastPracticed data
            lastPracticed: undefined,
          });
        }
      }
    });
  };

  addWeakItems(stats.noteAccuracy, 'note');
  addWeakItems(stats.chordAccuracy, 'chord');
  addWeakItems(stats.intervalAccuracy, 'interval');
  addWeakItems(stats.scaleAccuracy, 'scale');

  // Sort by accuracy (lowest first)
  return weakAreas.sort((a, b) => a.accuracy - b.accuracy);
}

// Get practice recommendations based on user's data
export function getPracticeRecommendations(stats: UserStats): PracticeRecommendation {
  const items = getItemsForPractice(stats);
  const weakAreas = getWeakAreas(stats);

  if (items.length === 0) {
    return {
      items: [],
      focusArea: null,
      message: 'Start practicing to get personalized recommendations!',
    };
  }

  // Find the focus area (type with most weak items)
  const typeCounts: Record<string, number> = {
    note: 0,
    chord: 0,
    interval: 0,
    scale: 0,
  };

  weakAreas.forEach((area) => {
    typeCounts[area.type]++;
  });

  const focusArea = (Object.entries(typeCounts).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0] || null) as 'note' | 'chord' | 'interval' | 'scale' | null;

  // Generate message
  let message = '';
  if (weakAreas.length === 0) {
    message = 'Great job! You\'re doing well across all areas. Keep practicing to maintain your skills!';
  } else if (weakAreas.length <= 2) {
    message = `Focus on improving: ${weakAreas.map((w) => w.item).join(', ')}`;
  } else {
    message = `You have ${weakAreas.length} items that need practice. Focus on ${focusArea} training today!`;
  }

  return {
    items: items.slice(0, 10), // Top 10 priority items
    focusArea,
    message,
  };
}

// Get study streak status
export function getStudyStreakStatus(stats: UserStats): {
  currentStreak: number;
  longestStreak: number;
  streakStatus: 'new' | 'active' | 'at_risk' | 'broken';
  message: string;
} {
  const today = new Date().toISOString().split('T')[0];
  const lastPractice = stats.lastPracticeDate;

  if (!lastPractice) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakStatus: 'new',
      message: 'Start your practice streak today!',
    };
  }

  const daysSinceLastPractice = Math.floor(
    (new Date(today).getTime() - new Date(lastPractice).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastPractice === 0) {
    return {
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      streakStatus: 'active',
      message: `${stats.currentStreak} day streak! Keep it up!`,
    };
  } else if (daysSinceLastPractice === 1) {
    return {
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      streakStatus: 'at_risk',
      message: 'Practice today to keep your streak alive!',
    };
  } else {
    return {
      currentStreak: 0,
      longestStreak: stats.longestStreak,
      streakStatus: 'broken',
      message: `Streak broken. Start fresh today! Previous best: ${stats.longestStreak} days`,
    };
  }
}

// Calculate mastery level for a type
export function calculateMastery(
  accuracyData: Record<string, ItemAccuracy>
): { level: number; percentage: number } {
  const entries = Object.entries(accuracyData);
  if (entries.length === 0) {
    return { level: 0, percentage: 0 };
  }

  let totalAccuracy = 0;
  let masteredCount = 0;

  entries.forEach(([, data]) => {
    if (data.total >= MIN_ATTEMPTS_THRESHOLD) {
      const accuracy = data.correct / data.total;
      totalAccuracy += accuracy;
      if (accuracy >= STRONG_THRESHOLD) {
        masteredCount++;
      }
    }
  });

  const averageAccuracy =
    entries.length > 0 ? totalAccuracy / entries.length : 0;
  const masteryPercentage =
    entries.length > 0 ? (masteredCount / entries.length) * 100 : 0;

  // Calculate level (0-5)
  const level = Math.min(5, Math.floor(averageAccuracy * 5));

  return { level, percentage: masteryPercentage };
}

export default {
  getItemsForPractice,
  getWeakAreas,
  getPracticeRecommendations,
  getStudyStreakStatus,
  calculateMastery,
};
