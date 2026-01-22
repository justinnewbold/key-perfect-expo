import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { UserStats } from '../types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const STORAGE_KEY = 'keyPerfect_notificationSettings';
const STORAGE_KEYS = {
  PRACTICE_PATTERN: 'keyPerfect_practicePattern',
  NOTIFICATION_HISTORY: 'keyPerfect_notificationHistory',
};

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

// ===== SMART NOTIFICATIONS & HABIT FORMATION =====

export interface PracticePattern {
  userId: string;
  practiceHours: { [hour: number]: number }; // Hour -> count
  averageSessionLength: number;
  consistencyScore: number; // 0-100
  lastPracticeTime: number;
}

/**
 * Analyze user's practice patterns to find optimal notification times
 */
export async function analyzePracticePattern(userId: string, stats?: UserStats): Promise<PracticePattern> {
  try {
    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.PRACTICE_PATTERN}_${userId}`);
    let pattern: PracticePattern;

    if (data) {
      pattern = JSON.parse(data);
    } else {
      pattern = {
        userId,
        practiceHours: {},
        averageSessionLength: 10,
        consistencyScore: 0,
        lastPracticeTime: Date.now(),
      };
    }

    // Update with new session
    const currentHour = new Date().getHours();
    pattern.practiceHours[currentHour] = (pattern.practiceHours[currentHour] || 0) + 1;
    pattern.lastPracticeTime = Date.now();

    // Calculate consistency score based on streak
    if (stats) {
      pattern.consistencyScore = Math.min(100, stats.currentStreak * 10);
    }

    await AsyncStorage.setItem(
      `${STORAGE_KEYS.PRACTICE_PATTERN}_${userId}`,
      JSON.stringify(pattern)
    );

    return pattern;
  } catch (error) {
    console.error('Error analyzing practice pattern:', error);
    return {
      userId,
      practiceHours: {},
      averageSessionLength: 10,
      consistencyScore: 0,
      lastPracticeTime: Date.now(),
    };
  }
}

/**
 * Get optimal notification times based on practice patterns
 */
export async function getOptimalNotificationTimes(userId: string): Promise<number[]> {
  try {
    const pattern = await analyzePracticePattern(userId);

    // Find top 3 hours with most practice sessions
    const sortedHours = Object.entries(pattern.practiceHours)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    if (sortedHours.length > 0) {
      return sortedHours;
    }
  } catch (error) {
    console.error('Error getting optimal times:', error);
  }

  // Default times if no pattern data
  return [7, 12, 18, 21];
}

/**
 * Schedule smart streak protection notification
 */
export async function scheduleSmartStreakProtection(
  userId: string,
  stats: UserStats
): Promise<void> {
  if (stats.currentStreak === 0) return;

  const pattern = await analyzePracticePattern(userId, stats);
  const timeSinceLastPractice = Date.now() - pattern.lastPracticeTime;
  const hoursUntilStreakLoss = 24 - (timeSinceLastPractice / (1000 * 60 * 60));

  if (hoursUntilStreakLoss <= 2 && hoursUntilStreakLoss > 0) {
    const triggerDate = new Date();
    triggerDate.setMinutes(triggerDate.getMinutes() + 15); // Remind in 15 minutes

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔥 Your ${stats.currentStreak}-day streak expires soon!`,
        body: `Quick 5-minute session to keep your ${stats.currentStreak}-day streak alive! 💪`,
        data: { type: 'streak_protection', streakCount: stats.currentStreak },
        sound: true,
      },
      trigger: triggerDate,
    });
  }
}

/**
 * Schedule context-aware daily reminder
 */
export async function scheduleContextAwareDailyReminder(userId: string): Promise<void> {
  const optimalTimes = await getOptimalNotificationTimes(userId);
  const now = new Date();

  const contextMessages = [
    { hour: 7, message: 'Good morning! 3-minute warmup while having coffee?' },
    { hour: 12, message: 'Lunch break? Beat your friend\'s daily score!' },
    { hour: 18, message: 'Evening wind-down: Try tonight\'s relaxing ear training' },
    { hour: 21, message: 'Bedtime ritual: Quick practice before sleep' },
  ];

  // Schedule for the next optimal time
  for (const hour of optimalTimes) {
    const triggerDate = new Date();
    triggerDate.setHours(hour, 0, 0, 0);

    if (triggerDate > now) {
      const contextMsg = contextMessages.find(m => m.hour === hour);
      const message = contextMsg?.message || 'Time to practice! Your ears are waiting.';

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎵 Time to Practice!',
          body: message,
          data: { type: 'daily_reminder', hour },
          sound: true,
        },
        trigger: triggerDate,
      });

      return;
    }
  }

  // Schedule for tomorrow if all times passed
  const triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + 1);
  triggerDate.setHours(optimalTimes[0], 0, 0, 0);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Good Morning! ☀️',
      body: 'Start your day with a quick ear training session!',
      data: { type: 'daily_reminder' },
      sound: true,
    },
    trigger: triggerDate,
  });
}

/**
 * Schedule habit milestone celebration
 */
export async function scheduleHabitMilestone(
  userId: string,
  milestone: number,
  stats: UserStats
): Promise<void> {
  if (stats.currentStreak === milestone) {
    const triggerDate = new Date();
    triggerDate.setMinutes(triggerDate.getMinutes() + 1);

    const messages: { [key: number]: string } = {
      7: '🎉 One week streak! You\'re building an amazing habit!',
      30: '🔥 30 days! You\'re officially a dedicated musician!',
      100: '👑 100 days! You\'re a legend! Keep going!',
      365: '🌟 One YEAR! You\'re an inspiration!',
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎊 ${milestone}-Day Milestone!`,
        body: messages[milestone] || `Amazing ${milestone}-day streak!`,
        data: { type: 'habit_milestone', milestone },
        sound: true,
      },
      trigger: triggerDate,
    });
  }
}

/**
 * Schedule social trigger notifications
 */
export async function scheduleSocialTrigger(
  userId: string,
  triggerType: 'challenge' | 'friend_online' | 'leaderboard',
  message: string
): Promise<void> {
  const triggerDate = new Date();
  triggerDate.setMinutes(triggerDate.getMinutes() + 1);

  const titles = {
    challenge: '⚔️ New Challenge!',
    friend_online: '👋 Friend Online!',
    leaderboard: '🏆 Leaderboard Update!',
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: titles[triggerType],
      body: message,
      data: { type: 'social_trigger', triggerType },
      sound: true,
    },
    trigger: triggerDate,
  });
}

/**
 * Smart notification scheduler - runs periodically
 */
export async function scheduleSmartNotifications(userId: string, stats: UserStats): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.enabled) return;

  // Schedule streak protection if needed
  await scheduleSmartStreakProtection(userId, stats);

  // Schedule context-aware daily reminder
  await scheduleContextAwareDailyReminder(userId);

  // Check for habit milestones
  const milestones = [7, 30, 100, 365];
  for (const milestone of milestones) {
    if (stats.currentStreak === milestone) {
      await scheduleHabitMilestone(userId, milestone, stats);
    }
  }
}
