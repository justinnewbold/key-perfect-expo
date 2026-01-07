import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Application from 'expo-application';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';
import { useApp } from '../context/AppContext';
import { Instrument, ThemeId } from '../types';
import IOSSettingsGroup from '../components/IOSSettingsGroup';
import IOSSettingsRow from '../components/IOSSettingsRow';
import IOSSegmentedControl from '../components/IOSSegmentedControl';
import { safeHaptics } from '../utils/haptics';
import { requestNotificationPermissions, areNotificationsEnabled, scheduleDailyReminder, cancelDailyReminders } from '../services/notifications';
import { requestStoreReview, isStoreReviewAvailable } from '../services/storeReview';
import { shareApp } from '../services/sharing';
import { clearAllData } from '../utils/storage';

const INSTRUMENTS: { id: Instrument; name: string }[] = [
  { id: 'piano', name: 'Piano' },
  { id: 'guitar', name: 'Guitar' },
  { id: 'strings', name: 'Strings' },
  { id: 'synth', name: 'Synth' },
  { id: 'organ', name: 'Organ' },
  { id: 'bass', name: 'Bass' },
  { id: 'brass', name: 'Brass' },
  { id: 'woodwind', name: 'Woodwind' },
];

const THEMES: { id: ThemeId; name: string; color: string }[] = [
  { id: 'purple', name: 'Purple Dream', color: '#667eea' },
  { id: 'ocean', name: 'Ocean Blue', color: '#0984e3' },
  { id: 'sunset', name: 'Sunset Glow', color: '#e17055' },
  { id: 'forest', name: 'Forest Green', color: '#00b894' },
  { id: 'midnight', name: 'Midnight', color: '#2d3436' },
];

export default function SettingsScreen() {
  const { settings, updateSettings, stats, resetStats } = useApp();
  const systemColorScheme = useColorScheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');

  useEffect(() => {
    checkNotificationStatus();
    getAppVersion();
  }, []);

  const checkNotificationStatus = async () => {
    const enabled = await areNotificationsEnabled();
    setNotificationsEnabled(enabled);
  };

  const getAppVersion = async () => {
    if (Platform.OS !== 'web') {
      const version = Application.nativeApplicationVersion || '1.0.0';
      const build = Application.nativeBuildVersion || '1';
      setAppVersion(`${version} (${build})`);
    }
  };

  const handleVolumeChange = (value: number) => {
    updateSettings({ volume: Math.round(value) });
  };

  const handleInstrumentChange = (index: number) => {
    safeHaptics.selectionAsync();
    updateSettings({ instrument: INSTRUMENTS[index].id });
  };

  const handleThemeChange = (themeId: ThemeId) => {
    safeHaptics.selectionAsync();
    updateSettings({ theme: themeId });
  };

  const handleSystemThemeToggle = (value: boolean) => {
    updateSettings({ useSystemTheme: value });
    if (value) {
      updateSettings({ darkMode: systemColorScheme === 'dark' });
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleDailyReminder(settings.notifications?.dailyReminderTime || '09:00');
        updateSettings({
          notifications: { ...settings.notifications, dailyReminderEnabled: true },
        });
        setNotificationsEnabled(true);
      } else {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive practice reminders.',
          [{ text: 'OK' }]
        );
      }
    } else {
      await cancelDailyReminders();
      updateSettings({
        notifications: { ...settings.notifications, dailyReminderEnabled: false },
      });
    }
  };

  const handleRateApp = async () => {
    const available = await isStoreReviewAvailable();
    if (available) {
      await requestStoreReview();
    } else {
      Alert.alert('Thank You!', 'Rating is not available on this device.');
    }
  };

  const handleShareApp = async () => {
    await shareApp();
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all your progress? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            safeHaptics.warningPattern();
            await resetStats();
            Alert.alert('Progress Reset', 'All your progress has been reset.');
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your data including settings, progress, and achievements. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            safeHaptics.gameOverPattern();
            await clearAllData();
            await resetStats();
            Alert.alert('Data Cleared', 'All data has been deleted.');
          },
        },
      ]
    );
  };

  const currentInstrumentIndex = INSTRUMENTS.findIndex(i => i.id === settings.instrument);

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Audio Section */}
        <IOSSettingsGroup title="Audio">
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <View style={[styles.iconBadge, { backgroundColor: '#FF6B6B' }]}>
                <Ionicons name="volume-high" size={18} color="#fff" />
              </View>
              <Text style={styles.sliderLabel}>Volume</Text>
              <Text style={styles.sliderValue}>{settings.volume}%</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={settings.volume}
              onValueChange={handleVolumeChange}
              minimumTrackTintColor={COLORS.xpGradientStart}
              maximumTrackTintColor={COLORS.divider}
              thumbTintColor={Platform.OS === 'android' ? COLORS.xpGradientStart : undefined}
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.instrumentContainer}>
            <View style={styles.instrumentHeader}>
              <View style={[styles.iconBadge, { backgroundColor: '#4ECDC4' }]}>
                <Ionicons name="musical-note" size={18} color="#fff" />
              </View>
              <Text style={styles.sliderLabel}>Instrument</Text>
            </View>
            <IOSSegmentedControl
              values={INSTRUMENTS.slice(0, 4).map(i => i.name)}
              selectedIndex={currentInstrumentIndex < 4 ? currentInstrumentIndex : 0}
              onChange={handleInstrumentChange}
            />
          </View>

          <IOSSettingsRow
            icon="options"
            iconColor="#fff"
            iconBackground="#AA96DA"
            title="Sound Customization"
            subtitle="Octave range, reference pitch, playback speed"
            type="navigation"
            onPress={() => {}}
          />
        </IOSSettingsGroup>

        {/* Practice Section */}
        <IOSSettingsGroup
          title="Practice"
          footer="Adaptive difficulty adjusts question complexity based on your performance."
        >
          <IOSSettingsRow
            icon="play-circle"
            iconColor="#fff"
            iconBackground="#4ECDC4"
            title="Auto-Play Sound"
            type="toggle"
            toggleValue={settings.autoPlay}
            onToggle={(val) => updateSettings({ autoPlay: val })}
          />
          <IOSSettingsRow
            icon="bulb"
            iconColor="#fff"
            iconBackground="#FFE66D"
            title="Show Hints"
            type="toggle"
            toggleValue={settings.showHints}
            onToggle={(val) => updateSettings({ showHints: val })}
          />
          <IOSSettingsRow
            icon="trending-up"
            iconColor="#fff"
            iconBackground="#00b894"
            title="Adaptive Difficulty"
            type="toggle"
            toggleValue={settings.practiceMode?.adaptiveDifficultyEnabled ?? true}
            onToggle={(val) => updateSettings({
              practiceMode: { ...(settings.practiceMode || {}), adaptiveDifficultyEnabled: val },
            })}
          />
          <IOSSettingsRow
            icon="repeat"
            iconColor="#fff"
            iconBackground="#74b9ff"
            title="Loop Mode"
            subtitle="Repeat notes until mastered"
            type="toggle"
            toggleValue={settings.practiceMode?.loopMode ?? false}
            onToggle={(val) => updateSettings({
              practiceMode: { ...(settings.practiceMode || {}), loopMode: val },
            })}
          />
          <IOSSettingsRow
            icon="git-compare"
            iconColor="#fff"
            iconBackground="#fd79a8"
            title="Compare Mode"
            subtitle="Play two sounds side-by-side"
            type="toggle"
            toggleValue={settings.practiceMode?.compareMode ?? false}
            onToggle={(val) => updateSettings({
              practiceMode: { ...(settings.practiceMode || {}), compareMode: val },
            })}
          />
        </IOSSettingsGroup>

        {/* Notifications Section */}
        <IOSSettingsGroup
          title="Notifications"
          footer="Daily reminders help maintain your practice streak."
        >
          <IOSSettingsRow
            icon="notifications"
            iconColor="#fff"
            iconBackground="#FF6B6B"
            title="Daily Reminder"
            type="toggle"
            toggleValue={(settings.notifications?.dailyReminderEnabled ?? false) && notificationsEnabled}
            onToggle={handleNotificationToggle}
          />
          <IOSSettingsRow
            icon="alarm"
            iconColor="#fff"
            iconBackground="#FFE66D"
            title="Reminder Time"
            value={settings.notifications?.dailyReminderTime || '09:00'}
            type="value"
            disabled={!(settings.notifications?.dailyReminderEnabled)}
            onPress={() => {}}
          />
          <IOSSettingsRow
            icon="flame"
            iconColor="#fff"
            iconBackground="#e17055"
            title="Streak Warning"
            subtitle="Alert when streak is at risk"
            type="toggle"
            toggleValue={settings.notifications?.streakReminderEnabled ?? true}
            onToggle={(val) => updateSettings({
              notifications: { ...(settings.notifications || {}), streakReminderEnabled: val },
            })}
          />
        </IOSSettingsGroup>

        {/* Appearance Section */}
        <IOSSettingsGroup title="Appearance">
          <IOSSettingsRow
            icon="moon"
            iconColor="#fff"
            iconBackground="#636e72"
            title="Use System Theme"
            subtitle="Match device dark/light mode"
            type="toggle"
            toggleValue={settings.useSystemTheme ?? true}
            onToggle={handleSystemThemeToggle}
          />
          <View style={styles.themeContainer}>
            <Text style={styles.themeTitle}>Theme</Text>
            <View style={styles.themeGrid}>
              {THEMES.map((theme) => (
                <View
                  key={theme.id}
                  style={[
                    styles.themeOption,
                    settings.theme === theme.id && styles.themeSelected,
                    { backgroundColor: theme.color },
                  ]}
                  onTouchEnd={() => handleThemeChange(theme.id)}
                >
                  {settings.theme === theme.id && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </View>
              ))}
            </View>
          </View>
        </IOSSettingsGroup>

        {/* Accessibility Section */}
        <IOSSettingsGroup
          title="Accessibility"
          footer="Dynamic Type adjusts text size based on your system preferences."
        >
          <IOSSettingsRow
            icon="phone-portrait"
            iconColor="#fff"
            iconBackground="#0984e3"
            title="Haptic Feedback"
            type="toggle"
            toggleValue={settings.hapticFeedback}
            onToggle={(val) => updateSettings({ hapticFeedback: val })}
          />
          <IOSSettingsRow
            icon="speedometer"
            iconColor="#fff"
            iconBackground="#00b894"
            title="Reduced Motion"
            type="toggle"
            toggleValue={settings.reducedMotion ?? false}
            onToggle={(val) => updateSettings({ reducedMotion: val })}
          />
          <IOSSettingsRow
            icon="text"
            iconColor="#fff"
            iconBackground="#6c5ce7"
            title="Dynamic Type"
            type="toggle"
            toggleValue={settings.dynamicTypeEnabled ?? true}
            onToggle={(val) => updateSettings({ dynamicTypeEnabled: val })}
          />
        </IOSSettingsGroup>

        {/* Support Section */}
        <IOSSettingsGroup title="Support">
          <IOSSettingsRow
            icon="star"
            iconColor="#fff"
            iconBackground="#FFE66D"
            title="Rate Key Perfect"
            type="navigation"
            onPress={handleRateApp}
          />
          <IOSSettingsRow
            icon="share"
            iconColor="#fff"
            iconBackground="#4ECDC4"
            title="Share with Friends"
            type="navigation"
            onPress={handleShareApp}
          />
          <IOSSettingsRow
            icon="help-circle"
            iconColor="#fff"
            iconBackground="#74b9ff"
            title="Help & FAQ"
            type="navigation"
            onPress={() => {}}
          />
          <IOSSettingsRow
            icon="mail"
            iconColor="#fff"
            iconBackground="#AA96DA"
            title="Contact Support"
            type="navigation"
            onPress={() => {}}
          />
        </IOSSettingsGroup>

        {/* Data Section */}
        <IOSSettingsGroup
          title="Data"
          footer="Resetting progress will remove all your stats and achievements."
        >
          <IOSSettingsRow
            icon="refresh"
            iconColor="#fff"
            iconBackground="#e17055"
            title="Reset Progress"
            type="button"
            onPress={handleResetProgress}
          />
          <IOSSettingsRow
            icon="trash"
            iconColor={COLORS.error}
            title="Clear All Data"
            type="button"
            destructive
            onPress={handleClearAllData}
          />
        </IOSSettingsGroup>

        {/* About Section */}
        <IOSSettingsGroup title="About">
          <IOSSettingsRow
            icon="information-circle"
            iconColor="#fff"
            iconBackground="#667eea"
            title="Version"
            value={appVersion}
            type="value"
            onPress={() => {}}
          />
          <IOSSettingsRow
            icon="document-text"
            iconColor="#fff"
            iconBackground="#636e72"
            title="Privacy Policy"
            type="navigation"
            onPress={() => {}}
          />
          <IOSSettingsRow
            icon="shield-checkmark"
            iconColor="#fff"
            iconBackground="#00b894"
            title="Terms of Service"
            type="navigation"
            onPress={() => {}}
          />
        </IOSSettingsGroup>

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Your Journey</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalXP.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.correctAnswers}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.longestStreak}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.achievements.length}</Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </View>
          </View>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 120 : 60,
  },
  sliderContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  sliderLabel: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  sliderValue: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.divider,
    marginLeft: SPACING.md + 40,
  },
  instrumentContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  instrumentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  themeContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  themeTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    marginBottom: SPACING.sm,
  },
  themeGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  themeOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  statsContainer: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
  },
  statsTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.xpGradientStart,
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
