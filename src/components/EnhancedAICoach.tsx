import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import GlassCard from './GlassCard';
import { UserStats } from '../types';
import {
  getLearningAnalytics,
  predictProgress,
  generateDailyGoals,
  getSkillHeatMap,
  DailyGoal,
  ProgressPrediction,
  SkillHeatMap,
  LearningAnalytics,
} from '../utils/learningAnalytics';

interface EnhancedAICoachProps {
  stats: UserStats;
  style?: any;
}

export default function EnhancedAICoach({ stats, style }: EnhancedAICoachProps) {
  const navigation = useNavigation<any>();
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [prediction, setPrediction] = useState<ProgressPrediction | null>(null);
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([]);
  const [heatMap, setHeatMap] = useState<SkillHeatMap | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('goals');

  useEffect(() => {
    loadData();
  }, [stats]);

  const loadData = async () => {
    const [analyticsData, predictionData, goalsData, heatMapData] = await Promise.all([
      getLearningAnalytics(),
      predictProgress(stats),
      generateDailyGoals(stats),
      getSkillHeatMap(stats),
    ]);

    setAnalytics(analyticsData);
    setPrediction(predictionData);
    setDailyGoals(goalsData);
    setHeatMap(heatMapData);
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return { icon: 'trending-up', color: COLORS.success };
    if (trend === 'declining') return { icon: 'trending-down', color: COLORS.error };
    return { icon: 'remove', color: COLORS.textSecondary };
  };

  const getTimeIcon = (time: string) => {
    if (time === 'morning') return '🌅';
    if (time === 'afternoon') return '☀️';
    if (time === 'evening') return '🌆';
    return '🌙';
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return COLORS.success;
    if (accuracy >= 60) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <GlassCard style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={24} color={COLORS.warning} />
          <Text style={styles.title}>Enhanced AI Coach</Text>
        </View>
        <Text style={styles.subtitle}>Personalized insights & goals</Text>
      </View>

      {/* Daily Goals Section */}
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection('goals')}
        activeOpacity={0.7}
      >
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>🎯 Today's Goals</Text>
          <View style={styles.completionBadge}>
            <Text style={styles.completionText}>
              {dailyGoals.filter(g => g.completed).length}/{dailyGoals.length}
            </Text>
          </View>
        </View>
        <Ionicons
          name={expandedSection === 'goals' ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>

      {expandedSection === 'goals' && (
        <View style={styles.goalsContainer}>
          {dailyGoals.map((goal) => {
            const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
            return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalIcon}>{goal.icon}</Text>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalDescription}>{goal.description}</Text>
                    <View style={styles.goalProgressBar}>
                      <View
                        style={[
                          styles.goalProgressFill,
                          {
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: goal.completed ? COLORS.success : COLORS.warning,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  {goal.completed && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  )}
                </View>
                <Text style={styles.goalProgress}>
                  {goal.current} / {goal.target}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Progress Prediction Section */}
      {prediction && (
        <>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('prediction')}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>📊 Progress Predictions</Text>
            <Ionicons
              name={expandedSection === 'prediction' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          {expandedSection === 'prediction' && (
            <View style={styles.predictionContainer}>
              <View style={styles.trendRow}>
                <View style={styles.trendInfo}>
                  <Text style={styles.predictionLabel}>Current Trend</Text>
                  <View style={styles.trendIndicator}>
                    <Ionicons
                      name={getTrendIcon(prediction.currentTrend).icon as any}
                      size={20}
                      color={getTrendIcon(prediction.currentTrend).color}
                    />
                    <Text style={[styles.trendText, { color: getTrendIcon(prediction.currentTrend).color }]}>
                      {prediction.currentTrend.charAt(0).toUpperCase() + prediction.currentTrend.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{prediction.confidenceScore}%</Text>
                  <Text style={styles.confidenceLabel}>confidence</Text>
                </View>
              </View>

              <View style={styles.predictionCards}>
                <View style={styles.predictionCard}>
                  <Text style={styles.predictionDays}>{prediction.daysToNextLevel}</Text>
                  <Text style={styles.predictionCardLabel}>days to next level</Text>
                </View>
                <View style={styles.predictionCard}>
                  <Text style={styles.predictionDays}>{prediction.daysTo80Percent}</Text>
                  <Text style={styles.predictionCardLabel}>days to 80% mastery</Text>
                </View>
              </View>
            </View>
          )}
        </>
      )}

      {/* Learning Insights Section */}
      {analytics && analytics.sessions.length > 0 && (
        <>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('insights')}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>💡 Learning Insights</Text>
            <Ionicons
              name={expandedSection === 'insights' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          {expandedSection === 'insights' && (
            <View style={styles.insightsContainer}>
              <View style={styles.insightCard}>
                <Text style={styles.insightIcon}>{getTimeIcon(analytics.bestTimeOfDay)}</Text>
                <View style={styles.insightInfo}>
                  <Text style={styles.insightLabel}>Best Time to Practice</Text>
                  <Text style={styles.insightValue}>
                    {analytics.bestTimeOfDay.charAt(0).toUpperCase() + analytics.bestTimeOfDay.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.insightCard}>
                <Text style={styles.insightIcon}>📈</Text>
                <View style={styles.insightInfo}>
                  <Text style={styles.insightLabel}>Improvement Rate</Text>
                  <Text style={[styles.insightValue, { color: analytics.improvementRate > 0 ? COLORS.success : COLORS.error }]}>
                    {analytics.improvementRate > 0 ? '+' : ''}
                    {analytics.improvementRate.toFixed(1)}% per week
                  </Text>
                </View>
              </View>

              <View style={styles.insightCard}>
                <Text style={styles.insightIcon}>⏱️</Text>
                <View style={styles.insightInfo}>
                  <Text style={styles.insightLabel}>Total Practice Time</Text>
                  <Text style={styles.insightValue}>
                    {Math.round(analytics.totalPracticeTime)} minutes
                  </Text>
                </View>
              </View>
            </View>
          )}
        </>
      )}

      {/* Skill Heat Map Section */}
      {heatMap && (
        <>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('heatmap')}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>🎵 Skill Heat Map</Text>
            <Ionicons
              name={expandedSection === 'heatmap' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          {expandedSection === 'heatmap' && (
            <View style={styles.heatMapContainer}>
              <Text style={styles.heatMapTitle}>Notes</Text>
              <View style={styles.heatMapGrid}>
                {Object.entries(heatMap.notes).slice(0, 12).map(([note, accuracy]) => (
                  <View
                    key={note}
                    style={[
                      styles.heatMapCell,
                      { backgroundColor: getAccuracyColor(accuracy) + '40' },
                    ]}
                  >
                    <Text style={styles.heatMapNote}>{note}</Text>
                    <Text style={styles.heatMapAccuracy}>{Math.round(accuracy)}%</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.practiceButton}
                onPress={() => navigation.navigate('WeakAreas')}
              >
                <Ionicons name="play-circle" size={20} color={COLORS.textPrimary} />
                <Text style={styles.practiceButtonText}>Practice Weak Areas</Text>
              </TouchableOpacity>
            </View>
          )}
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
  titleRow: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
    marginTop: SPACING.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  completionBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  completionText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: 'bold',
  },
  goalsContainer: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  goalCard: {
    backgroundColor: COLORS.cardBackground + '60',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  goalIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  goalInfo: {
    flex: 1,
  },
  goalDescription: {
    color: COLORS.textPrimary,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  goalProgressBar: {
    height: 4,
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
  },
  goalProgress: {
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: 'right',
  },
  predictionContainer: {
    marginTop: SPACING.sm,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  trendInfo: {
    flex: 1,
  },
  predictionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: SPACING.xs,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confidenceBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.info + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  confidenceText: {
    color: COLORS.info,
    fontSize: 16,
    fontWeight: 'bold',
  },
  confidenceLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
  },
  predictionCards: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  predictionCard: {
    flex: 1,
    backgroundColor: COLORS.warning + '20',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  predictionDays: {
    color: COLORS.warning,
    fontSize: 24,
    fontWeight: 'bold',
  },
  predictionCardLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  insightsContainer: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground + '40',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  insightInfo: {
    flex: 1,
  },
  insightLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  insightValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  heatMapContainer: {
    marginTop: SPACING.sm,
  },
  heatMapTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  heatMapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  heatMapCell: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  heatMapNote: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  heatMapAccuracy: {
    color: COLORS.textSecondary,
    fontSize: 9,
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  practiceButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
