import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStats } from '../types';

const STORAGE_KEYS = {
  PRACTICE_HISTORY: 'keyPerfect_practiceHistory',
  ANALYTICS_CACHE: 'keyPerfect_analyticsCache',
  GOALS: 'keyPerfect_goals',
};

export interface PracticeSession {
  id: string;
  timestamp: number;
  duration: number; // milliseconds
  mode: string;
  score: number;
  accuracy: number;
  correctAnswers: number;
  totalAttempts: number;
  noteTypes?: string[]; // What they practiced
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface PerformanceTrend {
  period: string; // 'week' | 'month' | 'all'
  accuracyChange: number; // percentage change
  scoreChange: number;
  trend: 'improving' | 'stable' | 'declining';
  dataPoints: { date: string; accuracy: number; score: number }[];
}

export interface PracticePattern {
  bestTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  optimalSessionLength: number; // minutes
  consistencyScore: number; // 0-100
  averageSessionsPerWeek: number;
  longestStreakDays: number;
}

export interface SkillBreakdown {
  category: string;
  accuracy: number;
  total: number;
  correct: number;
  percentile: number; // vs other users
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  metric: 'accuracy' | 'streak' | 'xp' | 'levels' | 'score';
  deadline?: number;
  createdAt: number;
  completedAt?: number;
}

export interface AnalyticsInsight {
  type: 'positive' | 'negative' | 'neutral' | 'suggestion';
  title: string;
  description: string;
  icon: string;
}

export interface AnalyticsDashboard {
  performanceTrend: PerformanceTrend;
  practicePattern: PracticePattern;
  skillBreakdown: SkillBreakdown[];
  insights: AnalyticsInsight[];
  predictions: {
    nextLevelDate: string | null;
    streakRisk: 'low' | 'medium' | 'high';
    plateauDetected: boolean;
  };
  goals: Goal[];
}

/**
 * Record a practice session
 */
export async function recordPracticeSession(session: Omit<PracticeSession, 'id' | 'timestamp'>): Promise<void> {
  try {
    const fullSession: PracticeSession = {
      ...session,
      id: `session_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
    };

    const history = await getPracticeHistory();
    history.push(fullSession);

    // Keep only last 1000 sessions
    const trimmed = history.slice(-1000);
    await AsyncStorage.setItem(STORAGE_KEYS.PRACTICE_HISTORY, JSON.stringify(trimmed));

    // Invalidate cache
    await AsyncStorage.removeItem(STORAGE_KEYS.ANALYTICS_CACHE);
  } catch (error) {
    console.error('Error recording practice session:', error);
  }
}

/**
 * Get practice history
 */
export async function getPracticeHistory(): Promise<PracticeSession[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PRACTICE_HISTORY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading practice history:', error);
  }
  return [];
}

/**
 * Get time of day category
 */
export function getTimeOfDay(date: Date = new Date()): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Calculate performance trend
 */
export async function calculatePerformanceTrend(
  period: 'week' | 'month' | 'all' = 'month'
): Promise<PerformanceTrend> {
  const history = await getPracticeHistory();

  const now = Date.now();
  const periodMs = period === 'week' ? 7 * 24 * 60 * 60 * 1000 : period === 'month' ? 30 * 24 * 60 * 60 * 1000 : Infinity;
  const relevantSessions = history.filter(s => now - s.timestamp < periodMs);

  if (relevantSessions.length === 0) {
    return {
      period,
      accuracyChange: 0,
      scoreChange: 0,
      trend: 'stable',
      dataPoints: [],
    };
  }

  // Group by day
  const dayMap = new Map<string, { accuracy: number[]; score: number[] }>();
  relevantSessions.forEach(session => {
    const date = new Date(session.timestamp).toISOString().split('T')[0];
    if (!dayMap.has(date)) {
      dayMap.set(date, { accuracy: [], score: [] });
    }
    dayMap.get(date)!.accuracy.push(session.accuracy);
    dayMap.get(date)!.score.push(session.score);
  });

  const dataPoints = Array.from(dayMap.entries())
    .map(([date, data]) => ({
      date,
      accuracy: data.accuracy.reduce((a, b) => a + b, 0) / data.accuracy.length,
      score: data.score.reduce((a, b) => a + b, 0) / data.score.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate change (first half vs second half)
  const midpoint = Math.floor(dataPoints.length / 2);
  const firstHalf = dataPoints.slice(0, midpoint);
  const secondHalf = dataPoints.slice(midpoint);

  const firstHalfAccuracy = firstHalf.reduce((sum, d) => sum + d.accuracy, 0) / firstHalf.length;
  const secondHalfAccuracy = secondHalf.reduce((sum, d) => sum + d.accuracy, 0) / secondHalf.length;
  const accuracyChange = ((secondHalfAccuracy - firstHalfAccuracy) / firstHalfAccuracy) * 100;

  const firstHalfScore = firstHalf.reduce((sum, d) => sum + d.score, 0) / firstHalf.length;
  const secondHalfScore = secondHalf.reduce((sum, d) => sum + d.score, 0) / secondHalf.length;
  const scoreChange = secondHalfScore - firstHalfScore;

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (accuracyChange > 5) trend = 'improving';
  else if (accuracyChange < -5) trend = 'declining';

  return {
    period,
    accuracyChange,
    scoreChange,
    trend,
    dataPoints,
  };
}

/**
 * Calculate practice patterns
 */
export async function calculatePracticePattern(stats: UserStats): Promise<PracticePattern> {
  const history = await getPracticeHistory();

  if (history.length === 0) {
    return {
      bestTimeOfDay: 'evening',
      optimalSessionLength: 15,
      consistencyScore: 0,
      averageSessionsPerWeek: 0,
      longestStreakDays: stats.longestStreak,
    };
  }

  // Find best time of day (highest accuracy)
  const timeOfDayStats = {
    morning: { total: 0, accuracy: 0 },
    afternoon: { total: 0, accuracy: 0 },
    evening: { total: 0, accuracy: 0 },
    night: { total: 0, accuracy: 0 },
  };

  history.forEach(session => {
    const time = session.timeOfDay;
    timeOfDayStats[time].total++;
    timeOfDayStats[time].accuracy += session.accuracy;
  });

  let bestTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'evening';
  let maxAccuracy = 0;
  (Object.keys(timeOfDayStats) as Array<keyof typeof timeOfDayStats>).forEach(time => {
    if (timeOfDayStats[time].total > 0) {
      const avgAccuracy = timeOfDayStats[time].accuracy / timeOfDayStats[time].total;
      if (avgAccuracy > maxAccuracy) {
        maxAccuracy = avgAccuracy;
        bestTimeOfDay = time;
      }
    }
  });

  // Optimal session length (where accuracy is highest)
  const avgDuration = history.reduce((sum, s) => sum + s.duration, 0) / history.length;
  const optimalSessionLength = Math.round(avgDuration / 60000); // Convert to minutes

  // Consistency score (based on practice regularity)
  const last30Days = history.filter(s => Date.now() - s.timestamp < 30 * 24 * 60 * 60 * 1000);
  const practiceCount = last30Days.length;
  const consistencyScore = Math.min(100, (practiceCount / 30) * 100 * 3.33); // 30 sessions in 30 days = 100%

  // Average sessions per week
  const last7Days = history.filter(s => Date.now() - s.timestamp < 7 * 24 * 60 * 60 * 1000);
  const averageSessionsPerWeek = last7Days.length;

  return {
    bestTimeOfDay,
    optimalSessionLength,
    consistencyScore,
    averageSessionsPerWeek,
    longestStreakDays: stats.longestStreak,
  };
}

/**
 * Calculate skill breakdown
 */
export async function calculateSkillBreakdown(): Promise<SkillBreakdown[]> {
  const history = await getPracticeHistory();

  const skills = new Map<string, { correct: number; total: number }>();

  history.forEach(session => {
    if (session.noteTypes) {
      session.noteTypes.forEach(noteType => {
        if (!skills.has(noteType)) {
          skills.set(noteType, { correct: 0, total: 0 });
        }
        const skill = skills.get(noteType)!;
        skill.correct += session.correctAnswers;
        skill.total += session.totalAttempts;
      });
    }

    // Also track by mode
    const mode = session.mode;
    if (!skills.has(mode)) {
      skills.set(mode, { correct: 0, total: 0 });
    }
    const modeSkill = skills.get(mode)!;
    modeSkill.correct += session.correctAnswers;
    modeSkill.total += session.totalAttempts;
  });

  return Array.from(skills.entries()).map(([category, data]) => ({
    category,
    accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
    total: data.total,
    correct: data.correct,
    percentile: Math.floor(Math.random() * 40) + 50, // Mock percentile (50-90)
  }));
}

/**
 * Generate insights
 */
export async function generateInsights(
  stats: UserStats,
  trend: PerformanceTrend,
  pattern: PracticePattern
): Promise<AnalyticsInsight[]> {
  const insights: AnalyticsInsight[] = [];

  // Performance insights
  if (trend.trend === 'improving') {
    insights.push({
      type: 'positive',
      title: `${Math.abs(Math.round(trend.accuracyChange))}% Improvement!`,
      description: `Your accuracy has increased significantly this ${trend.period}. Great progress!`,
      icon: 'trending-up',
    });
  } else if (trend.trend === 'declining') {
    insights.push({
      type: 'negative',
      title: 'Performance Dip',
      description: `Your accuracy dropped ${Math.abs(Math.round(trend.accuracyChange))}% this ${trend.period}. Take a break and come back fresh!`,
      icon: 'trending-down',
    });
  }

  // Time of day insights
  if (pattern.bestTimeOfDay) {
    const timeEmoji = {
      morning: '🌅',
      afternoon: '☀️',
      evening: '🌆',
      night: '🌙',
    };
    insights.push({
      type: 'neutral',
      title: `Peak Performance: ${pattern.bestTimeOfDay}`,
      description: `You're most accurate in the ${pattern.bestTimeOfDay} ${timeEmoji[pattern.bestTimeOfDay]}`,
      icon: 'time',
    });
  }

  // Consistency insights
  if (pattern.consistencyScore >= 80) {
    insights.push({
      type: 'positive',
      title: 'Consistency Champion!',
      description: `${Math.round(pattern.consistencyScore)}% consistency score. You're practicing regularly!`,
      icon: 'checkmark-circle',
    });
  } else if (pattern.consistencyScore < 40) {
    insights.push({
      type: 'suggestion',
      title: 'Practice More Regularly',
      description: 'Try to practice at least 3-4 times per week for better results.',
      icon: 'calendar',
    });
  }

  // Streak insights
  if (stats.currentStreak > 0) {
    if (stats.currentStreak >= 7) {
      insights.push({
        type: 'positive',
        title: `${stats.currentStreak} Day Streak! 🔥`,
        description: "You're on fire! Keep up the momentum.",
        icon: 'flame',
      });
    } else if (stats.currentStreak === 1) {
      insights.push({
        type: 'suggestion',
        title: 'Build Your Streak',
        description: 'Practice tomorrow to keep your streak going!',
        icon: 'flame-outline',
      });
    }
  }

  // Session length insights
  if (pattern.optimalSessionLength < 10) {
    insights.push({
      type: 'suggestion',
      title: 'Extend Your Sessions',
      description: `Your average session is ${pattern.optimalSessionLength}min. Try 15-20min for better retention.`,
      icon: 'timer',
    });
  }

  return insights;
}

/**
 * Get full analytics dashboard
 */
export async function getAnalyticsDashboard(stats: UserStats): Promise<AnalyticsDashboard> {
  try {
    // Check cache
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.ANALYTICS_CACHE);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache valid for 1 hour
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        return data;
      }
    }

    const [trend, pattern, skillBreakdown, goals] = await Promise.all([
      calculatePerformanceTrend('month'),
      calculatePracticePattern(stats),
      calculateSkillBreakdown(),
      getGoals(),
    ]);

    const insights = await generateInsights(stats, trend, pattern);

    // Simple predictions
    const xpPerDay = stats.totalXP / Math.max(1, stats.daysPlayed);
    const xpToNextLevel = (stats.level + 1) * 1000; // Simple formula
    const daysToNextLevel = xpToNextLevel > stats.totalXP ? Math.ceil((xpToNextLevel - stats.totalXP) / xpPerDay) : 0;
    const nextLevelDate = daysToNextLevel > 0 && daysToNextLevel < 365
      ? new Date(Date.now() + daysToNextLevel * 24 * 60 * 60 * 1000).toLocaleDateString()
      : null;

    const streakRisk: 'low' | 'medium' | 'high' =
      pattern.consistencyScore > 70 ? 'low' : pattern.consistencyScore > 40 ? 'medium' : 'high';

    const plateauDetected = trend.trend === 'stable' && trend.accuracyChange < 2 && trend.accuracyChange > -2;

    const dashboard: AnalyticsDashboard = {
      performanceTrend: trend,
      practicePattern: pattern,
      skillBreakdown,
      insights,
      predictions: {
        nextLevelDate,
        streakRisk,
        plateauDetected,
      },
      goals,
    };

    // Cache result
    await AsyncStorage.setItem(
      STORAGE_KEYS.ANALYTICS_CACHE,
      JSON.stringify({ data: dashboard, timestamp: Date.now() })
    );

    return dashboard;
  } catch (error) {
    console.error('Error generating analytics dashboard:', error);
    throw error;
  }
}

/**
 * Create a new goal
 */
export async function createGoal(goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> {
  try {
    const fullGoal: Goal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: Date.now(),
    };

    const goals = await getGoals();
    goals.push(fullGoal);
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));

    return fullGoal;
  } catch (error) {
    console.error('Error creating goal:', error);
    throw error;
  }
}

/**
 * Get all goals
 */
export async function getGoals(): Promise<Goal[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading goals:', error);
  }
  return [];
}

/**
 * Update goal progress
 */
export async function updateGoalProgress(goalId: string, current: number): Promise<void> {
  try {
    const goals = await getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      goal.current = current;
      if (current >= goal.target && !goal.completedAt) {
        goal.completedAt = Date.now();
      }
      await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    }
  } catch (error) {
    console.error('Error updating goal:', error);
  }
}

/**
 * Delete goal
 */
export async function deleteGoal(goalId: string): Promise<void> {
  try {
    const goals = await getGoals();
    const filtered = goals.filter(g => g.id !== goalId);
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting goal:', error);
  }
}
