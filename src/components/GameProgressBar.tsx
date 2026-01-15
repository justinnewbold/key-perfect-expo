import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';

interface GameProgressBarProps {
  score: number;
  attempts: number;
  previousBest?: number;
  style?: any;
}

export default function GameProgressBar({
  score,
  attempts,
  previousBest,
  style,
}: GameProgressBarProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const bestIndicatorAnim = useRef(new Animated.Value(0)).current;

  const accuracy = attempts > 0 ? (score / attempts) * 100 : 0;
  const previousBestAccuracy = previousBest !== undefined ? previousBest : 0;
  const improvement = accuracy - previousBestAccuracy;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: accuracy,
      friction: 5,
      useNativeDriver: false,
    }).start();
  }, [accuracy]);

  useEffect(() => {
    if (improvement > 0) {
      Animated.sequence([
        Animated.timing(bestIndicatorAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(bestIndicatorAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [improvement]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const getAccuracyColor = (acc: number) => {
    if (acc >= 90) return COLORS.success;
    if (acc >= 75) return COLORS.info;
    if (acc >= 60) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.accuracyText}>
          Accuracy: {Math.round(accuracy)}%
        </Text>
        {improvement > 0 && (
          <Animated.View
            style={[
              styles.improvementBadge,
              { opacity: bestIndicatorAnim },
            ]}
          >
            <Text style={styles.improvementText}>
              +{Math.round(improvement)}% 🎉
            </Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.barContainer}>
        {/* Background */}
        <View style={styles.barBackground} />

        {/* Previous best indicator */}
        {previousBest !== undefined && previousBest > 0 && (
          <View
            style={[
              styles.bestIndicator,
              { left: `${previousBest}%` },
            ]}
          />
        )}

        {/* Current progress */}
        <Animated.View
          style={[
            styles.barFill,
            {
              width: progressWidth,
              backgroundColor: getAccuracyColor(accuracy),
            },
          ]}
        />
      </View>

      {/* Recent performance (last 10 questions) */}
      {attempts >= 10 && (
        <View style={styles.trendContainer}>
          <Text style={styles.trendText}>
            Last 10: {Math.round((score / Math.min(attempts, 10)) * 100)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  accuracyText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  improvementBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  improvementText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
  },
  barContainer: {
    height: 24,
    position: 'relative',
    marginBottom: SPACING.xs,
  },
  barBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    opacity: 0.3,
  },
  barFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.md,
  },
  bestIndicator: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    width: 2,
    backgroundColor: COLORS.warning,
    zIndex: 1,
  },
  trendContainer: {
    alignItems: 'flex-end',
  },
  trendText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});
