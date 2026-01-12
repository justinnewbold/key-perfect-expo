import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useApp } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import { LEVELS } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.md * 2 - SPACING.sm * 2) / 3;

export default function LevelsScreen() {
  const navigation = useNavigation<any>();
  const { stats } = useApp();

  const isUnlocked = (levelId: number) => stats.unlockedLevels.includes(levelId);
  const isCompleted = (levelId: number) => stats.levelScores[levelId] !== undefined;
  const isPerfect = (levelId: number) => stats.levelScores[levelId]?.perfect === true;

  const getStars = (levelId: number) => {
    const score = stats.levelScores[levelId];
    if (!score) return 0;
    const accuracy = score.correct / score.total;
    if (accuracy === 1) return 3;
    if (accuracy >= 0.8) return 2;
    if (accuracy >= 0.6) return 1;
    return 0;
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
          <Text style={styles.title}>Levels</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Progress */}
        <GlassCard style={styles.progressCard}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <Text style={styles.progressSubtitle}>
              {Object.keys(stats.levelScores).length} of {LEVELS.length} levels completed
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(Object.keys(stats.levelScores).length / LEVELS.length) * 100}%` }
              ]} 
            />
          </View>
        </GlassCard>

        {/* Level Grid */}
        <View style={styles.levelGrid}>
          {LEVELS.map((level) => {
            const unlocked = isUnlocked(level.id);
            const completed = isCompleted(level.id);
            const perfect = isPerfect(level.id);
            const stars = getStars(level.id);

            return (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.levelCard,
                  unlocked && styles.levelUnlocked,
                  completed && styles.levelCompleted,
                  perfect && styles.levelPerfect,
                ]}
                onPress={() => unlocked && navigation.navigate('LevelGame', { levelId: level.id })}
                disabled={!unlocked}
              >
                {!unlocked ? (
                  <Ionicons name="lock-closed" size={32} color={COLORS.textMuted} />
                ) : completed ? (
                  <Ionicons 
                    name={perfect ? "star" : "checkmark-circle"} 
                    size={32} 
                    color={perfect ? COLORS.warning : COLORS.success} 
                  />
                ) : (
                  <Text style={styles.levelNumber}>{level.id}</Text>
                )}
                
                <Text 
                  style={[
                    styles.levelName,
                    !unlocked && styles.levelNameLocked,
                  ]}
                  numberOfLines={1}
                >
                  {level.name}
                </Text>

                {/* Stars */}
                {completed && (
                  <View style={styles.starsRow}>
                    {[1, 2, 3].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= stars ? "star" : "star-outline"}
                        size={14}
                        color={star <= stars ? COLORS.warning : COLORS.textMuted}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Level Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>Level Details</Text>
          {LEVELS.map((level) => {
            const unlocked = isUnlocked(level.id);
            const score = stats.levelScores[level.id];

            return (
              <GlassCard 
                key={level.id} 
                style={[styles.detailCard, !unlocked && styles.detailCardLocked]}
              >
                <View style={styles.detailHeader}>
                  <View style={styles.detailTitleRow}>
                    <Text style={styles.detailLevel}>Level {level.id}</Text>
                    <Text style={styles.detailName}>{level.name}</Text>
                  </View>
                  {!unlocked && (
                    <Ionicons name="lock-closed" size={20} color={COLORS.textMuted} />
                  )}
                  {score && (
                    <View style={styles.scoreTag}>
                      <Text style={styles.scoreText}>
                        {score.correct}/{score.total}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.detailDescription}>{level.description}</Text>
                <View style={styles.detailMeta}>
                  <Text style={styles.detailMetaText}>
                    {level.type === 'single-note' ? '🎵 Notes' : '🎶 Chords'}
                  </Text>
                  <Text style={styles.detailMetaText}>
                    {level.requiredCorrect}/{level.requiredTotal} to pass
                  </Text>
                  <Text style={styles.detailMetaText}>
                    +{level.xpReward} XP
                  </Text>
                </View>
              </GlassCard>
            );
          })}
        </View>

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
  progressCard: {
    marginBottom: SPACING.md,
  },
  progressInfo: {
    marginBottom: SPACING.sm,
  },
  progressTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  progressSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.full,
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'flex-start',
  },
  levelCard: {
    width: CARD_WIDTH,
    aspectRatio: 1,
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.sm,
    ...SHADOWS.small,
  },
  levelUnlocked: {
    backgroundColor: COLORS.levelUnlocked,
  },
  levelCompleted: {
    backgroundColor: COLORS.levelCompleted,
    borderColor: COLORS.success + '50',
  },
  levelPerfect: {
    backgroundColor: COLORS.levelPerfect,
    borderColor: COLORS.warning + '50',
  },
  levelNumber: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  levelName: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  levelNameLocked: {
    color: COLORS.textMuted,
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
    gap: 2,
  },
  detailsSection: {
    marginTop: SPACING.lg,
  },
  detailsTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  detailCard: {
    marginBottom: SPACING.sm,
  },
  detailCardLocked: {
    opacity: 0.6,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  detailTitleRow: {
    flex: 1,
  },
  detailLevel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  detailName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  scoreTag: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  scoreText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
  },
  detailDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  detailMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  detailMetaText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});
