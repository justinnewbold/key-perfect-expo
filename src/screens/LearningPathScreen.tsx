import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import {
  generateLearningPath,
  getLearningPath,
  recommendPracticeSession,
  getDailyRecommendation,
  getNextRecommendedSkill,
  getLearningPathStats,
  LearningPath,
  SkillNode,
  PracticeRecommendation,
  AICoachRecommendation,
  SkillCategory,
} from '../services/learningPath';
import { useUserStats } from '../hooks/useUserStats';

const { width } = Dimensions.get('window');

export default function LearningPathScreen() {
  const navigation = useNavigation<any>();
  const { stats } = useUserStats();
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [recommendation, setRecommendation] = useState<AICoachRecommendation | null>(null);
  const [quickSessions, setQuickSessions] = useState<PracticeRecommendation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'all'>('all');

  useEffect(() => {
    loadLearningPath();
  }, [stats]);

  const loadLearningPath = async () => {
    if (!stats) return;

    setRefreshing(true);
    try {
      let path = await getLearningPath(stats.id || 'current_user');

      if (!path) {
        // Generate new learning path
        path = await generateLearningPath(stats.id || 'current_user', stats);
      }

      setLearningPath(path);

      // Get AI recommendation
      const rec = await getDailyRecommendation(stats);
      setRecommendation(rec);

      // Get quick session recommendations
      const sessions = await Promise.all([
        recommendPracticeSession(5, stats),
        recommendPracticeSession(15, stats),
        recommendPracticeSession(30, stats),
      ]);
      setQuickSessions(sessions);
    } catch (error) {
      console.error('Error loading learning path:', error);
    }
    setRefreshing(false);
  };

  const handleStartSession = (session: PracticeRecommendation) => {
    // Navigate to practice with recommended exercises
    navigation.navigate('Practice', {
      exercises: session.exercises,
      duration: session.duration,
      sessionType: session.sessionType,
    });
  };

  const handleSkillPress = (skill: SkillNode) => {
    if (!skill.isUnlocked) {
      // Show locked message
      return;
    }

    navigation.navigate('Practice', {
      skill: skill.category,
      difficulty: skill.difficulty,
    });
  };

  const pathStats = learningPath ? getLearningPathStats(learningPath) : null;
  const nextSkill = learningPath ? getNextRecommendedSkill(learningPath) : null;

  const getCategoryIcon = (category: SkillCategory): string => {
    const icons: Record<SkillCategory, string> = {
      intervals: 'musical-notes',
      chords: 'git-network',
      scales: 'trending-up',
      rhythm: 'pulse',
      sight_reading: 'eye',
      ear_training: 'ear',
    };
    return icons[category];
  };

  const getDifficultyColor = (difficulty: string): string => {
    const colors: Record<string, string> = {
      beginner: COLORS.success,
      intermediate: COLORS.info,
      advanced: COLORS.warning,
      expert: COLORS.error,
      master: '#9333ea', // purple
    };
    return colors[difficulty] || COLORS.textSecondary;
  };

  const categories: SkillCategory[] = ['intervals', 'chords', 'scales', 'rhythm', 'sight_reading', 'ear_training'];

  const filteredSkills = learningPath?.skillTree.filter(skill =>
    selectedCategory === 'all' ? true : skill.category === selectedCategory
  ) || [];

  return (
    <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadLearningPath} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Learning Path</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* AI Coach Recommendation */}
        {recommendation && (
          <GlassCard style={styles.coachCard}>
            <View style={styles.coachHeader}>
              <View style={[styles.coachIconContainer, { backgroundColor: getRecommendationColor(recommendation.type) + '30' }]}>
                <Ionicons name={getRecommendationIcon(recommendation.type)} size={24} color={getRecommendationColor(recommendation.type)} />
              </View>
              <View style={styles.coachTextContainer}>
                <Text style={styles.coachLabel}>AI Coach</Text>
                <Text style={styles.coachMessage}>{recommendation.message}</Text>
              </View>
            </View>
            {recommendation.actionable && recommendation.suggestedAction && (
              <TouchableOpacity
                style={[styles.coachActionButton, { backgroundColor: getRecommendationColor(recommendation.type) + '40' }]}
                onPress={() => {
                  // Handle action
                  if (recommendation.suggestedAction?.action === 'practice_skill') {
                    navigation.navigate('Practice', recommendation.suggestedAction.data);
                  }
                }}
              >
                <Text style={styles.coachActionText}>{recommendation.suggestedAction.label}</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.textPrimary} />
              </TouchableOpacity>
            )}
          </GlassCard>
        )}

        {/* Quick Sessions */}
        <View style={styles.sectionHeader}>
          <Ionicons name="flash" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Quick Start</Text>
        </View>
        <View style={styles.quickSessionsRow}>
          {quickSessions.map((session, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickSessionCard}
              onPress={() => handleStartSession(session)}
            >
              <View style={[styles.quickSessionIcon, { backgroundColor: COLORS.primary + '30' }]}>
                <Ionicons name="play" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.quickSessionDuration}>{session.duration}min</Text>
              <Text style={styles.quickSessionType}>{session.sessionType.replace('_', ' ')}</Text>
              <Text style={styles.quickSessionXP}>+{session.expectedXP} XP</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Progress Overview */}
        {pathStats && (
          <GlassCard style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>Your Progress</Text>
              <Text style={styles.statsPercentage}>{learningPath?.completionPercentage}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${learningPath?.completionPercentage}%` }]} />
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{pathStats.completed}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{pathStats.inProgress}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{pathStats.locked}</Text>
                <Text style={styles.statLabel}>Locked</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round(pathStats.estimatedHoursRemaining)}h</Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Current Difficulty */}
        {learningPath && (
          <GlassCard style={styles.difficultyCard}>
            <View style={styles.difficultyHeader}>
              <Ionicons name="speedometer" size={20} color={getDifficultyColor(learningPath.adaptiveDifficulty.currentLevel)} />
              <Text style={styles.difficultyTitle}>Current Level</Text>
            </View>
            <Text style={[styles.difficultyLevel, { color: getDifficultyColor(learningPath.adaptiveDifficulty.currentLevel) }]}>
              {learningPath.adaptiveDifficulty.currentLevel.toUpperCase()}
            </Text>
            <Text style={styles.difficultyReason}>{learningPath.adaptiveDifficulty.adjustmentReason}</Text>
          </GlassCard>
        )}

        {/* Next Recommended */}
        {nextSkill && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="flag" size={20} color={COLORS.success} />
              <Text style={styles.sectionTitle}>Next Up</Text>
            </View>
            <SkillCard skill={nextSkill} onPress={() => handleSkillPress(nextSkill)} isRecommended />
          </>
        )}

        {/* Category Filter */}
        <View style={styles.sectionHeader}>
          <Ionicons name="grid" size={20} color={COLORS.info} />
          <Text style={styles.sectionTitle}>Skill Tree</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Ionicons name={getCategoryIcon(cat) as any} size={16} color={selectedCategory === cat ? COLORS.textPrimary : COLORS.textSecondary} />
              <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                {cat.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Skill List */}
        <View style={styles.skillsList}>
          {filteredSkills.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onPress={() => handleSkillPress(skill)}
              isRecommended={learningPath?.recommendedNodes.includes(skill.id)}
            />
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

interface SkillCardProps {
  skill: SkillNode;
  onPress: () => void;
  isRecommended?: boolean;
}

function SkillCard({ skill, onPress, isRecommended }: SkillCardProps) {
  const getDifficultyColor = (difficulty: string): string => {
    const colors: Record<string, string> = {
      beginner: COLORS.success,
      intermediate: COLORS.info,
      advanced: COLORS.warning,
      expert: COLORS.error,
      master: '#9333ea',
    };
    return colors[difficulty] || COLORS.textSecondary;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!skill.isUnlocked}
      style={[styles.skillCard, !skill.isUnlocked && styles.skillCardLocked]}
    >
      <GlassCard style={[styles.skillCardInner, isRecommended && styles.skillCardRecommended]}>
        {/* Header */}
        <View style={styles.skillHeader}>
          <View style={styles.skillHeaderLeft}>
            {skill.isCompleted && <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />}
            {!skill.isUnlocked && <Ionicons name="lock-closed" size={20} color={COLORS.textMuted} />}
            <Text style={[styles.skillName, !skill.isUnlocked && styles.skillNameLocked]}>
              {skill.name}
            </Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(skill.difficulty) + '30' }]}>
            <Text style={[styles.difficultyBadgeText, { color: getDifficultyColor(skill.difficulty) }]}>
              {skill.difficulty.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text style={[styles.skillDescription, !skill.isUnlocked && styles.skillDescriptionLocked]}>
          {skill.description}
        </Text>

        {/* Progress */}
        {skill.isUnlocked && !skill.isCompleted && (
          <View style={styles.skillProgressContainer}>
            <View style={styles.skillProgressBar}>
              <View style={[styles.skillProgressFill, { width: `${skill.progress}%` }]} />
            </View>
            <Text style={styles.skillProgressText}>{skill.progress}%</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.skillFooter}>
          <View style={styles.skillFooterItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.skillFooterText}>{skill.estimatedMinutes}m</Text>
          </View>
          <View style={styles.skillFooterItem}>
            <Ionicons name="star-outline" size={14} color={COLORS.warning} />
            <Text style={styles.skillFooterText}>{skill.xpReward} XP</Text>
          </View>
        </View>

        {isRecommended && (
          <View style={styles.recommendedBadge}>
            <Ionicons name="bulb" size={12} color={COLORS.warning} />
            <Text style={styles.recommendedText}>RECOMMENDED</Text>
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
}

function getRecommendationIcon(type: string): any {
  const icons: Record<string, string> = {
    motivation: 'happy',
    technique: 'bulb',
    warning: 'warning',
    achievement: 'trophy',
    suggestion: 'chatbubbles',
  };
  return icons[type] || 'information-circle';
}

function getRecommendationColor(type: string): string {
  const colors: Record<string, string> = {
    motivation: COLORS.success,
    technique: COLORS.info,
    warning: COLORS.warning,
    achievement: COLORS.primary,
    suggestion: COLORS.info,
  };
  return colors[type] || COLORS.textSecondary;
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },

  // AI Coach Card
  coachCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  coachIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachTextContainer: {
    flex: 1,
  },
  coachLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  coachMessage: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  coachActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  coachActionText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Quick Sessions
  quickSessionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  quickSessionCard: {
    flex: 1,
    backgroundColor: COLORS.surface + '60',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  quickSessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  quickSessionDuration: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  quickSessionType: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  quickSessionXP: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
  },

  // Stats Card
  statsCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statsTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsPercentage: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },

  // Difficulty Card
  difficultyCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  difficultyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  difficultyTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyLevel: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  difficultyReason: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },

  // Category Filter
  categoryFilter: {
    marginBottom: SPACING.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.surface + '60',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary + '40',
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  categoryChipTextActive: {
    color: COLORS.textPrimary,
  },

  // Skills List
  skillsList: {
    gap: SPACING.sm,
  },
  skillCard: {
    marginBottom: SPACING.sm,
  },
  skillCardLocked: {
    opacity: 0.6,
  },
  skillCardInner: {
    padding: SPACING.md,
    position: 'relative',
  },
  skillCardRecommended: {
    borderWidth: 2,
    borderColor: COLORS.warning + '80',
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  skillHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  skillName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
  },
  skillNameLocked: {
    color: COLORS.textMuted,
  },
  difficultyBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  skillDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: SPACING.sm,
  },
  skillDescriptionLocked: {
    color: COLORS.textMuted,
  },
  skillProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  skillProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  skillProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  skillProgressText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  skillFooter: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  skillFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skillFooterText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  recommendedBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  recommendedText: {
    color: COLORS.warning,
    fontSize: 9,
    fontWeight: 'bold',
  },
});
