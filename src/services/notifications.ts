import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for notification permissions
const NOTIFICATION_PERMISSION_KEY = 'keyPerfect_notificationPermission';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted') {
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

// Check if notifications are enabled
export async function areNotificationsEnabled(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    return false;
  }
}

// Schedule daily reminder notification
export async function scheduleDailyReminder(time: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    // Cancel existing daily reminders
    await cancelDailyReminders();

    const [hours, minutes] = time.split(':').map(Number);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to Practice!',
        body: 'Keep your streak alive with a quick ear training session.',
        sound: true,
        badge: 1,
        data: { type: 'daily_reminder' },
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });

    return identifier;
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    return null;
  }
}

// Cancel daily reminder notifications
export async function cancelDailyReminders(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const dailyReminders = scheduled.filter(
      n => n.content.data?.type === 'daily_reminder'
    );

    for (const reminder of dailyReminders) {
      await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
    }
  } catch (error) {
    console.error('Error canceling daily reminders:', error);
  }
}

// Schedule streak warning notification
export async function scheduleStreakWarning(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    // Cancel existing streak warnings
    await cancelStreakWarnings();

    // Schedule for 8 PM if user hasn't practiced today
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your Streak is at Risk!',
        body: "Don't lose your progress - practice now to keep your streak!",
        sound: true,
        badge: 1,
        data: { type: 'streak_warning' },
      },
      trigger: {
        hour: 20,
        minute: 0,
        repeats: true,
      },
    });

    return identifier;
  } catch (error) {
    console.error('Error scheduling streak warning:', error);
    return null;
  }
}

// Cancel streak warning notifications
export async function cancelStreakWarnings(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const warnings = scheduled.filter(
      n => n.content.data?.type === 'streak_warning'
    );

    for (const warning of warnings) {
      await Notifications.cancelScheduledNotificationAsync(warning.identifier);
    }
  } catch (error) {
    console.error('Error canceling streak warnings:', error);
  }
}

// Send achievement notification
export async function sendAchievementNotification(
  achievementName: string,
  achievementIcon: string
): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${achievementIcon} Achievement Unlocked!`,
        body: `You've earned: ${achievementName}`,
        sound: true,
        data: { type: 'achievement', achievement: achievementName },
      },
      trigger: null, // Immediate notification
    });
  } catch (error) {
    console.error('Error sending achievement notification:', error);
  }
}

// Send level up notification
export async function sendLevelUpNotification(newLevel: number, title: string): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Level Up!',
        body: `You've reached level ${newLevel}! You're now a ${title}.`,
        sound: true,
        data: { type: 'level_up', level: newLevel },
      },
      trigger: null, // Immediate notification
    });
  } catch (error) {
    console.error('Error sending level up notification:', error);
  }
}

// Send weekly progress notification
export async function scheduleWeeklyProgressNotification(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    // Cancel existing weekly notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const weekly = scheduled.filter(n => n.content.data?.type === 'weekly_progress');
    for (const n of weekly) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }

    // Schedule for Sunday at 6 PM
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Weekly Progress Report',
        body: 'Check out how much you improved this week!',
        sound: true,
        data: { type: 'weekly_progress' },
      },
      trigger: {
        weekday: 1, // Sunday
        hour: 18,
        minute: 0,
        repeats: true,
      },
    });

    return identifier;
  } catch (error) {
    console.error('Error scheduling weekly progress notification:', error);
    return null;
  }
}

// Clear all notifications
export async function clearAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

// Get badge count
export async function getBadgeCount(): Promise<number> {
  if (Platform.OS === 'web') return 0;

  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    return 0;
  }
}

// Set badge count
export async function setBadgeCount(count: number): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
}

// Clear badge
export async function clearBadge(): Promise<void> {
  await setBadgeCount(0);
}
