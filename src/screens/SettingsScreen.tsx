import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';
import { useApp } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import InstrumentSelector from '../components/InstrumentSelector';
import { Instrument } from '../types';
import { clearAllData } from '../utils/storage';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { settings, updateSettings, stats } = useApp();

  const handleVolumeChange = (increase: boolean) => {
    const newVolume = increase 
      ? Math.min(100, settings.volume + 10)
      : Math.max(0, settings.volume - 10);
    updateSettings({ volume: newVolume });
  };

  const handleInstrumentSelect = (instrumentId: string) => {
    updateSettings({ instrument: instrumentId as Instrument });
  };

  const handlePurchasePack = (packId: string) => {
    // Add the pack to owned packs
    const currentPacks = settings.ownedInstrumentPacks || ['free'];
    if (!currentPacks.includes(packId)) {
      updateSettings({
        ownedInstrumentPacks: [...currentPacks, packId],
      });
    }
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
            try {
              await clearAllData();
              Alert.alert('Success', 'All progress has been reset. Please restart the app.');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to reset progress. Please try again.');
            }
          }
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        bounces={true}
        overScrollMode="always"
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

        </GlassCard>

        {/* Premium Instrument Packs */}
        <GlassCard style={styles.section}>
          <View style={styles.premiumHeader}>
            <View>
              <Text style={styles.sectionTitle}>🎵 Instrument Packs</Text>
              <Text style={styles.premiumSubtitle}>
                Unlock premium instruments for enhanced ear training
              </Text>
            </View>
            <View style={styles.ownedBadge}>
              <Text style={styles.ownedBadgeText}>
                {(settings.ownedInstrumentPacks || ['free']).length} Owned
              </Text>
            </View>
          </View>

          <InstrumentSelector
            selectedInstrument={settings.instrument || 'piano_synth'}
            ownedPacks={settings.ownedInstrumentPacks || ['free']}
            onSelectInstrument={handleInstrumentSelect}
            onPurchasePack={handlePurchasePack}
          />
        </GlassCard>

        {/* Sound Customization */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>🎛️ Sound Customization</Text>

          {/* Octave Range */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="options" size={24} color={COLORS.textPrimary} />
              <View>
                <Text style={styles.settingLabel}>Octave Range</Text>
                <Text style={styles.settingDesc}>Range of octaves for practice</Text>
              </View>
            </View>
            <Text style={styles.settingValueText}>
              {settings.octaveRange?.min ?? 3} - {settings.octaveRange?.max ?? 5}
            </Text>
          </View>

          {/* Reference Pitch */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="musical-note" size={24} color={COLORS.textPrimary} />
              <View>
                <Text style={styles.settingLabel}>Reference Pitch (A4)</Text>
                <Text style={styles.settingDesc}>Standard tuning frequency</Text>
              </View>
            </View>
            <View style={styles.volumeControl}>
              <TouchableOpacity
                style={styles.volumeButton}
                onPress={() => updateSettings({
                  referencePitch: Math.max(430, (settings.referencePitch ?? 440) - 1)
                })}
                accessibilityLabel="Decrease reference pitch"
              >
                <Ionicons name="remove" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.volumeValue}>{settings.referencePitch ?? 440} Hz</Text>
              <TouchableOpacity
                style={styles.volumeButton}
                onPress={() => updateSettings({
                  referencePitch: Math.min(450, (settings.referencePitch ?? 440) + 1)
                })}
                accessibilityLabel="Increase reference pitch"
              >
                <Ionicons name="add" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Interval Play Mode */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="git-compare" size={24} color={COLORS.textPrimary} />
              <View>
                <Text style={styles.settingLabel}>Interval Mode</Text>
                <Text style={styles.settingDesc}>How intervals are played</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => updateSettings({
                intervalPlayMode: settings.intervalPlayMode === 'harmonic' ? 'melodic' : 'harmonic'
              })}
              accessibilityLabel={`Interval mode: ${settings.intervalPlayMode ?? 'harmonic'}`}
              accessibilityRole="button"
            >
              <Text style={styles.toggleButtonText}>
                {(settings.intervalPlayMode ?? 'harmonic') === 'harmonic' ? 'Harmonic' : 'Melodic'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Playback Speed */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="speedometer" size={24} color={COLORS.textPrimary} />
              <View>
                <Text style={styles.settingLabel}>Playback Speed</Text>
                <Text style={styles.settingDesc}>Speed of audio playback</Text>
              </View>
            </View>
            <View style={styles.volumeControl}>
              <TouchableOpacity
                style={styles.volumeButton}
                onPress={() => updateSettings({
                  playbackSpeed: Math.max(0.5, (settings.playbackSpeed ?? 1.0) - 0.1)
                })}
                accessibilityLabel="Decrease playback speed"
              >
                <Ionicons name="remove" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.volumeValue}>{(settings.playbackSpeed ?? 1.0).toFixed(1)}x</Text>
              <TouchableOpacity
                style={styles.volumeButton}
                onPress={() => updateSettings({
                  playbackSpeed: Math.min(2.0, (settings.playbackSpeed ?? 1.0) + 0.1)
                })}
                accessibilityLabel="Increase playback speed"
              >
                <Ionicons name="add" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
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
              accessibilityLabel="Auto-play next question"
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
              accessibilityLabel="Show hints"
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
              accessibilityLabel="Haptic feedback"
            />
          </View>
        </GlassCard>

        {/* Accessibility */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>♿ Accessibility</Text>

          {/* Reduced Motion */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="flash-off" size={24} color={COLORS.textPrimary} />
              <View>
                <Text style={styles.settingLabel}>Reduced Motion</Text>
                <Text style={styles.settingDesc}>Minimize animations for accessibility</Text>
              </View>
            </View>
            <Switch
              value={settings.reducedMotion ?? false}
              onValueChange={(value) => updateSettings({ reducedMotion: value })}
              trackColor={{ false: COLORS.cardBackground, true: COLORS.success + '60' }}
              thumbColor={(settings.reducedMotion ?? false) ? COLORS.success : COLORS.textMuted}
              accessibilityLabel="Reduced motion"
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
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  premiumSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  ownedBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  ownedBadgeText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
  },
  toggleButton: {
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  toggleButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
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
