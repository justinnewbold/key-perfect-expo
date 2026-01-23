import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStats } from '../types';

const STORAGE_KEY = 'keyPerfect_learningAnalytics';

export interface LearningSession {
  date: string;
  duration: number; // minutes
  accuracy: number; // percentage
  xpGained: number;
  notesCorrect: number;
  notesTotal: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface LearningAnalytics {
  sessions: LearningSession[];
  totalPracticeTime: number; // minutes
  averageAccuracy: number;
  bestTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  improvementRate: number; // percentage per week
  lastUpdated: string;
}

export interface DailyGoal {
  id: string;
  type: 'accuracy' | 'practice_time' | 'xp' | 'streak' | 'notes';
  target: number;
  current: number;
  description: string;
  icon: string;
  completed: boolean;
  date: string;
}

export interface ProgressPrediction {
  daysToNextLevel: number;
  daysTo80Percent: number;
  daysTo100Percent: number;
  currentTrend: 'improving' | 'stable' | 'declining';
  confidenceScore: number; // 0-100
}

// Get time of day
function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// Load analytics
export async function getLearningAnalytics(): Promise<LearningAnalytics> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading learning analytics:', error);
  }

  return {
    sessions: [],
    totalPracticeTime: 0,
    averageAccuracy: 0,
    bestTimeOfDay: 'afternoon',
    improvementRate: 0,
    lastUpdated: new Date().toISOString(),
  };
}

// Save analytics
async function saveAnalytics(analytics: LearningAnalytics): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(analytics));
  } catch (error) {
    console.error('Error saving learning analytics:', error);
  }
}

// Record a learning session
export async function recordLearningSession(
  duration: number,
  accuracy: number,
  xpGained: number,
  notesCorrect: number,
  notesTotal: number
): Promise<void> {
  const analytics = await getLearningAnalytics();

  const session: LearningSession = {
    date: new Date().toISOString(),
    duration,
    accuracy,
    xpGained,
    notesCorrect,
    notesTotal,
    timeOfDay: getTimeOfDay(),
  };

  analytics.sessions.push(session);

  // Keep only last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  analytics.sessions = analytics.sessions.filter(
    s => new Date(s.date) > ninetyDaysAgo
  );

  // Recalculate metrics
  analytics.totalPracticeTime = analytics.sessions.reduce((sum, s) => sum + s.duration, 0);
  analytics.averageAccuracy =
    analytics.sessions.reduce((sum, s) => sum + s.accuracy, 0) / analytics.sessions.length;
  analytics.bestTimeOfDay = calculateBestTimeOfDay(analytics.sessions);
  analytics.improvementRate = calculateImprovementRate(analytics.sessions);
  analytics.lastUpdated = new Date().toISOString();

  await saveAnalytics(analytics);
}

// Calculate best time of day
function calculateBestTimeOfDay(
  sessions: LearningSession[]
): 'morning' | 'afternoon' | 'evening' | 'night' {
  const timeGroups = {
    morning: [] as number[],
    afternoon: [] as number[],
    evening: [] as number[],
    night: [] as number[],
  };

  sessions.forEach(session => {
    timeGroups[session.timeOfDay].push(session.accuracy);
  });

  let bestTime: 'morning' | 'afternoon' | 'evening' | 'night' = 'afternoon';
  let bestAvg = 0;

  Object.entries(timeGroups).forEach(([time, accuracies]) => {
    if (accuracies.length > 0) {
      const avg = accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestTime = time as 'morning' | 'afternoon' | 'evening' | 'night';
      }
    }
  });

  return bestTime;
}

// Calculate improvement rate (percentage per week)
function calculateImprovementRate(sessions: LearningSession[]): number {
  if (sessions.length < 10) return 0;

  // Split into two halves
  const midpoint = Math.floor(sessions.length / 2);
  const firstHalf = sessions.slice(0, midpoint);
  const secondHalf = sessions.slice(midpoint);

  const firstAvg = firstHalf.reduce((sum, s) => sum + s.accuracy, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, s) => sum + s.accuracy, 0) / secondHalf.length;

  // Calculate days between first and second half
  const firstDate = new Date(firstHalf[0].date);
  const lastDate = new Date(secondHalf[secondHalf.length - 1].date);
  const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
  const weeks = daysDiff / 7;

  if (weeks === 0) return 0;

  return ((secondAvg - firstAvg) / weeks);
}

// Predict progress
export async function predictProgress(stats: UserStats): Promise<ProgressPrediction> {
  const analytics = await getLearningAnalytics();

  if (analytics.sessions.length < 5) {
    return {
      daysToNextLevel: 7,
      daysTo80Percent: 14,
      daysTo100Percent: 30,
      currentTrend: 'stable',
      confidenceScore: 20,
    };
  }

  const currentAccuracy = analytics.averageAccuracy;
  const improvementRate = analytics.improvementRate;

  // Calculate trend
  let trend: 'improving' | 'stable' | 'declining';
  if (improvementRate > 2) trend = 'improving';
  else if (improvementRate < -2) trend = 'declining';
  else trend = 'stable';

  // Predict days to targets
  const weeksTo80 = improvementRate > 0 ? (80 - currentAccuracy) / improvementRate : 999;
  const weeksTo100 = improvementRate > 0 ? (100 - currentAccuracy) / improvementRate : 999;

  const daysTo80 = Math.max(1, Math.min(Math.round(weeksTo80 * 7), 365));
  const daysTo100 = Math.max(1, Math.min(Math.round(weeksTo100 * 7), 365));

  // Predict days to next level based on XP rate
  const recentSessions = analytics.sessions.slice(-7); // Last 7 sessions
  const avgXpPerSession = recentSessions.reduce((sum, s) => sum + s.xpGained, 0) / recentSessions.length;
  const xpNeeded = ((stats.level + 1) * 100) - (stats.totalXP % 100);
  const sessionsNeeded = Math.ceil(xpNeeded / avgXpPerSession);
  const daysToNextLevel = Math.max(1, Math.min(sessionsNeeded, 30));

  // Confidence score based on data quantity and consistency
  const dataQuality = Math.min(analytics.sessions.length / 30, 1) * 50;
  const consistency = Math.max(0, 100 - Math.abs(improvementRate) * 10);
  const confidenceScore = Math.round((dataQuality + consistency) / 2);

  return {
    daysToNextLevel,
    daysTo80Percent: daysTo80,
    daysTo100Percent: daysTo100,
    currentTrend: trend,
    confidenceScore,
  };
}

// Generate daily goals
export async function generateDailyGoals(stats: UserStats): Promise<DailyGoal[]> {
  const analytics = await getLearningAnalytics();
  const today = new Date().toDateString();

  // Check if we already generated goals for today
  const existingGoals = await getDailyGoals();
  if (existingGoals.length > 0 && new Date(existingGoals[0].date).toDateString() === today) {
    return existingGoals;
  }

  const goals: DailyGoal[] = [];

  // Goal 1: Accuracy Target
  const targetAccuracy = Math.min(95, Math.max(60, analytics.averageAccuracy + 5));
  goals.push({
    id: 'daily_accuracy',
    type: 'accuracy',
    target: targetAccuracy,
    current: 0,
    description: `Reach ${Math.round(targetAccuracy)}% accuracy`,
    icon: '🎯',
    completed: false,
    date: today,
  });

  // Goal 2: Practice Time
  const avgPracticeTime = analytics.sessions.length > 0
    ? analytics.totalPracticeTime / analytics.sessions.length
    : 10;
  const targetTime = Math.max(10, Math.round(avgPracticeTime * 1.2));
  goals.push({
    id: 'daily_practice_time',
    type: 'practice_time',
    target: targetTime,
    current: 0,
    description: `Practice for ${targetTime} minutes`,
    icon: '⏱️',
    completed: false,
    date: today,
  });

  // Goal 3: XP Target
  const recentXp = analytics.sessions.slice(-7).reduce((sum, s) => sum + s.xpGained, 0) / 7;
  const targetXp = Math.max(100, Math.round(recentXp * 1.5));
  goals.push({
    id: 'daily_xp',
    type: 'xp',
    target: targetXp,
    current: stats.totalXP,
    description: `Earn ${targetXp} XP`,
    icon: '⭐',
    completed: false,
    date: today,
  });

  // Goal 4: Note Mastery
  const targetNotes = Math.max(20, stats.totalAttempts > 100 ? 50 : 30);
  goals.push({
    id: 'daily_notes',
    type: 'notes',
    target: targetNotes,
    current: 0,
    description: `Correctly identify ${targetNotes} notes`,
    icon: '🎵',
    completed: false,
    date: today,
  });

  await saveDailyGoals(goals);
  return goals;
}

// Save daily goals
async function saveDailyGoals(goals: DailyGoal[]): Promise<void> {
  try {
    await AsyncStorage.setItem('keyPerfect_dailyGoals', JSON.stringify(goals));
  } catch (error) {
    console.error('Error saving daily goals:', error);
  }
}

// Get daily goals
export async function getDailyGoals(): Promise<DailyGoal[]> {
  try {
    const data = await AsyncStorage.getItem('keyPerfect_dailyGoals');
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading daily goals:', error);
  }
  return [];
}

// Update goal progress
export async function updateGoalProgress(
  goalId: string,
  current: number
): Promise<void> {
  const goals = await getDailyGoals();
  const goal = goals.find(g => g.id === goalId);

  if (goal) {
    goal.current = current;
    goal.completed = current >= goal.target;
    await saveDailyGoals(goals);
  }
}

// Create skill heat map data
export interface SkillHeatMap {
  notes: { [key: string]: number }; // note -> accuracy (0-100)
  intervals: { [key: string]: number };
  chords: { [key: string]: number };
  overall: number;
}

export async function getSkillHeatMap(stats: UserStats): Promise<SkillHeatMap> {
  const noteAccuracies: { [key: string]: number } = {};

  // Calculate accuracies from stats
  Object.entries(stats.noteAccuracy).forEach(([note, data]) => {
    if (data.total > 0) {
      noteAccuracies[note] = (data.correct / data.total) * 100;
    } else {
      noteAccuracies[note] = 0;
    }
  });

  // Mock interval and chord data (would come from actual tracking)
  const intervalAccuracies: { [key: string]: number } = {
    'Minor 2nd': 75,
    'Major 2nd': 82,
    'Minor 3rd': 88,
    'Major 3rd': 91,
    'Perfect 4th': 85,
    'Perfect 5th': 93,
    'Octave': 96,
  };

  const chordAccuracies: { [key: string]: number } = {
    'Major': 87,
    'Minor': 84,
    'Diminished': 72,
    'Augmented': 68,
  };

  const overall = stats.totalAttempts > 0
    ? (stats.correctAnswers / stats.totalAttempts) * 100
    : 0;

  return {
    notes: noteAccuracies,
    intervals: intervalAccuracies,
    chords: chordAccuracies,
    overall,
  };
}
