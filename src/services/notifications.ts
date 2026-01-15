import AsyncStorage from '@react-native-async-storage/async-storage';

// Note: This is a mock implementation for demonstration
// In a real app, you would use expo-notifications:
// import * as Notifications from 'expo-notifications';

const STORAGE_KEY = 'keyPerfect_notificationSettings';

export interface NotificationSettings {
  enabled: boolean;
  friendScores: boolean;
  dailyChallenge: boolean;
  streakReminder: boolean;
  tournamentAlerts: boolean;
  practiceReminders: boolean;
  achievements: boolean;
  reminderTime: string; // HH:MM format
}

export interface ScheduledNotification {
  id: string;
  type: 'friend_score' | 'daily_challenge' | 'streak' | 'tournament' | 'practice' | 'achievement';
  title: string;
  body: string;
  scheduledFor: string;
  data?: any;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  friendScores: true,
  dailyChallenge: true,
  streakReminder: true,
  tournamentAlerts: true,
  practiceReminders: true,
  achievements: true,
  reminderTime: '19:00', // 7 PM default
};

// Get notification settings
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Error loading notification settings:', error);
  }
  return DEFAULT_SETTINGS;
}

// Save notification settings
export async function saveNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
  try {
    const current = await getNotificationSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
}

// Request notification permissions (mock)
export async function requestNotificationPermissions(): Promise<boolean> {
  // In a real app:
  // const { status } = await Notifications.requestPermissionsAsync();
  // return status === 'granted';

  console.log('Mock: Notification permissions requested');
  return true;
}

// Schedule a notification (mock)
export async function scheduleNotification(
  title: string,
  body: string,
  trigger: Date | { seconds: number },
  data?: any
): Promise<string> {
  // In a real app:
  // const id = await Notifications.scheduleNotificationAsync({
  //   content: { title, body, data },
  //   trigger,
  // });
  // return id;

  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  console.log('Mock: Scheduled notification:', { id, title, body, trigger, data });
  return id;
}

// Cancel a notification (mock)
export async function cancelNotification(notificationId: string): Promise<void> {
  // In a real app:
  // await Notifications.cancelScheduledNotificationAsync(notificationId);

  console.log('Mock: Cancelled notification:', notificationId);
}

// Cancel all notifications (mock)
export async function cancelAllNotifications(): Promise<void> {
  // In a real app:
  // await Notifications.cancelAllScheduledNotificationsAsync();

  console.log('Mock: Cancelled all notifications');
}

// Friend score notification
export async function notifyFriendScore(friendName: string, score: number, gameMode: string): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.friendScores) return;

  await scheduleNotification(
    '👋 Friend Challenge!',
    `${friendName} scored ${score} in ${gameMode} mode. Can you beat it?`,
    { seconds: 5 },
    { type: 'friend_score', friendName, score, gameMode }
  );
}

// Daily challenge notification
export async function scheduleDailyChallengeNotification(): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.dailyChallenge) return;

  // Schedule for tomorrow at reminder time
  const [hours, minutes] = settings.reminderTime.split(':').map(Number);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hours, minutes, 0, 0);

  await scheduleNotification(
    '🎯 Daily Challenge Available!',
    'A new daily challenge is waiting for you. Complete it for bonus XP!',
    tomorrow,
    { type: 'daily_challenge' }
  );
}

// Streak reminder notification
export async function scheduleStreakReminder(currentStreak: number): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.streakReminder) return;

  // Schedule for tonight if user hasn't practiced
  const [hours, minutes] = settings.reminderTime.split(':').map(Number);
  const tonight = new Date();
  tonight.setHours(hours, minutes, 0, 0);

  // Only schedule if time hasn't passed today
  if (tonight > new Date()) {
    await scheduleNotification(
      `🔥 Don't Break Your ${currentStreak}-Day Streak!`,
      'Practice for just 5 minutes to keep your streak alive.',
      tonight,
      { type: 'streak', currentStreak }
    );
  }
}

// Tournament alert notification
export async function scheduleTournamentAlert(hoursUntilEnd: number, userRank: number): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.tournamentAlerts) return;

  let title = '🏆 Tournament Ending Soon!';
  let body = `Only ${hoursUntilEnd} hours left! You're ranked #${userRank}.`;

  if (userRank <= 10) {
    body += ' You\'re in the prize zone! 🎉';
  } else if (userRank <= 20) {
    body += ' Push for top 10 to win prizes!';
  }

  await scheduleNotification(
    title,
    body,
    { seconds: 10 },
    { type: 'tournament', hoursUntilEnd, userRank }
  );
}

// Practice reminder notification
export async function schedulePracticeReminder(): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.practiceReminders) return;

  const [hours, minutes] = settings.reminderTime.split(':').map(Number);
  const reminderTime = new Date();
  reminderTime.setHours(hours, minutes, 0, 0);

  // If time has passed today, schedule for tomorrow
  if (reminderTime < new Date()) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  const messages = [
    'Time to sharpen your musical ear! 🎵',
    'Your instruments are waiting for you! 🎹',
    'Practice makes perfect pitch! 🎯',
    'Ready to level up your ear training? 🚀',
    'A few minutes of practice can make a big difference! ⭐',
  ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  await scheduleNotification(
    '🎶 Practice Time!',
    randomMessage,
    reminderTime,
    { type: 'practice' }
  );
}

// Achievement unlocked notification
export async function notifyAchievement(achievementName: string, description: string): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.achievements) return;

  await scheduleNotification(
    '🏅 Achievement Unlocked!',
    `${achievementName}: ${description}`,
    { seconds: 2 },
    { type: 'achievement', achievementName }
  );
}

// Tournament prize won notification
export async function notifyTournamentPrize(rank: number, prize: string, xpBonus: number): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.tournamentAlerts) return;

  await scheduleNotification(
    `🏆 You Finished #${rank}!`,
    `Congratulations! You won "${prize}" and earned ${xpBonus} bonus XP!`,
    { seconds: 5 },
    { type: 'tournament_prize', rank, prize, xpBonus }
  );
}

// Initialize daily notifications
export async function initializeDailyNotifications(currentStreak: number): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.enabled) return;

  // Clear existing daily notifications
  await cancelAllNotifications();

  // Schedule daily reminders
  if (settings.practiceReminders) {
    await schedulePracticeReminder();
  }

  if (settings.dailyChallenge) {
    await scheduleDailyChallengeNotification();
  }

  if (settings.streakReminder && currentStreak > 0) {
    await scheduleStreakReminder(currentStreak);
  }
}

// Get notification statistics
export interface NotificationStats {
  totalSent: number;
  totalClicked: number;
  lastNotification: string | null;
  mostEngagingType: string;
}

export async function getNotificationStats(): Promise<NotificationStats> {
  // Mock implementation - in real app, track in analytics
  return {
    totalSent: 47,
    totalClicked: 23,
    lastNotification: new Date(Date.now() - 3600000).toISOString(),
    mostEngagingType: 'tournament',
  };
}
