import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useApp } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import XPDisplay from '../components/XPDisplay';
import PracticeCoach from '../components/PracticeCoach';
import EnhancedAICoach from '../components/EnhancedAICoach';
import TournamentBanner from '../components/TournamentBanner';
import StreakDashboard from '../components/StreakDashboard';
import OfflineIndicator from '../components/OfflineIndicator';
import { GAME_MODES, LEVELS, WeakArea } from '../types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { stats, levelInfo } = useApp();

  const quickStats = [
    { 
      label: 'Streak', 
      value: `${stats.currentStreak}🔥`, 
      color: COLORS.warning 
    },
    { 
      label: 'Accuracy', 
      value: stats.totalAttempts > 0 
        ? `${Math.round((stats.correctAnswers / stats.totalAttempts) * 100)}%` 
        : '0%',
      color: COLORS.success 
    },
    { 
      label: 'Levels', 
      value: `${stats.levelsCompleted}/8`, 
      color: COLORS.info 
    },
  ];

  const unlockedCount = stats.unlockedLevels.length;
  const completedCount = Object.keys(stats.levelScores).length;
  // Safe index for LEVELS array (handle edge case where unlockedCount is 0)
  const currentLevelIndex = Math.max(0, Math.min(unlockedCount - 1, LEVELS.length - 1));
  const currentLevel = LEVELS[currentLevelIndex];

  // Fallback if LEVELS array is empty or undefined
  if (!currentLevel) {
    console.error('LEVELS array is empty or undefined');
    return null;
  }

  const handleStartPractice = (weakAreas: WeakArea[]) => {
    if (weakAreas.length > 0) {
      navigation.navigate('WeakAreas');
    } else {
      // No weak areas, suggest challenge modes
      navigation.navigate('GameModes');
    }
  };

  // Memoize the sliced game modes to prevent unnecessary re-renders
  const quickGameModes = useMemo(() => GAME_MODES.slice(0, 4), []);

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
          <View>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.title}>Key Perfect</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Settings"
            accessibilityRole="button"
            accessibilityHint="Open app settings"
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* XP Display */}
        <XPDisplay />

        {/* Offline Indicator */}
        <OfflineIndicator />

        {/* Quick Access */}
        <View style={styles.quickAccessRow}>
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => navigation.navigate('Analytics')}
            accessibilityLabel="View Analytics"
            accessibilityRole="button"
          >
            <Ionicons name="analytics" size={24} color={COLORS.info} />
            <Text style={styles.quickAccessLabel}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => navigation.navigate('EventsCalendar')}
            accessibilityLabel="View Events"
            accessibilityRole="button"
          >
            <Ionicons name="calendar" size={24} color={COLORS.success} />
            <Text style={styles.quickAccessLabel}>Live Events</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          {quickStats.map((stat) => (
            <GlassCard
              key={stat.label}
              style={styles.statCard}
              accessibilityLabel={`${stat.label}: ${stat.value}`}
              accessibilityRole="text"
            >
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Streak Dashboard */}
        {stats.currentStreak > 0 && (
          <StreakDashboard style={styles.section} />
        )}

        {/* Weekly Tournament Banner */}
        <TournamentBanner style={styles.section} />

        {/* Enhanced AI Coach */}
        {stats.totalAttempts > 10 && (
          <EnhancedAICoach
            stats={stats}
            style={styles.section}
          />
        )}

        {/* Continue Learning */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Levels')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.continueCard}
            onPress={() => navigation.navigate('Levels')}
            accessibilityLabel={`Continue Level ${currentLevelIndex + 1}: ${currentLevel.name}`}
            accessibilityRole="button"
            accessibilityHint="Continue to your current level"
          >
            <View style={styles.continueContent}>
              <View style={styles.progressCircle}>
                <Text style={styles.progressText}>{completedCount}/8</Text>
              </View>
              <View style={styles.continueInfo}>
                <Text style={styles.continueTitle}>
                  Level {currentLevelIndex + 1}: {currentLevel.name}
                </Text>
                <Text style={styles.continueSubtitle}>
                  {currentLevel.description}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </GlassCard>

        {/* Quick Play */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Play</Text>
          <View style={styles.quickPlayGrid}>
            <TouchableOpacity
              style={[styles.quickPlayCard, { backgroundColor: COLORS.speedMode + '30' }]}
              onPress={() => navigation.navigate('GameMode', { mode: 'speed' })}
              accessibilityLabel="Speed Mode"
              accessibilityRole="button"
              accessibilityHint="30 seconds to answer as many as possible"
            >
              <Ionicons name="timer-outline" size={32} color={COLORS.speedMode} />
              <Text style={styles.quickPlayLabel}>Speed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickPlayCard, { backgroundColor: COLORS.survivalMode + '30' }]}
              onPress={() => navigation.navigate('GameMode', { mode: 'survival' })}
              accessibilityLabel="Survival Mode"
              accessibilityRole="button"
              accessibilityHint="3 lives, progressive difficulty"
            >
              <Ionicons name="heart-outline" size={32} color={COLORS.survivalMode} />
              <Text style={styles.quickPlayLabel}>Survival</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickPlayCard, { backgroundColor: COLORS.dailyChallenge + '30' }]}
              onPress={() => navigation.navigate('GameMode', { mode: 'daily' })}
              accessibilityLabel="Daily Challenge"
              accessibilityRole="button"
              accessibilityHint="New challenge every day"
            >
              <Ionicons name="calendar-outline" size={32} color={COLORS.dailyChallenge} />
              <Text style={styles.quickPlayLabel}>Daily</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickPlayCard, { backgroundColor: COLORS.error + '30' }]}
              onPress={() => navigation.navigate('WeakAreas')}
              accessibilityLabel="Weak Areas Practice"
              accessibilityRole="button"
              accessibilityHint="Practice items you struggle with using spaced repetition"
            >
              <Ionicons name="fitness-outline" size={32} color={COLORS.error} />
              <Text style={styles.quickPlayLabel}>Weak Areas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickPlayCard, { backgroundColor: '#9B59B6' + '30' }]}
              onPress={() => navigation.navigate('SingBack')}
              accessibilityLabel="Sing Back Mode"
              accessibilityRole="button"
              accessibilityHint="Listen and sing notes back to train your voice"
            >
              <Ionicons name="mic-outline" size={32} color="#9B59B6" />
              <Text style={styles.quickPlayLabel}>Sing Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickPlayCard, { backgroundColor: '#F39C12' + '30' }]}
              onPress={() => navigation.navigate('Leaderboard')}
              accessibilityLabel="Leaderboards and Social"
              accessibilityRole="button"
              accessibilityHint="View rankings and challenge friends"
            >
              <Ionicons name="trophy-outline" size={32} color="#F39C12" />
              <Text style={styles.quickPlayLabel}>Social</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Game Modes */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Game Modes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('GameModes')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modesScroll}
          >
            {quickGameModes.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={[styles.modeCard, { backgroundColor: mode.color + '30' }]}
                onPress={() => navigation.navigate('GameMode', { mode: mode.id })}
                accessibilityLabel={`${mode.name} mode`}
                accessibilityRole="button"
                accessibilityHint={mode.description}
              >
                <View style={[styles.modeIcon, { backgroundColor: mode.color + '50' }]}>
                  <Ionicons name={mode.icon as any} size={24} color={mode.color} />
                </View>
                <Text style={styles.modeName}>{mode.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </GlassCard>

        {/* Bottom spacing */}
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
  welcomeText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  section: {
    marginTop: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  seeAll: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.xs,
  },
  continueContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.xpGradientStart + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  progressText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  continueInfo: {
    flex: 1,
  },
  continueTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  continueSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  quickPlayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  quickPlayCard: {
    flex: 1,
    minWidth: (width - SPACING.md * 4 - SPACING.sm * 3) / 2,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPlayLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  modesScroll: {
    paddingTop: SPACING.xs,
    gap: SPACING.sm,
  },
  modeCard: {
    width: 100,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  modeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeName: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  quickAccessRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginVertical: SPACING.sm,
  },
  quickAccessCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground + '80',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  quickAccessLabel: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});
