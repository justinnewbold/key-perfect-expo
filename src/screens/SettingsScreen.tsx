import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, INSTRUMENTS } from '../utils/theme';
import { useApp } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import { Instrument } from '../types';
import { clearAllData } from '../utils/storage';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { settings, updateSettings, stats } = useApp();
  const [showInstruments, setShowInstruments] = useState(false);

  const handleVolumeChange = (increase: boolean) => {
    const newVolume = increase 
      ? Math.min(100, settings.volume + 10)
      : Math.max(0, settings.volume - 10);
    updateSettings({ volume: newVolume });
  };

  const handleInstrumentSelect = (instrument: Instrument) => {
    updateSettings({ instrument });
    setShowInstruments(false);
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'This will delete all your progress, stats, and achievements. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Success', 'All progress has been reset. Please restart the app.');
          }
        },
      ]
    );
  };

  const selectedInstrument = INSTRUMENTS.find(i => i.id === settings.instrument);

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Audio Settings */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 Audio</Text>
          
          {/* Volume */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="volume-high" size={24} color={COLORS.textPrimary} />
              <Text style={styles.settingLabel}>Volume</Text>
            </View>
            <View style={styles.volumeControl}>
              <TouchableOpacity 
                style={styles.volumeButton}
                onPress={() => handleVolumeChange(false)}
              >
                <Ionicons name="remove" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.volumeValue}>{settings.volume}%</Text>
              <TouchableOpacity 
                style={styles.volumeButton}
                onPress={() => handleVolumeChange(true)}
              >
                <Ionicons name="add" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Instrument */}
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => setShowInstruments(!showInstruments)}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>{selectedInstrument?.icon}</Text>
              <Text style={styles.settingLabel}>Instrument</Text>
            </View>
            <View style={styles.settingValue}>
              <Text style={styles.settingValueText}>{selectedInstrument?.name}</Text>
              <Ionicons 
                name={showInstruments ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={COLORS.textSecondary} 
              />
            </View>
          </TouchableOpacity>

          {showInstruments && (
            <View style={styles.instrumentGrid}>
              {INSTRUMENTS.map((instrument) => (
                <TouchableOpacity
                  key={instrument.id}
                  style={[
                    styles.instrumentCard,
                    settings.instrument === instrument.id && styles.instrumentSelected,
                  ]}
                  onPress={() => handleInstrumentSelect(instrument.id as Instrument)}
                >
                  <Text style={styles.instrumentIcon}>{instrument.icon}</Text>
                  <Text style={styles.instrumentName}>{instrument.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </GlassCard>

        {/* Gameplay Settings */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>🎮 Gameplay</Text>
          
          {/* Auto-play */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="play-circle" size={24} color={COLORS.textPrimary} />
              <View>
                <Text style={styles.settingLabel}>Auto-play Next</Text>
                <Text style={styles.settingDesc}>Automatically play the next question</Text>
              </View>
            </View>
            <Switch
              value={settings.autoPlay}
              onValueChange={(value) => updateSettings({ autoPlay: value })}
              trackColor={{ false: COLORS.cardBackground, true: COLORS.success + '60' }}
              thumbColor={settings.autoPlay ? COLORS.success : COLORS.textMuted}
            />
          </View>

          {/* Show Hints */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="help-circle" size={24} color={COLORS.textPrimary} />
              <View>
                <Text style={styles.settingLabel}>Show Hints</Text>
                <Text style={styles.settingDesc}>Display helpful hints during gameplay</Text>
              </View>
            </View>
            <Switch
              value={settings.showHints}
              onValueChange={(value) => updateSettings({ showHints: value })}
              trackColor={{ false: COLORS.cardBackground, true: COLORS.success + '60' }}
              thumbColor={settings.showHints ? COLORS.success : COLORS.textMuted}
            />
          </View>

          {/* Haptic Feedback */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="phone-portrait" size={24} color={COLORS.textPrimary} />
              <View>
                <Text style={styles.settingLabel}>Haptic Feedback</Text>
                <Text style={styles.settingDesc}>Vibrate on button presses</Text>
              </View>
            </View>
            <Switch
              value={settings.hapticFeedback}
              onValueChange={(value) => updateSettings({ hapticFeedback: value })}
              trackColor={{ false: COLORS.cardBackground, true: COLORS.success + '60' }}
              thumbColor={settings.hapticFeedback ? COLORS.success : COLORS.textMuted}
            />
          </View>
        </GlassCard>

        {/* Account Stats */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Your Stats</Text>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total XP</Text>
            <Text style={styles.statValue}>{stats.totalXP.toLocaleString()}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Levels Completed</Text>
            <Text style={styles.statValue}>{stats.levelsCompleted}/8</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Achievements</Text>
            <Text style={styles.statValue}>{stats.achievements.length}/12</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Correct</Text>
            <Text style={styles.statValue}>{stats.correctAnswers.toLocaleString()}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Longest Streak</Text>
            <Text style={styles.statValue}>{stats.longestStreak} days</Text>
          </View>
        </GlassCard>

        {/* About */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About</Text>
          
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Build</Text>
            <Text style={styles.aboutValue}>2024.12.10</Text>
          </View>
          
          <Text style={styles.aboutText}>
            Key Perfect is an advanced ear training application designed to help musicians 
            develop perfect pitch and chord recognition skills through gamified learning.
          </Text>
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard style={[styles.section, styles.dangerSection]}>
          <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
          
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleResetProgress}
          >
            <Ionicons name="trash" size={20} color={COLORS.error} />
            <Text style={styles.dangerButtonText}>Reset All Progress</Text>
          </TouchableOpacity>
          
          <Text style={styles.dangerWarning}>
            This will permanently delete all your progress, stats, and achievements.
          </Text>
        </GlassCard>

        <View style={{ height: 100 }} />
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
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  settingIcon: {
    fontSize: 24,
  },
  settingLabel: {
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  settingDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  settingValueText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  volumeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  volumeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
  instrumentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  instrumentCard: {
    width: '30%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  instrumentSelected: {
    backgroundColor: COLORS.xpGradientStart + '40',
    borderWidth: 1,
    borderColor: COLORS.xpGradientStart,
  },
  instrumentIcon: {
    fontSize: 24,
  },
  instrumentName: {
    color: COLORS.textPrimary,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  aboutLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  aboutValue: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  aboutText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: SPACING.md,
  },
  dangerSection: {
    borderColor: COLORS.error + '40',
  },
  dangerTitle: {
    color: COLORS.error,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.errorLight,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.error + '40',
  },
  dangerButtonText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
  dangerWarning: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
