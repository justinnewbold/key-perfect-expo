import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// Check if sharing is available
export async function isSharingAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    return await Sharing.isAvailableAsync();
  } catch (error) {
    return false;
  }
}

// Share score result
export async function shareScore(
  mode: string,
  score: number,
  highScore: boolean = false
): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) return false;

    const message = highScore
      ? `I just set a new high score of ${score} in ${mode} on Key Perfect! Can you beat it?`
      : `I scored ${score} in ${mode} on Key Perfect! Practice your ear training with me.`;

    await Sharing.shareAsync('', {
      dialogTitle: 'Share Your Score',
      mimeType: 'text/plain',
      UTI: 'public.plain-text',
    });

    return true;
  } catch (error) {
    console.error('Error sharing score:', error);
    return false;
  }
}

// Share achievement
export async function shareAchievement(
  achievementName: string,
  achievementIcon: string
): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) return false;

    const message = `${achievementIcon} I just unlocked "${achievementName}" in Key Perfect! Training my ears one note at a time.`;

    await Sharing.shareAsync('', {
      dialogTitle: 'Share Achievement',
      mimeType: 'text/plain',
      UTI: 'public.plain-text',
    });

    return true;
  } catch (error) {
    console.error('Error sharing achievement:', error);
    return false;
  }
}

// Share streak milestone
export async function shareStreak(streakDays: number): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) return false;

    const message = `I've been practicing ear training for ${streakDays} days in a row on Key Perfect! Consistency is key!`;

    await Sharing.shareAsync('', {
      dialogTitle: 'Share Streak',
      mimeType: 'text/plain',
      UTI: 'public.plain-text',
    });

    return true;
  } catch (error) {
    console.error('Error sharing streak:', error);
    return false;
  }
}

// Share level completion
export async function shareLevelCompletion(
  levelName: string,
  score: number,
  total: number,
  perfect: boolean
): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) return false;

    const message = perfect
      ? `I just completed "${levelName}" with a PERFECT score on Key Perfect! My ears are getting sharper!`
      : `I completed "${levelName}" (${score}/${total}) on Key Perfect! Ear training is fun!`;

    await Sharing.shareAsync('', {
      dialogTitle: 'Share Level Completion',
      mimeType: 'text/plain',
      UTI: 'public.plain-text',
    });

    return true;
  } catch (error) {
    console.error('Error sharing level completion:', error);
    return false;
  }
}

// Share app with friends
export async function shareApp(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) return false;

    const message = `I've been using Key Perfect to train my ears and improve my musical pitch recognition. You should try it too!`;

    await Sharing.shareAsync('', {
      dialogTitle: 'Share Key Perfect',
      mimeType: 'text/plain',
      UTI: 'public.plain-text',
    });

    return true;
  } catch (error) {
    console.error('Error sharing app:', error);
    return false;
  }
}

// Generate share text for copy to clipboard
export function generateShareText(
  type: 'score' | 'achievement' | 'streak' | 'level',
  data: {
    mode?: string;
    score?: number;
    highScore?: boolean;
    achievementName?: string;
    achievementIcon?: string;
    streakDays?: number;
    levelName?: string;
    total?: number;
    perfect?: boolean;
  }
): string {
  switch (type) {
    case 'score':
      return data.highScore
        ? `I just set a new high score of ${data.score} in ${data.mode} on Key Perfect!`
        : `I scored ${data.score} in ${data.mode} on Key Perfect!`;

    case 'achievement':
      return `${data.achievementIcon} I just unlocked "${data.achievementName}" in Key Perfect!`;

    case 'streak':
      return `I've been practicing ear training for ${data.streakDays} days in a row on Key Perfect!`;

    case 'level':
      return data.perfect
        ? `I just completed "${data.levelName}" with a PERFECT score on Key Perfect!`
        : `I completed "${data.levelName}" (${data.score}/${data.total}) on Key Perfect!`;

    default:
      return 'Check out Key Perfect - the best ear training app!';
  }
}
