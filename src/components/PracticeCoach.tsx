import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import GlassCard from './GlassCard';
import { detectWeakAreas, WeakArea } from '../utils/storage';
import { UserStats } from '../types';

interface PracticeCoachProps {
  stats: UserStats;
  onStartPractice: (weakAreas: WeakArea[]) => void;
  style?: any;
}

export default function PracticeCoach({ stats, onStartPractice, style }: PracticeCoachProps) {
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [recommendation, setRecommendation] = useState<string>('');

  useEffect(() => {
    loadWeakAreas();
  }, [stats]);

  const loadWeakAreas = async () => {
    const areas = await detectWeakAreas();
    setWeakAreas(areas);
    generateRecommendation(areas);
  };

  const generateRecommendation = (areas: WeakArea[]) => {
    if (areas.length === 0) {
      setRecommendation("Great job! You're doing well across all areas. Try some challenging game modes!");
      return;
    }

    const topWeakArea = areas[0];
    const accuracy = Math.round(topWeakArea.accuracy);

    let rec = '';
    if (accuracy < 40) {
      rec = `Focus on ${topWeakArea.item} (${accuracy}% accuracy). Start with slow, deliberate practice in Campaign Mode.`;
    } else if (accuracy < 60) {
      rec = `Improve ${topWeakArea.item} (${accuracy}% accuracy). Practice in Weak Areas mode to target this specifically.`;
    } else {
      rec = `Polish ${topWeakArea.item} (${accuracy}% accuracy). You're close! Try Speed Mode to build consistency.`;
    }

    setRecommendation(rec);
  };

  const getProgressMessage = () => {
    const accuracy = stats.totalAttempts > 0
      ? (stats.correctAnswers / stats.totalAttempts) * 100
      : 0;

    if (accuracy >= 80) return { emoji: '🌟', text: 'Excellent progress!' };
    if (accuracy >= 60) return { emoji: '📈', text: 'Good improvement!' };
    if (accuracy >= 40) return { emoji: '🎯', text: 'Keep practicing!' };
    return { emoji: '💪', text: 'You can do it!' };
  };

  const progress = getProgressMessage();

  return (
    <GlassCard style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="bulb" size={24} color={COLORS.warning} />
          <Text style={styles.title}>AI Practice Coach</Text>
        </View>
        <Text style={styles.progressBadge}>
          {progress.emoji} {progress.text}
        </Text>
      </View>

      <View style={styles.recommendation}>
        <Text style={styles.recommendationText}>{recommendation}</Text>
      </View>

      {weakAreas.length > 0 && (
        <>
          <Text style={styles.weakAreasTitle}>Areas to improve:</Text>
          <View style={styles.weakAreasList}>
            {weakAreas.slice(0, 3).map((area, index) => (
              <View key={area.item} style={styles.weakAreaItem}>
                <View style={styles.weakAreaInfo}>
                  <Text style={styles.weakAreaRank}>#{index + 1}</Text>
                  <Text style={styles.weakAreaName}>{area.item}</Text>
                </View>
                <Text style={[
                  styles.weakAreaAccuracy,
                  { color: area.accuracy < 50 ? COLORS.error : COLORS.warning }
                ]}>
                  {Math.round(area.accuracy)}%
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.practiceButton}
            onPress={() => onStartPractice(weakAreas)}
          >
            <Ionicons name="play-circle" size={20} color={COLORS.textPrimary} />
            <Text style={styles.practiceButtonText}>Start Targeted Practice</Text>
          </TouchableOpacity>
        </>
      )}

      {weakAreas.length === 0 && stats.totalAttempts > 20 && (
        <TouchableOpacity
          style={[styles.practiceButton, styles.challengeButton]}
          onPress={() => onStartPractice([])}
        >
          <Ionicons name="trophy" size={20} color={COLORS.warning} />
          <Text style={styles.practiceButtonText}>Try Challenge Modes</Text>
        </TouchableOpacity>
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
  progressBadge: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  recommendation: {
    backgroundColor: COLORS.info + '20',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  recommendationText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  weakAreasTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  weakAreasList: {
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  weakAreaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.cardBackground + '40',
    borderRadius: BORDER_RADIUS.sm,
  },
  weakAreaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  weakAreaRank: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
    width: 24,
  },
  weakAreaName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  weakAreaAccuracy: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  challengeButton: {
    backgroundColor: COLORS.warning + '40',
  },
  practiceButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
