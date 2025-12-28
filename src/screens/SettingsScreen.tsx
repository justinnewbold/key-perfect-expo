import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { COLORS, SPACING, BORDER_RADIUS, INSTRUMENTS } from '../utils/theme';
import { useApp } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import { Instrument, UserSettings, DEFAULT_SETTINGS } from '../types';
import { clearAllData, clearStats, clearSettings } from '../utils/storage';

// Settings presets
const PRESETS = {
  beginner: {
    name: 'Beginner',
    icon: '🌱',
    description: 'Easier settings for new players',
    settings: {
      autoPlay: true,
      showHints: true,
      hapticFeedback: true,
      octaveRange: { min: 4, max: 4 },
      playbackSpeed: 0.8,
    } as Partial<UserSettings>,
  },
  intermediate: {
    name: 'Intermediate',
    icon: '🎯',
    description: 'Balanced challenge',
    settings: {
      autoPlay: true,
      showHints: false,
      hapticFeedback: true,
      octaveRange: { min: 3, max: 5 },
      playbackSpeed: 1.0,
    } as Partial<UserSettings>,
  },
  advanced: {
    name: 'Advanced',
    icon: '🏆',
    description: 'Maximum challenge',
    settings: {
      autoPlay: false,
      showHints: false,
      hapticFeedback: true,
      octaveRange: { min: 2, max: 6 },
      playbackSpeed: 1.2,
    } as Partial<UserSettings>,
  },
};

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

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    Alert.alert(
      `Apply ${preset.name} Preset?`,
      preset.description,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            updateSettings(preset.settings);
            Alert.alert('Success', `${preset.name} preset applied!`);
          }
        },
      ]
    );
  };

  const exportSettings = async () => {
    try {
      const exportData = JSON.stringify(settings, null, 2);
      await Share.share({
        message: `Key Perfect Settings:\n${exportData}`,
        title: 'Export Settings',
      });
    } catch (error) {
      console.error('Error exporting settings:', error);
    }
  };

  const importSettings = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      if (!clipboardContent) {
        Alert.alert('Error', 'Clipboard is empty. Copy settings JSON first.');
        return;
      }

      try {
        const parsed = JSON.parse(clipboardContent);
        // Validate it has expected fields
        if (typeof parsed.volume === 'number' || typeof parsed.autoPlay === 'boolean') {
          Alert.alert(
            'Import Settings?',
            'This will replace your current settings with the imported ones.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Import',
                onPress: () => {
                  updateSettings(parsed);
                  Alert.alert('Success', 'Settings imported!');
                }
              },
            ]
          );
        } else {
          Alert.alert('Error', 'Invalid settings format in clipboard.');
        }
      } catch {
        Alert.alert('Error', 'Could not parse clipboard content as settings JSON.');
      }
    } catch (error) {
      console.error('Error importing settings:', error);
    }
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

        {/* Quick Presets */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Presets</Text>
          <View style={styles.presetRow}>
            {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((key) => (
              <TouchableOpacity
                key={key}
                style={styles.presetCard}
                onPress={() => applyPreset(key)}
                accessibilityLabel={`${PRESETS[key].name} preset`}
                accessibilityRole="button"
              >
                <Text style={styles.presetIcon}>{PRESETS[key].icon}</Text>
                <Text style={styles.presetName}>{PRESETS[key].name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.exportRow}>
            <TouchableOpacity style={styles.exportButton} onPress={exportSettings}>
              <Ionicons name="share-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.exportButtonText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportButton} onPress={importSettings}>
              <Ionicons name="download-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.exportButtonText}>Import</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

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
  presetRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  presetCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  presetIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  presetName: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  exportRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  exportButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
