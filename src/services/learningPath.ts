import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStats } from '../types';
import { getAnalyticsDashboard, getImprovementAreas, getMasteredSkills } from './analytics';

export type SkillCategory = 'intervals' | 'chords' | 'scales' | 'rhythm' | 'sight_reading' | 'ear_training';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
export type SessionType = 'quick_fix' | 'balanced_growth' | 'deep_dive' | 'review' | 'challenge';

export interface SkillNode {
  id: string;
  category: SkillCategory;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  prerequisites: string[];
  isUnlocked: boolean;
  isCompleted: boolean;
  progress: number; // 0-100
  estimatedMinutes: number;
  xpReward: number;
}

export interface LearningPath {
  userId: string;
  currentNode: string | null;
  recommendedNodes: string[];
  skillTree: SkillNode[];
  completionPercentage: number;
  adaptiveDifficulty: {
    currentLevel: DifficultyLevel;
    adjustmentReason: string;
    lastAdjusted: number;
  };
  lastUpdated: number;
}

export interface PracticeRecommendation {
  sessionType: SessionType;
  duration: number; // minutes
  skills: SkillCategory[];
  description: string;
  expectedXP: number;
  difficulty: DifficultyLevel;
  exercises: {
    type: string;
    count: number;
    difficulty: DifficultyLevel;
  }[];
}

export interface AICoachRecommendation {
  message: string;
  type: 'motivation' | 'technique' | 'warning' | 'achievement' | 'suggestion';
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestedAction?: {
    label: string;
    action: 'practice_skill' | 'take_break' | 'review_material' | 'try_challenge';
    data: any;
  };
}

const STORAGE_KEYS = {
  LEARNING_PATH: 'keyPerfect_learningPath',
  DIFFICULTY_HISTORY: 'keyPerfect_difficultyHistory',
};

// Define the skill tree structure
const SKILL_TREE_TEMPLATE: Omit<SkillNode, 'isUnlocked' | 'isCompleted' | 'progress'>[] = [
  // INTERVALS
  { id: 'int_1', category: 'intervals', name: 'Perfect Intervals', description: 'Master perfect 4ths and 5ths', difficulty: 'beginner', prerequisites: [], estimatedMinutes: 10, xpReward: 50 },
  { id: 'int_2', category: 'intervals', name: 'Major Intervals', description: 'Learn major 2nds, 3rds, 6ths, 7ths', difficulty: 'beginner', prerequisites: ['int_1'], estimatedMinutes: 15, xpReward: 75 },
  { id: 'int_3', category: 'intervals', name: 'Minor Intervals', description: 'Practice minor intervals', difficulty: 'intermediate', prerequisites: ['int_2'], estimatedMinutes: 15, xpReward: 100 },
  { id: 'int_4', category: 'intervals', name: 'Compound Intervals', description: 'Intervals beyond an octave', difficulty: 'advanced', prerequisites: ['int_3'], estimatedMinutes: 20, xpReward: 150 },
  { id: 'int_5', category: 'intervals', name: 'Interval Speed Challenge', description: 'Rapid interval identification', difficulty: 'expert', prerequisites: ['int_4'], estimatedMinutes: 25, xpReward: 200 },

  // CHORDS
  { id: 'chord_1', category: 'chords', name: 'Triads', description: 'Major and minor triads', difficulty: 'beginner', prerequisites: [], estimatedMinutes: 12, xpReward: 60 },
  { id: 'chord_2', category: 'chords', name: 'Seventh Chords', description: 'Dominant, major, minor 7ths', difficulty: 'intermediate', prerequisites: ['chord_1', 'int_2'], estimatedMinutes: 18, xpReward: 120 },
  { id: 'chord_3', category: 'chords', name: 'Extended Chords', description: '9ths, 11ths, 13ths', difficulty: 'advanced', prerequisites: ['chord_2'], estimatedMinutes: 25, xpReward: 180 },
  { id: 'chord_4', category: 'chords', name: 'Chord Progressions', description: 'Common progressions (ii-V-I, etc)', difficulty: 'advanced', prerequisites: ['chord_2'], estimatedMinutes: 30, xpReward: 200 },
  { id: 'chord_5', category: 'chords', name: 'Jazz Harmony', description: 'Advanced jazz chord voicings', difficulty: 'master', prerequisites: ['chord_3', 'chord_4'], estimatedMinutes: 40, xpReward: 300 },

  // SCALES
  { id: 'scale_1', category: 'scales', name: 'Major Scales', description: 'All 12 major scales', difficulty: 'beginner', prerequisites: [], estimatedMinutes: 15, xpReward: 70 },
  { id: 'scale_2', category: 'scales', name: 'Minor Scales', description: 'Natural, harmonic, melodic minor', difficulty: 'intermediate', prerequisites: ['scale_1'], estimatedMinutes: 20, xpReward: 110 },
  { id: 'scale_3', category: 'scales', name: 'Modes', description: 'Dorian, Phrygian, Lydian, etc', difficulty: 'advanced', prerequisites: ['scale_2'], estimatedMinutes: 30, xpReward: 170 },
  { id: 'scale_4', category: 'scales', name: 'Exotic Scales', description: 'Whole tone, diminished, etc', difficulty: 'expert', prerequisites: ['scale_3'], estimatedMinutes: 35, xpReward: 220 },

  // RHYTHM
  { id: 'rhythm_1', category: 'rhythm', name: 'Basic Rhythms', description: 'Quarter, half, whole notes', difficulty: 'beginner', prerequisites: [], estimatedMinutes: 10, xpReward: 50 },
  { id: 'rhythm_2', category: 'rhythm', name: 'Syncopation', description: 'Off-beat rhythms', difficulty: 'intermediate', prerequisites: ['rhythm_1'], estimatedMinutes: 15, xpReward: 100 },
  { id: 'rhythm_3', category: 'rhythm', name: 'Polyrhythms', description: '3 against 2, 4 against 3', difficulty: 'advanced', prerequisites: ['rhythm_2'], estimatedMinutes: 25, xpReward: 160 },
  { id: 'rhythm_4', category: 'rhythm', name: 'Complex Time Signatures', description: '5/4, 7/8, etc', difficulty: 'expert', prerequisites: ['rhythm_3'], estimatedMinutes: 30, xpReward: 210 },

  // SIGHT READING
  { id: 'sight_1', category: 'sight_reading', name: 'Treble Clef Reading', description: 'Read treble clef fluently', difficulty: 'beginner', prerequisites: [], estimatedMinutes: 12, xpReward: 60 },
  { id: 'sight_2', category: 'sight_reading', name: 'Bass Clef Reading', description: 'Read bass clef fluently', difficulty: 'beginner', prerequisites: [], estimatedMinutes: 12, xpReward: 60 },
  { id: 'sight_3', category: 'sight_reading', name: 'Grand Staff Reading', description: 'Read both clefs simultaneously', difficulty: 'intermediate', prerequisites: ['sight_1', 'sight_2'], estimatedMinutes: 20, xpReward: 130 },
  { id: 'sight_4', category: 'sight_reading', name: 'Alto/Tenor Clef', description: 'Read C clefs', difficulty: 'advanced', prerequisites: ['sight_3'], estimatedMinutes: 25, xpReward: 180 },

  // EAR TRAINING
  { id: 'ear_1', category: 'ear_training', name: 'Pitch Matching', description: 'Match single pitches', difficulty: 'beginner', prerequisites: [], estimatedMinutes: 10, xpReward: 55 },
  { id: 'ear_2', category: 'ear_training', name: 'Melodic Dictation', description: 'Transcribe simple melodies', difficulty: 'intermediate', prerequisites: ['ear_1', 'int_2'], estimatedMinutes: 20, xpReward: 115 },
  { id: 'ear_3', category: 'ear_training', name: 'Harmonic Dictation', description: 'Transcribe chord progressions', difficulty: 'advanced', prerequisites: ['ear_2', 'chord_2'], estimatedMinutes: 30, xpReward: 190 },
  { id: 'ear_4', category: 'ear_training', name: 'Rhythmic Dictation', description: 'Transcribe complex rhythms', difficulty: 'expert', prerequisites: ['ear_2', 'rhythm_3'], estimatedMinutes: 25, xpReward: 200 },
];

/**
 * Generate personalized learning path based on user stats and analytics
 */
export async function generateLearningPath(
  userId: string,
  stats: UserStats
): Promise<LearningPath> {
  try {
    const analytics = await getAnalyticsDashboard(stats);
    const masteredSkills = await getMasteredSkills();
    const improvementAreas = await getImprovementAreas();

    // Initialize skill tree with progress
    const skillTree: SkillNode[] = SKILL_TREE_TEMPLATE.map(template => {
      const isMastered = masteredSkills.includes(template.category);
      const needsWork = improvementAreas.some(area => area.skill === template.category);

      // Calculate progress based on stats (mock - in production use real progress data)
      let progress = 0;
      if (isMastered) {
        progress = 100;
      } else if (needsWork) {
        progress = Math.floor(Math.random() * 50); // 0-50%
      } else {
        progress = Math.floor(Math.random() * 80); // 0-80%
      }

      return {
        ...template,
        isUnlocked: template.prerequisites.length === 0 || Math.random() > 0.3,
        isCompleted: progress === 100,
        progress,
      };
    });

    // Unlock nodes whose prerequisites are completed
    skillTree.forEach(node => {
      if (node.prerequisites.length > 0) {
        const prereqsCompleted = node.prerequisites.every(
          prereqId => skillTree.find(n => n.id === prereqId)?.isCompleted
        );
        if (prereqsCompleted) {
          node.isUnlocked = true;
        }
      }
    });

    // Find recommended nodes (unlocked but not completed, prioritize improvement areas)
    const unlockedIncomplete = skillTree.filter(n => n.isUnlocked && !n.isCompleted);
    const recommendedNodes = unlockedIncomplete
      .sort((a, b) => {
        const aIsImprovement = improvementAreas.some(area => area.skill === a.category);
        const bIsImprovement = improvementAreas.some(area => area.skill === b.category);

        if (aIsImprovement && !bIsImprovement) return -1;
        if (!aIsImprovement && bIsImprovement) return 1;

        // Then by progress (prioritize nodes with some progress)
        if (a.progress > 0 && b.progress === 0) return -1;
        if (a.progress === 0 && b.progress > 0) return 1;

        // Then by difficulty (easier first)
        const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2, expert: 3, master: 4 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      })
      .slice(0, 5)
      .map(n => n.id);

    const currentNode = recommendedNodes[0] || null;
    const completedCount = skillTree.filter(n => n.isCompleted).length;
    const completionPercentage = Math.round((completedCount / skillTree.length) * 100);

    const adaptiveDifficulty = await getAdaptiveDifficulty(stats, analytics.performanceTrend);

    const learningPath: LearningPath = {
      userId,
      currentNode,
      recommendedNodes,
      skillTree,
      completionPercentage,
      adaptiveDifficulty,
      lastUpdated: Date.now(),
    };

    await AsyncStorage.setItem(
      `${STORAGE_KEYS.LEARNING_PATH}_${userId}`,
      JSON.stringify(learningPath)
    );

    return learningPath;
  } catch (error) {
    console.error('Error generating learning path:', error);
    throw error;
  }
}

/**
 * Get adaptive difficulty based on recent performance
 */
export async function getAdaptiveDifficulty(
  stats: UserStats,
  performanceTrend: any
): Promise<LearningPath['adaptiveDifficulty']> {
  const accuracy = stats.totalAttempts > 0
    ? (stats.correctAnswers / stats.totalAttempts) * 100
    : 0;

  let currentLevel: DifficultyLevel = 'beginner';
  let adjustmentReason = 'Starting level';

  // Determine level based on accuracy and XP
  if (stats.totalXP > 10000 && accuracy >= 90) {
    currentLevel = 'master';
    adjustmentReason = 'Exceptional performance - Master level unlocked!';
  } else if (stats.totalXP > 5000 && accuracy >= 85) {
    currentLevel = 'expert';
    adjustmentReason = 'Consistently high accuracy - Expert level';
  } else if (stats.totalXP > 2000 && accuracy >= 75) {
    currentLevel = 'advanced';
    adjustmentReason = 'Strong progress - Advanced level';
  } else if (stats.totalXP > 500 && accuracy >= 65) {
    currentLevel = 'intermediate';
    adjustmentReason = 'Good foundation - Intermediate level';
  } else {
    currentLevel = 'beginner';
    adjustmentReason = 'Building fundamentals';
  }

  // Adjust based on recent trend
  if (performanceTrend.accuracy.change < -10) {
    // Significant drop in performance - make easier
    const difficultyOrder: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert', 'master'];
    const currentIndex = difficultyOrder.indexOf(currentLevel);
    if (currentIndex > 0) {
      currentLevel = difficultyOrder[currentIndex - 1];
      adjustmentReason = 'Adjusted down to help you recover confidence';
    }
  }

  return {
    currentLevel,
    adjustmentReason,
    lastAdjusted: Date.now(),
  };
}

/**
 * Recommend optimal practice session based on time available and goals
 */
export async function recommendPracticeSession(
  timeAvailable: number, // minutes
  stats: UserStats,
  goals: string[] = []
): Promise<PracticeRecommendation> {
  const analytics = await getAnalyticsDashboard(stats);
  const improvementAreas = await getImprovementAreas();
  const learningPath = await getLearningPath(stats.id || 'current_user');

  let sessionType: SessionType;
  let description: string;
  let skills: SkillCategory[] = [];
  let exercises: PracticeRecommendation['exercises'] = [];

  if (timeAvailable <= 5) {
    // Quick Fix - Focus on one weak area
    sessionType = 'quick_fix';
    const weakestSkill = improvementAreas[0];
    skills = [weakestSkill?.skill as SkillCategory || 'intervals'];
    description = `Quick 5-minute drill on ${skills[0]} to sharpen your weakest area`;
    exercises = [
      { type: skills[0], count: 10, difficulty: 'beginner' },
    ];
  } else if (timeAvailable <= 15) {
    // Balanced Growth - Mix of improvement and practice
    sessionType = 'balanced_growth';
    skills = improvementAreas.slice(0, 2).map(a => a.skill as SkillCategory);
    if (skills.length < 2) skills.push('intervals', 'chords');
    description = `Balanced 15-minute session mixing ${skills.join(' and ')}`;
    exercises = [
      { type: skills[0], count: 15, difficulty: learningPath?.adaptiveDifficulty.currentLevel || 'intermediate' },
      { type: skills[1], count: 10, difficulty: learningPath?.adaptiveDifficulty.currentLevel || 'intermediate' },
    ];
  } else if (timeAvailable <= 30) {
    // Deep Dive - Comprehensive practice
    sessionType = 'deep_dive';
    skills = improvementAreas.slice(0, 3).map(a => a.skill as SkillCategory);
    if (skills.length < 3) skills.push('intervals', 'chords', 'scales');
    description = `Deep 30-minute dive covering ${skills.join(', ')} with progressive difficulty`;
    exercises = [
      { type: skills[0], count: 20, difficulty: 'beginner' },
      { type: skills[1], count: 15, difficulty: 'intermediate' },
      { type: skills[2], count: 15, difficulty: learningPath?.adaptiveDifficulty.currentLevel || 'advanced' },
    ];
  } else {
    // Review or Challenge mode
    const hasRecentStreak = stats.currentStreak >= 3;
    if (hasRecentStreak && Math.random() > 0.5) {
      sessionType = 'challenge';
      skills = ['intervals', 'chords', 'scales', 'rhythm'];
      description = `Challenge mode: Test your skills across all categories!`;
      exercises = skills.map(skill => ({
        type: skill,
        count: 10,
        difficulty: 'expert' as DifficultyLevel,
      }));
    } else {
      sessionType = 'review';
      skills = improvementAreas.map(a => a.skill as SkillCategory);
      description = `Comprehensive review of all your improvement areas`;
      exercises = skills.map(skill => ({
        type: skill,
        count: 12,
        difficulty: 'intermediate' as DifficultyLevel,
      }));
    }
  }

  const expectedXP = exercises.reduce((sum, ex) => {
    const baseXP = ex.count * 5;
    const difficultyMultiplier = {
      beginner: 1,
      intermediate: 1.5,
      advanced: 2,
      expert: 2.5,
      master: 3,
    }[ex.difficulty];
    return sum + baseXP * difficultyMultiplier;
  }, 0);

  return {
    sessionType,
    duration: timeAvailable,
    skills,
    description,
    expectedXP: Math.round(expectedXP),
    difficulty: learningPath?.adaptiveDifficulty.currentLevel || 'intermediate',
    exercises,
  };
}

/**
 * Get daily AI coach recommendation
 */
export async function getDailyRecommendation(
  stats: UserStats
): Promise<AICoachRecommendation> {
  const analytics = await getAnalyticsDashboard(stats);
  const improvementAreas = await getImprovementAreas();
  const learningPath = await getLearningPath(stats.id || 'current_user');

  // Check for various conditions
  const accuracy = stats.totalAttempts > 0
    ? (stats.correctAnswers / stats.totalAttempts) * 100
    : 0;

  const hasLongStreak = stats.currentStreak >= 7;
  const hasDroppedStreak = stats.currentStreak === 0 && stats.longestStreak > 3;
  const isPlateauing = analytics.predictions.plateauDetected;
  const isImproving = analytics.performanceTrend.accuracy.change > 5;
  const needsBreak = analytics.practicePattern.avgSessionLength > 45;

  // Priority: Address critical issues first
  if (hasDroppedStreak) {
    return {
      message: `You had a ${stats.longestStreak}-day streak! Let's get back on track. Start with just 5 minutes today.`,
      type: 'motivation',
      priority: 'high',
      actionable: true,
      suggestedAction: {
        label: 'Quick 5-Min Session',
        action: 'practice_skill',
        data: { duration: 5 },
      },
    };
  }

  if (isPlateauing) {
    return {
      message: `Your progress has plateaued. Try focusing on ${improvementAreas[0]?.skill} to break through!`,
      type: 'suggestion',
      priority: 'high',
      actionable: true,
      suggestedAction: {
        label: `Practice ${improvementAreas[0]?.skill}`,
        action: 'practice_skill',
        data: { skill: improvementAreas[0]?.skill },
      },
    };
  }

  if (needsBreak) {
    return {
      message: `Your sessions are averaging ${Math.round(analytics.practicePattern.avgSessionLength)} minutes. Consider shorter, more focused practice to avoid burnout.`,
      type: 'warning',
      priority: 'medium',
      actionable: true,
      suggestedAction: {
        label: 'Take a Break',
        action: 'take_break',
        data: {},
      },
    };
  }

  if (isImproving) {
    return {
      message: `Amazing! Your accuracy is up ${analytics.performanceTrend.accuracy.change.toFixed(1)}% this week. Keep the momentum going!`,
      type: 'achievement',
      priority: 'medium',
      actionable: false,
    };
  }

  if (hasLongStreak) {
    return {
      message: `${stats.currentStreak}-day streak! You're on fire 🔥. Ready for a challenge?`,
      type: 'motivation',
      priority: 'medium',
      actionable: true,
      suggestedAction: {
        label: 'Take Challenge',
        action: 'try_challenge',
        data: { difficulty: 'expert' },
      },
    };
  }

  // Default: Suggest practicing weak area
  const weakestArea = improvementAreas[0];
  if (weakestArea) {
    return {
      message: `Focus on ${weakestArea.skill} today. You're at ${weakestArea.currentAccuracy.toFixed(0)}%, let's push to ${weakestArea.targetAccuracy.toFixed(0)}%!`,
      type: 'technique',
      priority: 'medium',
      actionable: true,
      suggestedAction: {
        label: `Practice ${weakestArea.skill}`,
        action: 'practice_skill',
        data: { skill: weakestArea.skill },
      },
    };
  }

  // Fallback
  return {
    message: `Great to see you! ${learningPath?.completionPercentage}% through your learning path. Let's practice!`,
    type: 'motivation',
    priority: 'low',
    actionable: false,
  };
}

/**
 * Get learning path from storage
 */
export async function getLearningPath(userId: string): Promise<LearningPath | null> {
  try {
    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.LEARNING_PATH}_${userId}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading learning path:', error);
  }
  return null;
}

/**
 * Update skill node progress
 */
export async function updateSkillProgress(
  userId: string,
  nodeId: string,
  progress: number
): Promise<void> {
  try {
    const learningPath = await getLearningPath(userId);
    if (!learningPath) return;

    const node = learningPath.skillTree.find(n => n.id === nodeId);
    if (!node) return;

    node.progress = Math.min(100, progress);
    node.isCompleted = node.progress === 100;

    // Unlock dependent nodes if this one is completed
    if (node.isCompleted) {
      learningPath.skillTree.forEach(n => {
        if (n.prerequisites.includes(nodeId)) {
          const allPrereqsCompleted = n.prerequisites.every(
            prereqId => learningPath.skillTree.find(node => node.id === prereqId)?.isCompleted
          );
          if (allPrereqsCompleted) {
            n.isUnlocked = true;
          }
        }
      });
    }

    // Recalculate completion percentage
    const completedCount = learningPath.skillTree.filter(n => n.isCompleted).length;
    learningPath.completionPercentage = Math.round((completedCount / learningPath.skillTree.length) * 100);

    learningPath.lastUpdated = Date.now();

    await AsyncStorage.setItem(
      `${STORAGE_KEYS.LEARNING_PATH}_${userId}`,
      JSON.stringify(learningPath)
    );
  } catch (error) {
    console.error('Error updating skill progress:', error);
  }
}

/**
 * Get skill nodes by category
 */
export function getSkillsByCategory(
  learningPath: LearningPath,
  category: SkillCategory
): SkillNode[] {
  return learningPath.skillTree.filter(n => n.category === category);
}

/**
 * Get next recommended skill to practice
 */
export function getNextRecommendedSkill(learningPath: LearningPath): SkillNode | null {
  if (learningPath.recommendedNodes.length === 0) return null;
  const nextId = learningPath.recommendedNodes[0];
  return learningPath.skillTree.find(n => n.id === nextId) || null;
}

/**
 * Calculate estimated time to complete learning path
 */
export function estimateCompletionTime(learningPath: LearningPath): number {
  const incompleteNodes = learningPath.skillTree.filter(n => !n.isCompleted);
  return incompleteNodes.reduce((sum, node) => {
    const remainingProgress = (100 - node.progress) / 100;
    return sum + node.estimatedMinutes * remainingProgress;
  }, 0);
}

/**
 * Get learning path statistics
 */
export function getLearningPathStats(learningPath: LearningPath): {
  totalSkills: number;
  completed: number;
  inProgress: number;
  locked: number;
  totalXPAvailable: number;
  earnedXP: number;
  estimatedHoursRemaining: number;
} {
  const totalSkills = learningPath.skillTree.length;
  const completed = learningPath.skillTree.filter(n => n.isCompleted).length;
  const inProgress = learningPath.skillTree.filter(n => n.progress > 0 && !n.isCompleted).length;
  const locked = learningPath.skillTree.filter(n => !n.isUnlocked).length;

  const totalXPAvailable = learningPath.skillTree.reduce((sum, n) => sum + n.xpReward, 0);
  const earnedXP = learningPath.skillTree
    .filter(n => n.isCompleted)
    .reduce((sum, n) => sum + n.xpReward, 0);

  const estimatedHoursRemaining = estimateCompletionTime(learningPath) / 60;

  return {
    totalSkills,
    completed,
    inProgress,
    locked,
    totalXPAvailable,
    earnedXP,
    estimatedHoursRemaining,
  };
}
