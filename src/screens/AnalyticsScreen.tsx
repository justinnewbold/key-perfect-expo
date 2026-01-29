import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useApp } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import { SkeletonCard, SkeletonList } from '../components/SkeletonLoader';
import { useToast } from '../components/ToastNotification';
import {
  getAnalyticsDashboard,
  AnalyticsDashboard,
  AnalyticsInsight,
  Goal,
  createGoal,
  deleteGoal,
} from '../services/analytics';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const navigation = useNavigation<any>();
  const { stats } = useApp();
  const toast = useToast();
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [stats]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await getAnalyticsDashboard(stats);
      setDashboard(data);
      toast.success('Analytics updated!');
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboard) {
    return (
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Your Analytics</Text>
            <View style={{ width: 24 }} />
          </View>
          <Text style={styles.loadingText}>Analyzing your progress...</Text>
          <SkeletonList count={5} />
        </ScrollView>
      </LinearGradient>
    );
  }

  const getTrendIcon = () => {
    switch (dashboard.performanceTrend.trend) {
      case 'improving':
        return { name: 'trending-up', color: COLORS.success };
      case 'declining':
        return { name: 'trending-down', color: COLORS.error };
      default:
        return { name: 'remove', color: COLORS.textSecondary };
    }
  };

  const trendIcon = getTrendIcon();

  return (
    <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Your Analytics</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Performance Trend */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name={trendIcon.name as any} size={24} color={trendIcon.color} />
            <Text style={styles.sectionTitle}>Performance Trend</Text>
          </View>
          <View style={styles.trendStats}>
            <View style={styles.trendStat}>
              <Text style={styles.trendValue}>
                {dashboard.performanceTrend.accuracyChange >= 0 ? '+' : ''}
                {dashboard.performanceTrend.accuracyChange.toFixed(1)}%
              </Text>
              <Text style={styles.trendLabel}>Accuracy Change</Text>
            </View>
            <View style={styles.trendStat}>
              <Text style={[styles.trendValue, { color: trendIcon.color }]}>
                {dashboard.performanceTrend.trend.toUpperCase()}
              </Text>
              <Text style={styles.trendLabel}>Trend</Text>
            </View>
          </View>
          <Text style={styles.periodText}>Last {dashboard.performanceTrend.period}</Text>
        </GlassCard>

        {/* Insights */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={24} color={COLORS.warning} />
            <Text style={styles.sectionTitle}>Insights</Text>
          </View>
          {dashboard.insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))}
        </GlassCard>

        {/* Practice Patterns */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Practice Patterns</Text>
          </View>
          <View style={styles.patternGrid}>
            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>Best Time</Text>
              <Text style={styles.patternValue}>
                {getTimeEmoji(dashboard.practicePattern.bestTimeOfDay)}{' '}
                {dashboard.practicePattern.bestTimeOfDay}
              </Text>
            </View>
            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>Consistency</Text>
              <Text style={styles.patternValue}>
                {Math.round(dashboard.practicePattern.consistencyScore)}%
              </Text>
            </View>
            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>Avg Session</Text>
              <Text style={styles.patternValue}>
                {dashboard.practicePattern.optimalSessionLength}min
              </Text>
            </View>
            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>Sessions/Week</Text>
              <Text style={styles.patternValue}>
                {dashboard.practicePattern.averageSessionsPerWeek}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Skill Breakdown */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart" size={24} color={COLORS.info} />
            <Text style={styles.sectionTitle}>Skill Breakdown</Text>
          </View>
          {dashboard.skillBreakdown.slice(0, 5).map((skill, index) => (
            <View key={index} style={styles.skillItem}>
              <View style={styles.skillInfo}>
                <Text style={styles.skillName}>{skill.category}</Text>
                <Text style={styles.skillAccuracy}>{skill.accuracy.toFixed(0)}%</Text>
              </View>
              <View style={styles.skillBarContainer}>
                <View style={[styles.skillBar, { width: `${skill.accuracy}%` }]} />
              </View>
              <Text style={styles.skillPercentile}>Top {100 - skill.percentile}%</Text>
            </View>
          ))}
        </GlassCard>

        {/* Predictions */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={24} color={COLORS.success} />
            <Text style={styles.sectionTitle}>Predictions</Text>
          </View>
          {dashboard.predictions.nextLevelDate && (
            <View style={styles.predictionItem}>
              <Ionicons name="trophy" size={16} color={COLORS.warning} />
              <Text style={styles.predictionText}>
                Next level by {dashboard.predictions.nextLevelDate}
              </Text>
            </View>
          )}
          <View style={styles.predictionItem}>
            <Ionicons
              name="flame"
              size={16}
              color={
                dashboard.predictions.streakRisk === 'low'
                  ? COLORS.success
                  : dashboard.predictions.streakRisk === 'medium'
                  ? COLORS.warning
                  : COLORS.error
              }
            />
            <Text style={styles.predictionText}>
              Streak risk: {dashboard.predictions.streakRisk.toUpperCase()}
            </Text>
          </View>
          {dashboard.predictions.plateauDetected && (
            <View style={styles.predictionItem}>
              <Ionicons name="alert-circle" size={16} color={COLORS.warning} />
              <Text style={styles.predictionText}>Plateau detected - try new modes!</Text>
            </View>
          )}
        </GlassCard>

        {/* Goals */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flag" size={24} color={COLORS.error} />
            <Text style={styles.sectionTitle}>Goals</Text>
          </View>
          {dashboard.goals.length === 0 ? (
            <Text style={styles.noGoalsText}>No goals set yet. Set your first goal!</Text>
          ) : (
            dashboard.goals.map((goal, index) => <GoalCard key={index} goal={goal} />)
          )}
        </GlassCard>
      </ScrollView>
    </LinearGradient>
  );
}

function InsightCard({ insight }: { insight: AnalyticsInsight }) {
  const getColor = () => {
    switch (insight.type) {
      case 'positive':
        return COLORS.success;
      case 'negative':
        return COLORS.error;
      case 'suggestion':
        return COLORS.info;
      default:
        return COLORS.textSecondary;
    }
  };

  return (
    <View style={[styles.insightCard, { borderLeftColor: getColor() }]}>
      <Ionicons name={insight.icon as any} size={20} color={getColor()} />
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightDescription}>{insight.description}</Text>
      </View>
    </View>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const progress = (goal.current / goal.target) * 100;
  const isCompleted = goal.completedAt !== undefined;

  return (
    <View style={[styles.goalCard, isCompleted && styles.goalCardCompleted]}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalTitle}>{goal.title}</Text>
        {isCompleted && <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />}
      </View>
      <Text style={styles.goalDescription}>{goal.description}</Text>
      <View style={styles.goalProgress}>
        <Text style={styles.goalProgressText}>
          {goal.current} / {goal.target}
        </Text>
        <View style={styles.goalProgressBarContainer}>
          <View style={[styles.goalProgressBar, { width: `${Math.min(100, progress)}%` }]} />
        </View>
      </View>
    </View>
  );
}

function getTimeEmoji(time: string): string {
  switch (time) {
    case 'morning':
      return '🌅';
    case 'afternoon':
      return '☀️';
    case 'evening':
      return '🌆';
    case 'night':
      return '🌙';
    default:
      return '⏰';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  backButton: {
    padding: SPACING.xs,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  trendStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: SPACING.md,
  },
  trendStat: {
    alignItems: 'center',
  },
  trendValue: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  trendLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  periodText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.cardBackground + '40',
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    marginBottom: SPACING.sm,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  insightDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  patternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  patternItem: {
    width: (width - SPACING.md * 4) / 2,
    backgroundColor: COLORS.cardBackground + '40',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  patternLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: SPACING.xs,
  },
  patternValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  skillItem: {
    marginBottom: SPACING.md,
  },
  skillInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  skillName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  skillAccuracy: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  skillBarContainer: {
    height: 8,
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  skillBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
  },
  skillPercentile: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.cardBackground + '40',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  predictionText: {
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  noGoalsText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    padding: SPACING.md,
  },
  goalCard: {
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground + '40',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  goalCardCompleted: {
    opacity: 0.7,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  goalTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  goalDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: SPACING.sm,
  },
  goalProgress: {
    gap: SPACING.xs,
  },
  goalProgressText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  goalProgressBarContainer: {
    height: 6,
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  goalProgressBar: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.sm,
  },
});
