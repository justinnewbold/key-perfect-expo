/**
 * Spaced Repetition System (SRS) for ear training
 *
 * Uses a modified SM-2 algorithm adapted for ear training practice.
 * Items are scheduled based on:
 * - Accuracy (correct/total)
 * - Time since last practice
 * - Difficulty rating
 */

import { UserStats, ItemAccuracy } from '../types';

export interface SRSItem {
  item: string;
  type: 'note' | 'chord' | 'interval' | 'scale';
  accuracy: number;
  totalAttempts: number;
  lastPracticed: string | null;
  priority: number; // 1-10, higher = more urgent
  interval: number; // Days until next review
  easeFactor: number; // Difficulty multiplier (1.3-2.5)
  repetitions: number; // Successful repetitions in a row
}

export interface SRSRecommendation {
  items: SRSItem[];
  focusAreas: string[];
  message: string;
}

// Calculate priority based on accuracy and time since last practice
function calculatePriority(
  accuracy: number,
  daysSinceLastPractice: number,
  totalAttempts: number
): number {
  // Base priority from accuracy (lower accuracy = higher priority)
  let priority = (1 - accuracy) * 5;

  // Add urgency based on time since last practice
  if (daysSinceLastPractice > 7) {
    priority += 2;
  } else if (daysSinceLastPractice > 3) {
    priority += 1;
  }

  // Boost priority for items with more attempts (more data = more reliable)
  if (totalAttempts >= 10) {
    priority += 1;
  }

  // Cap at 10
  return Math.min(10, Math.max(1, Math.round(priority)));
}

// Calculate the next review interval using SM-2 algorithm
function calculateNextInterval(
  currentInterval: number,
  easeFactor: number,
  quality: number // 0-5 rating of last response
): { interval: number; easeFactor: number } {
  let newInterval = currentInterval;
  let newEaseFactor = easeFactor;

  if (quality >= 3) {
    // Correct response
    if (currentInterval === 0) {
      newInterval = 1;
    } else if (currentInterval === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * easeFactor);
    }

    // Adjust ease factor
    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEaseFactor = Math.max(1.3, newEaseFactor);
  } else {
    // Incorrect response - reset interval
    newInterval = 1;
    newEaseFactor = Math.max(1.3, easeFactor - 0.2);
  }

  return { interval: newInterval, easeFactor: newEaseFactor };
}

// Get days since a date string
function daysSince(dateString: string | null): number {
  if (!dateString) return 999; // Never practiced

  try {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}

// Convert accuracy data to SRS items
export function generateSRSItems(stats: UserStats): SRSItem[] {
  const items: SRSItem[] = [];

  // Process notes
  Object.entries(stats.noteAccuracy).forEach(([note, data]: [string, ItemAccuracy]) => {
    const accuracy = data.total > 0 ? data.correct / data.total : 0;
    const daysSinceLastPractice = daysSince(stats.lastPracticeDate);

    items.push({
      item: note,
      type: 'note',
      accuracy,
      totalAttempts: data.total,
      lastPracticed: stats.lastPracticeDate || null,
      priority: calculatePriority(accuracy, daysSinceLastPractice, data.total),
      interval: Math.max(1, Math.round(accuracy * 7)), // 1-7 days based on accuracy
      easeFactor: 2.5 - (1 - accuracy), // Lower ease for lower accuracy
      repetitions: data.correct,
    });
  });

  // Process chords
  Object.entries(stats.chordAccuracy).forEach(([chord, data]: [string, ItemAccuracy]) => {
    const accuracy = data.total > 0 ? data.correct / data.total : 0;
    const daysSinceLastPractice = daysSince(stats.lastPracticeDate);

    items.push({
      item: chord,
      type: 'chord',
      accuracy,
      totalAttempts: data.total,
      lastPracticed: stats.lastPracticeDate || null,
      priority: calculatePriority(accuracy, daysSinceLastPractice, data.total),
      interval: Math.max(1, Math.round(accuracy * 7)),
      easeFactor: 2.5 - (1 - accuracy),
      repetitions: data.correct,
    });
  });

  // Process intervals
  Object.entries(stats.intervalAccuracy).forEach(([interval, data]: [string, ItemAccuracy]) => {
    const accuracy = data.total > 0 ? data.correct / data.total : 0;
    const daysSinceLastPractice = daysSince(stats.lastPracticeDate);

    items.push({
      item: interval,
      type: 'interval',
      accuracy,
      totalAttempts: data.total,
      lastPracticed: stats.lastPracticeDate || null,
      priority: calculatePriority(accuracy, daysSinceLastPractice, data.total),
      interval: Math.max(1, Math.round(accuracy * 7)),
      easeFactor: 2.5 - (1 - accuracy),
      repetitions: data.correct,
    });
  });

  // Process scales
  Object.entries(stats.scaleAccuracy).forEach(([scale, data]: [string, ItemAccuracy]) => {
    const accuracy = data.total > 0 ? data.correct / data.total : 0;
    const daysSinceLastPractice = daysSince(stats.lastPracticeDate);

    items.push({
      item: scale,
      type: 'scale',
      accuracy,
      totalAttempts: data.total,
      lastPracticed: stats.lastPracticeDate || null,
      priority: calculatePriority(accuracy, daysSinceLastPractice, data.total),
      interval: Math.max(1, Math.round(accuracy * 7)),
      easeFactor: 2.5 - (1 - accuracy),
      repetitions: data.correct,
    });
  });

  return items;
}

// Get weak areas that need practice (accuracy < 70% with at least 5 attempts)
export function getWeakAreas(stats: UserStats, minAttempts: number = 5): SRSItem[] {
  const allItems = generateSRSItems(stats);

  return allItems
    .filter(item => item.totalAttempts >= minAttempts && item.accuracy < 0.7)
    .sort((a, b) => b.priority - a.priority);
}

// Get recommended items to practice, sorted by priority
export function getRecommendedPractice(
  stats: UserStats,
  limit: number = 10
): SRSRecommendation {
  const allItems = generateSRSItems(stats);

  // Filter to items that need review (either weak or due for review)
  const dueItems = allItems.filter(item => {
    const daysSinceLastPractice = daysSince(item.lastPracticed);
    return (
      item.accuracy < 0.7 || // Weak items
      daysSinceLastPractice >= item.interval || // Due for review
      item.totalAttempts < 5 // Not enough data
    );
  });

  // Sort by priority (descending)
  const sortedItems = dueItems.sort((a, b) => b.priority - a.priority);

  // Get top items
  const recommendedItems = sortedItems.slice(0, limit);

  // Identify focus areas
  const focusAreas: string[] = [];
  const weakNotes = recommendedItems.filter(i => i.type === 'note').length;
  const weakChords = recommendedItems.filter(i => i.type === 'chord').length;
  const weakIntervals = recommendedItems.filter(i => i.type === 'interval').length;

  if (weakNotes >= 3) focusAreas.push('Note recognition');
  if (weakChords >= 3) focusAreas.push('Chord identification');
  if (weakIntervals >= 3) focusAreas.push('Interval training');

  // Generate message
  let message = 'Great job! Keep up the practice.';
  if (recommendedItems.length > 0) {
    const worstItem = recommendedItems[0];
    message = `Focus on "${worstItem.item}" (${Math.round(worstItem.accuracy * 100)}% accuracy). Practice makes perfect!`;
  }

  return {
    items: recommendedItems,
    focusAreas,
    message,
  };
}

// Update SRS data after a practice session
export function updateSRSAfterPractice(
  item: SRSItem,
  wasCorrect: boolean
): SRSItem {
  const quality = wasCorrect ? 4 : 1; // SM-2 quality rating
  const { interval, easeFactor } = calculateNextInterval(
    item.interval,
    item.easeFactor,
    quality
  );

  const newAccuracy = (item.accuracy * item.totalAttempts + (wasCorrect ? 1 : 0)) /
    (item.totalAttempts + 1);

  return {
    ...item,
    accuracy: newAccuracy,
    totalAttempts: item.totalAttempts + 1,
    lastPracticed: new Date().toISOString().split('T')[0],
    priority: calculatePriority(newAccuracy, 0, item.totalAttempts + 1),
    interval,
    easeFactor,
    repetitions: wasCorrect ? item.repetitions + 1 : 0,
  };
}

// Get practice session summary
export function getSessionSummary(
  startItems: SRSItem[],
  endItems: SRSItem[]
): {
  improved: number;
  declined: number;
  maintained: number;
  averageAccuracyChange: number;
} {
  let improved = 0;
  let declined = 0;
  let maintained = 0;
  let totalChange = 0;

  startItems.forEach((start, index) => {
    const end = endItems[index];
    if (!end) return;

    const change = end.accuracy - start.accuracy;
    totalChange += change;

    if (change > 0.05) improved++;
    else if (change < -0.05) declined++;
    else maintained++;
  });

  return {
    improved,
    declined,
    maintained,
    averageAccuracyChange: startItems.length > 0 ? totalChange / startItems.length : 0,
  };
}
