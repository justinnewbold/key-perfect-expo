import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert, TouchableOpacity } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';
import GlassCard from './GlassCard';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermissions,
  initializeDailyNotifications,
  NotificationSettings as NotificationSettingsType,
} from '../services/notifications';
import { useApp } from '../context/AppContext';

export default function NotificationSettings() {
  const { stats } = useApp();
  const [settings, setSettings] = useState<NotificationSettingsType>({
    enabled: true,
    friendScores: true,
    dailyChallenge: true,
    streakReminder: true,
    tournamentAlerts: true,
    practiceReminders: true,
    achievements: true,
    reminderTime: '19:00',
  });
  const [permissionsGranted, setPermissionsGranted] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const saved = await getNotificationSettings();
    setSettings(saved);
  };

  const updateSetting = async <K extends keyof NotificationSettingsType>(
    key: K,
    value: NotificationSettingsType[K]
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveNotificationSettings({ [key]: value });

    // Re-initialize notifications if settings changed
    if (updated.enabled && (key === 'practiceReminders' || key === 'dailyChallenge' || key === 'streakReminder')) {
      await initializeDailyNotifications(stats.currentStreak);
    }
  };

  const handleEnableNotifications = async (value: boolean) => {
    if (value && !permissionsGranted) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'Please enable notifications in your device settings to receive alerts.',
          [{ text: 'OK' }]
        );
        return;
      }
      setPermissionsGranted(true);
    }

    await updateSetting('enabled', value);

    if (value) {
      await initializeDailyNotifications(stats.currentStreak);
      Alert.alert(
        'Notifications Enabled',
        'You\'ll now receive notifications based on your preferences.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleReminderTimeChange = () => {
    // In a real app, this would open a time picker
    Alert.alert(
      'Set Reminder Time',
      'Choose when you\'d like to receive daily practice reminders.',
      [
        { text: 'Morning (9 AM)', onPress: () => updateSetting('reminderTime', '09:00') },
        { text: 'Afternoon (2 PM)', onPress: () => updateSetting('reminderTime', '14:00') },
        { text: 'Evening (7 PM)', onPress: () => updateSetting('reminderTime', '19:00') },
        { text: 'Night (9 PM)', onPress: () => updateSetting('reminderTime', '21:00') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const notificationTypes = [
    {
      key: 'friendScores' as const,
      icon: 'people',
      title: 'Friend Scores',
      description: 'Get notified when friends beat your scores',
    },
    {
      key: 'dailyChallenge' as const,
      icon: 'calendar',
      title: 'Daily Challenges',
      description: 'Reminders for new daily challenges',
    },
    {
      key: 'streakReminder' as const,
      icon: 'flame',
      title: 'Streak Reminders',
      description: 'Don\'t break your practice streak',
    },
    {
      key: 'tournamentAlerts' as const,
      icon: 'trophy',
      title: 'Tournament Alerts',
      description: 'Updates on tournament standings',
    },
    {
      key: 'practiceReminders' as const,
      icon: 'time',
      title: 'Practice Reminders',
      description: 'Daily reminders to practice',
    },
    {
      key: 'achievements' as const,
      icon: 'medal',
      title: 'Achievements',
      description: 'Celebrate your accomplishments',
    },
  ];

  return (
    <GlassCard style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Ionicons name="notifications" size={24} color={COLORS.primary} />
          <Text style={styles.title}>Notifications</Text>
        </View>
        <Text style={styles.subtitle}>Stay motivated with timely alerts</Text>
      </View>

      {/* Master Toggle */}
      <View style={styles.masterToggle}>
        <View style={styles.settingInfo}>
          <Text style={styles.masterTitle}>Enable Notifications</Text>
          <Text style={styles.settingDescription}>
            Turn all notifications on or off
          </Text>
        </View>
        <Switch
          value={settings.enabled}
          onValueChange={handleEnableNotifications}
          trackColor={{ false: COLORS.glass, true: COLORS.primary + '80' }}
          thumbColor={settings.enabled ? COLORS.primary : COLORS.textMuted}
        />
      </View>

      {settings.enabled && (
        <>
          {/* Reminder Time Selector */}
          <TouchableOpacity
            style={styles.timeSelector}
            onPress={handleReminderTimeChange}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>⏰ Reminder Time</Text>
              <Text style={styles.settingDescription}>
                When to send daily practice reminders
              </Text>
            </View>
            <View style={styles.timeDisplay}>
              <Text style={styles.timeText}>{settings.reminderTime}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>

          {/* Individual Notification Types */}
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Notification Types</Text>

          {notificationTypes.map((type) => (
            <View key={type.key} style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Ionicons name={type.icon as any} size={20} color={COLORS.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{type.title}</Text>
                <Text style={styles.settingDescription}>{type.description}</Text>
              </View>
              <Switch
                value={settings[type.key]}
                onValueChange={(value) => updateSetting(type.key, value)}
                trackColor={{ false: COLORS.glass, true: COLORS.primary + '80' }}
                thumbColor={settings[type.key] ? COLORS.primary : COLORS.textMuted}
              />
            </View>
          ))}

          {/* Info Note */}
          <View style={styles.infoNote}>
            <Ionicons name="information-circle" size={16} color={COLORS.info} />
            <Text style={styles.infoText}>
              Notifications help you stay consistent and engaged. You can customize them anytime.
            </Text>
          </View>
        </>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  masterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.primary + '20',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  masterTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.cardBackground + '40',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  timeText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginVertical: SPACING.md,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.info + '20',
    borderRadius: BORDER_RADIUS.md,
  },
  infoText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
});
