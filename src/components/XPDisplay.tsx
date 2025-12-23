import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';
import { useApp } from '../context/AppContext';
import { getLevelTitle } from '../utils/theme';

interface XPDisplayProps {
  compact?: boolean;
}

function XPDisplay({ compact = false }: XPDisplayProps) {
  const { levelInfo, stats } = useApp();
  const { level, currentXP, nextLevelXP } = levelInfo;
  const { title, color } = getLevelTitle(level);
  const progress = currentXP / nextLevelXP;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.levelBadge, { backgroundColor: color }]}>
          <Text style={styles.levelNumber}>{level}</Text>
        </View>
        <View style={styles.compactBarContainer}>
          <LinearGradient
            colors={[COLORS.xpGradientStart, COLORS.xpGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.compactBar, { width: `${progress * 100}%` }]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.levelInfo}>
          <View style={[styles.levelBadgeLarge, { backgroundColor: color }]}>
            <Text style={styles.levelNumberLarge}>{level}</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>Level {level}</Text>
          </View>
        </View>
        <View style={styles.xpInfo}>
          <Ionicons name="star" size={16} color={COLORS.warning} />
          <Text style={styles.xpText}>{stats.totalXP.toLocaleString()} XP</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <LinearGradient
            colors={[COLORS.xpGradientStart, COLORS.xpGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBar, { width: `${progress * 100}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentXP} / {nextLevelXP} XP
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  levelBadgeLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  levelNumber: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  levelNumberLarge: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 20,
  },
  titleContainer: {
    justifyContent: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  xpInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  xpText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  progressContainer: {
    alignItems: 'stretch',
  },
  progressBackground: {
    height: 12,
    backgroundColor: COLORS.xpBackground,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  progressText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.xpBackground,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginLeft: SPACING.xs,
  },
  compactBar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
});

export default memo(XPDisplay);
