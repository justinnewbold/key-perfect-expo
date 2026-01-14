import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';

interface MasteryCategory {
  name: string;
  icon: string;
  color: string;
  level: number; // 0-5
  percentage: number; // 0-100
}

interface MasteryProgressProps {
  categories: MasteryCategory[];
}

const LEVEL_LABELS = ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];

function MasteryProgress({ categories }: MasteryProgressProps) {
  return (
    <View style={styles.container}>
      {categories.map((category, index) => (
        <View key={index} style={styles.categoryRow}>
          <View style={styles.categoryInfo}>
            <View style={[styles.iconContainer, { backgroundColor: category.color + '30' }]}>
              <Ionicons name={category.icon as any} size={20} color={category.color} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.levelLabel}>
                {LEVEL_LABELS[Math.max(0, Math.min(category.level, LEVEL_LABELS.length - 1))]}
              </Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${category.percentage}%`,
                    backgroundColor: category.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.percentText}>{Math.round(category.percentage)}%</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  textContainer: {
    flex: 1,
  },
  categoryName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  levelLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  percentText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    width: 35,
    textAlign: 'right',
  },
});

export default memo(MasteryProgress);
