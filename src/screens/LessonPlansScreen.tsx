import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import {
  LessonPlan,
  LessonProgress,
  getLessonPlans,
  getAllLessonProgress,
  calculateLessonCompletion,
} from '../services/lessonPlans';

export default function LessonPlansScreen() {
  const navigation = useNavigation<any>();
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [progress, setProgress] = useState<{ [id: string]: LessonProgress }>({});
  const [refreshing, setRefreshing] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [loadedLessons, loadedProgress] = await Promise.all([
      getLessonPlans(),
      getAllLessonProgress(),
    ]);
    setLessons(loadedLessons);
    setProgress(loadedProgress);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const filteredLessons = filterDifficulty
    ? lessons.filter(l => l.difficulty === filterDifficulty)
    : lessons;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return COLORS.success;
      case 'intermediate': return COLORS.warning;
      case 'advanced': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getProgressStatus = (lesson: LessonPlan) => {
    const lessonProgress = progress[lesson.id];
    if (!lessonProgress) return 'not_started';
    if (lessonProgress.completedAt) return 'completed';
    return 'in_progress';
  };

  const renderLessonCard = (lesson: LessonPlan) => {
    const lessonProgress = progress[lesson.id];
    const completion = calculateLessonCompletion(lesson, lessonProgress);
    const status = getProgressStatus(lesson);

    return (
      <TouchableOpacity
        key={lesson.id}
        style={styles.lessonCard}
        onPress={() => navigation.navigate('LessonDetail', { lessonId: lesson.id })}
        accessibilityLabel={`${lesson.name} lesson`}
        accessibilityRole="button"
        accessibilityHint={`${lesson.difficulty} difficulty, ${completion}% complete`}
      >
        <LinearGradient
          colors={[lesson.color + '40', lesson.color + '20']}
          style={styles.lessonGradient}
        >
          <View style={styles.lessonHeader}>
            <Text style={styles.lessonIcon}>{lesson.icon}</Text>
            <View style={styles.lessonBadges}>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(lesson.difficulty) + '30' }]}>
                <Text style={[styles.difficultyText, { color: getDifficultyColor(lesson.difficulty) }]}>
                  {lesson.difficulty}
                </Text>
              </View>
              {status === 'completed' && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              )}
            </View>
          </View>

          <Text style={styles.lessonName}>{lesson.name}</Text>
          <Text style={styles.lessonDescription}>{lesson.description}</Text>

          <View style={styles.lessonMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{lesson.estimatedTime}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="layers-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{lesson.steps.length} steps</Text>
            </View>
          </View>

          {status !== 'not_started' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${completion}%`, backgroundColor: lesson.color }]} />
              </View>
              <Text style={styles.progressText}>{completion}%</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: lesson.color }]}
            onPress={() => navigation.navigate('LessonDetail', { lessonId: lesson.id })}
          >
            <Text style={styles.startButtonText}>
              {status === 'not_started' ? 'Start' : status === 'completed' ? 'Review' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const difficulties = ['beginner', 'intermediate', 'advanced'];

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.textPrimary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Lesson Plans</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Intro */}
        <GlassCard style={styles.introCard}>
          <View style={styles.introContent}>
            <Ionicons name="school" size={32} color={COLORS.xpGradientStart} />
            <View style={styles.introText}>
              <Text style={styles.introTitle}>Structured Learning</Text>
              <Text style={styles.introSubtitle}>
                Follow guided lesson plans to systematically improve your ear training
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Filter */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, !filterDifficulty && styles.filterButtonActive]}
            onPress={() => setFilterDifficulty(null)}
          >
            <Text style={[styles.filterText, !filterDifficulty && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          {difficulties.map((diff) => (
            <TouchableOpacity
              key={diff}
              style={[
                styles.filterButton,
                filterDifficulty === diff && styles.filterButtonActive,
                filterDifficulty === diff && { backgroundColor: getDifficultyColor(diff) + '40' },
              ]}
              onPress={() => setFilterDifficulty(diff)}
            >
              <Text style={[
                styles.filterText,
                filterDifficulty === diff && styles.filterTextActive,
              ]}>
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>
              {Object.values(progress).filter(p => p.completedAt).length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>
              {Object.values(progress).filter(p => !p.completedAt && p.startedAt).length}
            </Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{lessons.length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </GlassCard>
        </View>

        {/* Lesson Cards */}
        <Text style={styles.sectionTitle}>
          {filterDifficulty
            ? `${filterDifficulty.charAt(0).toUpperCase() + filterDifficulty.slice(1)} Lessons`
            : 'All Lessons'}
        </Text>

        {filteredLessons.map(renderLessonCard)}

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
  introCard: {
    marginBottom: SPACING.md,
  },
  introContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  introText: {
    flex: 1,
  },
  introTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  introSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.xpGradientStart + '40',
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statValue: {
    color: COLORS.xpGradientStart,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  lessonCard: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  lessonGradient: {
    padding: SPACING.md,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  lessonIcon: {
    fontSize: 32,
  },
  lessonBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  difficultyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  lessonName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  lessonDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  lessonMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    width: 35,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  startButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
