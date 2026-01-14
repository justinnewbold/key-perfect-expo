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
import ProgressChart from '../components/ProgressChart';
import MasteryProgress from '../components/MasteryProgress';
import { ACHIEVEMENTS } from '../types';
import { detectWeakAreas, generateInsights } from '../utils/storage';
import { getPracticeRecommendations, calculateMastery } from '../utils/spacedRepetition';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const navigation = useNavigation<any>();
  const { stats } = useApp();

  const accuracy = stats.totalAttempts > 0 
    ? Math.round((stats.correctAnswers / stats.totalAttempts) * 100) 
    : 0;

  const weakAreas = detectWeakAreas(stats);
  const insights = generateInsights(stats);
  const recommendations = getPracticeRecommendations(stats);

  // Calculate mastery levels for each category
  const masteryCategories = useMemo(() => {
    const noteMastery = calculateMastery(stats.noteAccuracy);
    const chordMastery = calculateMastery(stats.chordAccuracy);
    const intervalMastery = calculateMastery(stats.intervalAccuracy);
    const scaleMastery = calculateMastery(stats.scaleAccuracy);

    return [
      { name: 'Notes', icon: 'musical-note', color: COLORS.info, ...noteMastery },
      { name: 'Chords', icon: 'musical-notes', color: COLORS.success, ...chordMastery },
      { name: 'Intervals', icon: 'git-compare', color: COLORS.intervals, ...intervalMastery },
      { name: 'Scales', icon: 'analytics', color: COLORS.scales, ...scaleMastery },
    ];
  }, [stats.noteAccuracy, stats.chordAccuracy, stats.intervalAccuracy, stats.scaleAccuracy]);

  // Get practice history for the last 7 days
  const practiceHistory = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const history: { label: string; value: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const practiced = stats.practiceDates.includes(dateStr);
      history.push({
        label: days[date.getDay()],
        value: practiced ? 1 : 0,
      });
    }

    return history;
  }, [stats.practiceDates]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const mainStats = [
    { label: 'Total Attempts', value: stats.totalAttempts.toLocaleString(), icon: 'analytics', color: COLORS.info },
    { label: 'Correct', value: stats.correctAnswers.toLocaleString(), icon: 'checkmark-circle', color: COLORS.success },
    { label: 'Accuracy', value: `${accuracy}%`, icon: 'speedometer', color: COLORS.warning },
    { label: 'Practice Time', value: formatTime(stats.totalPracticeTime), icon: 'time', color: COLORS.xpGradientStart },
  ];

  const streakStats = [
    { label: 'Current Streak', value: `${stats.currentStreak} days`, icon: 'flame', color: '#FF6B6B' },
    { label: 'Longest Streak', value: `${stats.longestStreak} days`, icon: 'trophy', color: '#FFE66D' },
  ];

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.container}
      pointerEvents="box-none"
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
          <Text style={styles.title}>Statistics</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* XP Display */}
        <XPDisplay />

        {/* Practice History */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Practice History</Text>
          <ProgressChart
            data={practiceHistory}
            maxValue={1}
            height={80}
            color={COLORS.success}
          />
        </GlassCard>

        {/* Mastery Progress */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school" size={20} color={COLORS.xpGradientStart} />
            <Text style={styles.sectionTitle}>Mastery Progress</Text>
          </View>
          <MasteryProgress categories={masteryCategories} />
        </GlassCard>

        {/* Practice Recommendations */}
        {recommendations.focusArea && (
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="fitness" size={20} color={COLORS.success} />
              <Text style={styles.sectionTitle}>Today's Focus</Text>
            </View>
            <Text style={styles.recommendationText}>{recommendations.message}</Text>
          </GlassCard>
        )}

        {/* Main Stats */}
        <View style={styles.statsGrid}>
          {mainStats.map((stat, index) => (
            <GlassCard key={index} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Streak */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Streak</Text>
          <View style={styles.streakRow}>
            {streakStats.map((stat, index) => (
              <View key={index} style={styles.streakItem}>
                <Ionicons name={stat.icon as any} size={32} color={stat.color} />
                <Text style={styles.streakValue}>{stat.value}</Text>
                <Text style={styles.streakLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* AI Insights */}
        {insights.length > 0 && (
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb" size={20} color={COLORS.warning} />
              <Text style={styles.sectionTitle}>AI Insights</Text>
            </View>
            {insights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <Text style={styles.insightText}>• {insight}</Text>
              </View>
            ))}
          </GlassCard>
        )}

        {/* Weak Areas */}
        {weakAreas.length > 0 && (
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning" size={20} color={COLORS.error} />
              <Text style={styles.sectionTitle}>Areas to Improve</Text>
            </View>
            {weakAreas.slice(0, 5).map((area, index) => (
              <View key={index} style={styles.weakAreaItem}>
                <View style={styles.weakAreaInfo}>
                  <Text style={styles.weakAreaName}>{area.item}</Text>
                  <Text style={styles.weakAreaType}>{area.type}</Text>
                </View>
                <View style={styles.weakAreaAccuracy}>
                  <View style={styles.accuracyBar}>
                    <View 
                      style={[
                        styles.accuracyFill, 
                        { 
                          width: `${area.accuracy}%`,
                          backgroundColor: area.accuracy < 50 ? COLORS.error : COLORS.warning,
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.accuracyText}>{area.accuracy.toFixed(0)}%</Text>
                </View>
              </View>
            ))}
          </GlassCard>
        )}

        {/* Achievements */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={20} color={COLORS.warning} />
            <Text style={styles.sectionTitle}>Achievements</Text>
          </View>
          <Text style={styles.achievementCount}>
            {stats.achievements.length} / {ACHIEVEMENTS.length} Unlocked
          </Text>
          <View style={styles.achievementsGrid}>
            {ACHIEVEMENTS.map((achievement) => {
              const unlocked = stats.achievements.includes(achievement.id);
              return (
                <View 
                  key={achievement.id} 
                  style={[
                    styles.achievementCard,
                    !unlocked && styles.achievementLocked,
                  ]}
                >
                  <Text style={styles.achievementIcon}>
                    {unlocked ? achievement.icon : '🔒'}
                  </Text>
                  <Text style={[
                    styles.achievementName,
                    !unlocked && styles.achievementNameLocked,
                  ]}>
                    {achievement.name}
                  </Text>
                  {unlocked && (
                    <Text style={styles.achievementDesc}>
                      {achievement.description}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </GlassCard>

        {/* Note Accuracy */}
        {Object.keys(stats.noteAccuracy).length > 0 && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Note Accuracy</Text>
            <View style={styles.accuracyGrid}>
              {Object.entries(stats.noteAccuracy).map(([note, data]) => {
                const acc = data.total > 0 ? (data.correct / data.total) * 100 : 0;
                return (
                  <View key={note} style={styles.accuracyItem}>
                    <Text style={styles.accuracyNote}>{note}</Text>
                    <View style={styles.miniBar}>
                      <View 
                        style={[
                          styles.miniFill, 
                          { 
                            width: `${acc}%`,
                            backgroundColor: acc >= 70 ? COLORS.success : acc >= 50 ? COLORS.warning : COLORS.error,
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.accuracyPercent}>{acc.toFixed(0)}%</Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>
        )}

        {/* High Scores */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 High Scores</Text>
          <View style={styles.highScoreRow}>
            <View style={styles.highScoreItem}>
              <Ionicons name="timer" size={24} color={COLORS.speedMode} />
              <Text style={styles.highScoreValue}>{stats.speedModeHighScore}</Text>
              <Text style={styles.highScoreLabel}>Speed Mode</Text>
            </View>
            <View style={styles.highScoreItem}>
              <Ionicons name="heart" size={24} color={COLORS.survivalMode} />
              <Text style={styles.highScoreValue}>{stats.survivalModeHighScore}</Text>
              <Text style={styles.highScoreLabel}>Survival</Text>
            </View>
            <View style={styles.highScoreItem}>
              <Ionicons name="calendar" size={24} color={COLORS.dailyChallenge} />
              <Text style={styles.highScoreValue}>{stats.dailyChallengesCompleted}</Text>
              <Text style={styles.highScoreLabel}>Daily Done</Text>
            </View>
          </View>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  statCard: {
    width: (width - SPACING.md * 2 - SPACING.sm) / 2,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: SPACING.xs,
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
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.sm,
  },
  streakItem: {
    alignItems: 'center',
  },
  streakValue: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: SPACING.xs,
  },
  streakLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  insightItem: {
    marginTop: SPACING.xs,
  },
  insightText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  weakAreaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  weakAreaInfo: {
    flex: 1,
  },
  weakAreaName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  weakAreaType: {
    color: COLORS.textMuted,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  weakAreaAccuracy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  accuracyBar: {
    width: 60,
    height: 6,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  accuracyFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  accuracyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  achievementCount: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  achievementCard: {
    width: (width - SPACING.md * 4 - SPACING.sm * 2) / 3,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementName: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  achievementNameLocked: {
    color: COLORS.textMuted,
  },
  achievementDesc: {
    color: COLORS.textMuted,
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },
  accuracyGrid: {
    marginTop: SPACING.sm,
  },
  accuracyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  accuracyNote: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    width: 40,
  },
  miniBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.full,
    marginHorizontal: SPACING.sm,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  accuracyPercent: {
    color: COLORS.textSecondary,
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
  highScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.sm,
  },
  highScoreItem: {
    alignItems: 'center',
  },
  highScoreValue: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: SPACING.xs,
  },
  highScoreLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  recommendationText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
});
