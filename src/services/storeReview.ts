import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const REVIEW_PROMPTED_KEY = 'keyPerfect_reviewPrompted';
const REVIEW_PROMPT_COUNT_KEY = 'keyPerfect_reviewPromptCount';
const LAST_REVIEW_PROMPT_KEY = 'keyPerfect_lastReviewPrompt';

// Milestones that trigger review prompts
const REVIEW_MILESTONES = {
  LEVELS_COMPLETED: [3, 5, 8], // After completing these many levels
  XP_REACHED: [500, 2000, 5000], // After reaching these XP amounts
  ACHIEVEMENTS: [3, 6, 10], // After earning these many achievements
  STREAK_DAYS: [7, 14, 30], // After these many streak days
};

// Check if store review is available
export async function isStoreReviewAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    return await StoreReview.isAvailableAsync();
  } catch (error) {
    return false;
  }
}

// Request store review
export async function requestStoreReview(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const available = await StoreReview.isAvailableAsync();
    if (!available) return false;

    // Check if we haven't prompted too recently (at least 2 weeks)
    const lastPrompt = await AsyncStorage.getItem(LAST_REVIEW_PROMPT_KEY);
    if (lastPrompt) {
      const daysSinceLastPrompt = Math.floor(
        (Date.now() - parseInt(lastPrompt)) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastPrompt < 14) {
        return false;
      }
    }

    // Check prompt count (max 3 prompts per year)
    const promptCount = await getPromptCount();
    if (promptCount >= 3) {
      const lastPromptDate = parseInt(lastPrompt || '0');
      const daysSinceFirst = Math.floor(
        (Date.now() - lastPromptDate) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceFirst < 365) {
        return false;
      }
      // Reset count after a year
      await AsyncStorage.setItem(REVIEW_PROMPT_COUNT_KEY, '0');
    }

    // Request review
    await StoreReview.requestReview();

    // Update tracking
    await AsyncStorage.setItem(LAST_REVIEW_PROMPT_KEY, Date.now().toString());
    await AsyncStorage.setItem(REVIEW_PROMPT_COUNT_KEY, (promptCount + 1).toString());
    await AsyncStorage.setItem(REVIEW_PROMPTED_KEY, 'true');

    return true;
  } catch (error) {
    console.error('Error requesting store review:', error);
    return false;
  }
}

// Get number of times we've prompted for review
async function getPromptCount(): Promise<number> {
  try {
    const count = await AsyncStorage.getItem(REVIEW_PROMPT_COUNT_KEY);
    return count ? parseInt(count) : 0;
  } catch (error) {
    return 0;
  }
}

// Check if user has been prompted before
export async function hasBeenPromptedForReview(): Promise<boolean> {
  try {
    const prompted = await AsyncStorage.getItem(REVIEW_PROMPTED_KEY);
    return prompted === 'true';
  } catch (error) {
    return false;
  }
}

// Check if should prompt for review based on milestones
export async function shouldPromptForReview(
  levelsCompleted: number,
  totalXP: number,
  achievementsCount: number,
  currentStreak: number,
  lastPromptedLevel: number | null
): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const available = await StoreReview.isAvailableAsync();
    if (!available) return false;

    // Check various milestones
    const levelMilestone = REVIEW_MILESTONES.LEVELS_COMPLETED.find(
      m => levelsCompleted >= m && (lastPromptedLevel === null || m > lastPromptedLevel)
    );

    const xpMilestone = REVIEW_MILESTONES.XP_REACHED.find(
      m => totalXP >= m
    );

    const achievementMilestone = REVIEW_MILESTONES.ACHIEVEMENTS.find(
      m => achievementsCount >= m
    );

    const streakMilestone = REVIEW_MILESTONES.STREAK_DAYS.find(
      m => currentStreak >= m
    );

    // Return true if any milestone is hit
    return !!(levelMilestone || xpMilestone || achievementMilestone || streakMilestone);
  } catch (error) {
    return false;
  }
}

// Trigger review prompt at milestone
export async function triggerReviewAtMilestone(
  milestone: 'level' | 'xp' | 'achievement' | 'streak',
  value: number
): Promise<boolean> {
  // Check if this milestone should trigger a review
  let shouldTrigger = false;

  switch (milestone) {
    case 'level':
      shouldTrigger = REVIEW_MILESTONES.LEVELS_COMPLETED.includes(value);
      break;
    case 'xp':
      shouldTrigger = REVIEW_MILESTONES.XP_REACHED.includes(value);
      break;
    case 'achievement':
      shouldTrigger = REVIEW_MILESTONES.ACHIEVEMENTS.includes(value);
      break;
    case 'streak':
      shouldTrigger = REVIEW_MILESTONES.STREAK_DAYS.includes(value);
      break;
  }

  if (shouldTrigger) {
    return await requestStoreReview();
  }

  return false;
}

// Check if can show in-app review prompt
export async function canShowInAppReviewPrompt(): Promise<boolean> {
  try {
    // Check if we haven't shown too recently
    const lastPrompt = await AsyncStorage.getItem(LAST_REVIEW_PROMPT_KEY);
    if (lastPrompt) {
      const daysSinceLastPrompt = Math.floor(
        (Date.now() - parseInt(lastPrompt)) / (1000 * 60 * 60 * 24)
      );
      return daysSinceLastPrompt >= 30; // At least 30 days between prompts
    }
    return true;
  } catch (error) {
    return false;
  }
}

// Open app store page directly
export async function openAppStorePage(): Promise<void> {
  // This would open the App Store page for the app
  // Implementation depends on having the app store URL
  console.log('Opening app store page...');
}
