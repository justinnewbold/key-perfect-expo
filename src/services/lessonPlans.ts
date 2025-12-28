import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'keyPerfect_lessonPlans';
const USER_PROGRESS_KEY = 'keyPerfect_lessonProgress';

export interface LessonStep {
  id: string;
  type: 'notes' | 'chords' | 'intervals' | 'scales' | 'progressions';
  title: string;
  description: string;
  items: string[];        // Items to practice (e.g., ['C', 'D', 'E'] for notes)
  targetAccuracy: number; // Required accuracy to pass (0-100)
  minAttempts: number;    // Minimum attempts before moving on
  duration?: number;      // Optional time limit in seconds
}

export interface LessonPlan {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;  // e.g., "2 weeks"
  steps: LessonStep[];
  createdAt: string;
  isBuiltIn: boolean;
}

export interface LessonProgress {
  lessonId: string;
  currentStepIndex: number;
  stepProgress: {
    [stepId: string]: {
      attempts: number;
      correctAnswers: number;
      completed: boolean;
      completedAt?: string;
    };
  };
  startedAt: string;
  completedAt?: string;
}

// Built-in lesson plans
export const BUILT_IN_LESSONS: LessonPlan[] = [
  {
    id: 'beginner-notes',
    name: 'Natural Notes Mastery',
    description: 'Learn to identify C, D, E, F, G, A, B by ear',
    icon: '🎵',
    color: '#4ECDC4',
    difficulty: 'beginner',
    estimatedTime: '1 week',
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: 'notes-1',
        type: 'notes',
        title: 'C and G',
        description: 'Start with the most common notes',
        items: ['C', 'G'],
        targetAccuracy: 80,
        minAttempts: 20,
      },
      {
        id: 'notes-2',
        type: 'notes',
        title: 'Add D and A',
        description: 'Expand to four notes',
        items: ['C', 'D', 'G', 'A'],
        targetAccuracy: 80,
        minAttempts: 30,
      },
      {
        id: 'notes-3',
        type: 'notes',
        title: 'Add E and B',
        description: 'Six notes now!',
        items: ['C', 'D', 'E', 'G', 'A', 'B'],
        targetAccuracy: 80,
        minAttempts: 40,
      },
      {
        id: 'notes-4',
        type: 'notes',
        title: 'Complete Natural Notes',
        description: 'All seven natural notes',
        items: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
        targetAccuracy: 85,
        minAttempts: 50,
      },
    ],
  },
  {
    id: 'chromatic-notes',
    name: 'Chromatic Scale Training',
    description: 'Master all 12 notes including sharps and flats',
    icon: '🎹',
    color: '#FF6B6B',
    difficulty: 'intermediate',
    estimatedTime: '2 weeks',
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: 'chrom-1',
        type: 'notes',
        title: 'Natural Notes Review',
        description: 'Quick review of natural notes',
        items: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
        targetAccuracy: 85,
        minAttempts: 30,
      },
      {
        id: 'chrom-2',
        type: 'notes',
        title: 'Add C# and F#',
        description: 'Common sharps first',
        items: ['C', 'C#', 'D', 'E', 'F', 'F#', 'G', 'A', 'B'],
        targetAccuracy: 80,
        minAttempts: 40,
      },
      {
        id: 'chrom-3',
        type: 'notes',
        title: 'Add G# and D#',
        description: 'More sharps',
        items: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'B'],
        targetAccuracy: 80,
        minAttempts: 50,
      },
      {
        id: 'chrom-4',
        type: 'notes',
        title: 'Complete Chromatic',
        description: 'All 12 notes',
        items: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        targetAccuracy: 85,
        minAttempts: 60,
      },
    ],
  },
  {
    id: 'basic-chords',
    name: 'Major & Minor Chords',
    description: 'Learn to distinguish major from minor chords',
    icon: '🎸',
    color: '#FFE66D',
    difficulty: 'beginner',
    estimatedTime: '1 week',
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: 'chord-1',
        type: 'chords',
        title: 'C Major vs A Minor',
        description: 'The most basic comparison',
        items: ['C Major', 'A Minor'],
        targetAccuracy: 85,
        minAttempts: 25,
      },
      {
        id: 'chord-2',
        type: 'chords',
        title: 'Common Major Chords',
        description: 'C, G, and F major',
        items: ['C Major', 'G Major', 'F Major'],
        targetAccuracy: 80,
        minAttempts: 30,
      },
      {
        id: 'chord-3',
        type: 'chords',
        title: 'Common Minor Chords',
        description: 'A, E, and D minor',
        items: ['A Minor', 'E Minor', 'D Minor'],
        targetAccuracy: 80,
        minAttempts: 30,
      },
      {
        id: 'chord-4',
        type: 'chords',
        title: 'Mixed Major & Minor',
        description: 'Distinguish between all',
        items: ['C Major', 'G Major', 'F Major', 'A Minor', 'E Minor', 'D Minor'],
        targetAccuracy: 85,
        minAttempts: 50,
      },
    ],
  },
  {
    id: 'intervals-basic',
    name: 'Interval Recognition',
    description: 'Learn to identify musical intervals',
    icon: '📏',
    color: '#95E1D3',
    difficulty: 'intermediate',
    estimatedTime: '2 weeks',
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: 'int-1',
        type: 'intervals',
        title: 'Unison & Octave',
        description: 'The easiest intervals',
        items: ['Unison', 'Octave'],
        targetAccuracy: 90,
        minAttempts: 20,
      },
      {
        id: 'int-2',
        type: 'intervals',
        title: 'Perfect 5th & 4th',
        description: 'Power chord intervals',
        items: ['Perfect 4th', 'Perfect 5th'],
        targetAccuracy: 85,
        minAttempts: 30,
      },
      {
        id: 'int-3',
        type: 'intervals',
        title: 'Major & Minor 3rd',
        description: 'The chord quality intervals',
        items: ['Major 3rd', 'Minor 3rd'],
        targetAccuracy: 85,
        minAttempts: 35,
      },
      {
        id: 'int-4',
        type: 'intervals',
        title: 'Major & Minor 2nd',
        description: 'Step intervals',
        items: ['Minor 2nd', 'Major 2nd'],
        targetAccuracy: 80,
        minAttempts: 35,
      },
      {
        id: 'int-5',
        type: 'intervals',
        title: 'All Basic Intervals',
        description: 'Combine everything',
        items: ['Minor 2nd', 'Major 2nd', 'Minor 3rd', 'Major 3rd', 'Perfect 4th', 'Perfect 5th', 'Octave'],
        targetAccuracy: 80,
        minAttempts: 60,
      },
    ],
  },
  {
    id: 'jazz-ear',
    name: 'Jazz Ear Training',
    description: 'Advanced training for jazz musicians',
    icon: '🎷',
    color: '#AA96DA',
    difficulty: 'advanced',
    estimatedTime: '4 weeks',
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: 'jazz-1',
        type: 'chords',
        title: 'Dominant 7th Chords',
        description: 'The jazz essential',
        items: ['C7', 'G7', 'F7', 'D7'],
        targetAccuracy: 80,
        minAttempts: 40,
      },
      {
        id: 'jazz-2',
        type: 'chords',
        title: 'Major 7th Chords',
        description: 'Sweet jazz sound',
        items: ['Cmaj7', 'Fmaj7', 'Gmaj7', 'Bbmaj7'],
        targetAccuracy: 80,
        minAttempts: 40,
      },
      {
        id: 'jazz-3',
        type: 'chords',
        title: 'Minor 7th Chords',
        description: 'Smooth and mellow',
        items: ['Cm7', 'Dm7', 'Am7', 'Em7'],
        targetAccuracy: 80,
        minAttempts: 40,
      },
      {
        id: 'jazz-4',
        type: 'intervals',
        title: 'Tritone & 6ths',
        description: 'Advanced intervals',
        items: ['Tritone', 'Major 6th', 'Minor 6th'],
        targetAccuracy: 75,
        minAttempts: 50,
      },
      {
        id: 'jazz-5',
        type: 'progressions',
        title: 'ii-V-I Progressions',
        description: 'The jazz standard',
        items: ['ii-V-I Major', 'ii-V-I Minor'],
        targetAccuracy: 75,
        minAttempts: 40,
      },
    ],
  },
];

// Get all lesson plans (built-in + custom)
export async function getLessonPlans(): Promise<LessonPlan[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const customPlans: LessonPlan[] = data ? JSON.parse(data) : [];
    return [...BUILT_IN_LESSONS, ...customPlans];
  } catch (error) {
    console.error('Error loading lesson plans:', error);
    return BUILT_IN_LESSONS;
  }
}

// Save custom lesson plan
export async function saveLessonPlan(plan: LessonPlan): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const plans: LessonPlan[] = data ? JSON.parse(data) : [];

    const existingIndex = plans.findIndex(p => p.id === plan.id);
    if (existingIndex >= 0) {
      plans[existingIndex] = plan;
    } else {
      plans.push(plan);
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch (error) {
    console.error('Error saving lesson plan:', error);
  }
}

// Delete custom lesson plan
export async function deleteLessonPlan(planId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const plans: LessonPlan[] = data ? JSON.parse(data) : [];
    const filtered = plans.filter(p => p.id !== planId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting lesson plan:', error);
  }
}

// Get user progress for all lessons
export async function getAllLessonProgress(): Promise<{ [lessonId: string]: LessonProgress }> {
  try {
    const data = await AsyncStorage.getItem(USER_PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading lesson progress:', error);
    return {};
  }
}

// Get progress for a specific lesson
export async function getLessonProgress(lessonId: string): Promise<LessonProgress | null> {
  const allProgress = await getAllLessonProgress();
  return allProgress[lessonId] || null;
}

// Start or resume a lesson
export async function startLesson(lessonId: string): Promise<LessonProgress> {
  const existing = await getLessonProgress(lessonId);

  if (existing) {
    return existing;
  }

  const newProgress: LessonProgress = {
    lessonId,
    currentStepIndex: 0,
    stepProgress: {},
    startedAt: new Date().toISOString(),
  };

  await saveLessonProgress(newProgress);
  return newProgress;
}

// Save lesson progress
export async function saveLessonProgress(progress: LessonProgress): Promise<void> {
  try {
    const allProgress = await getAllLessonProgress();
    allProgress[progress.lessonId] = progress;
    await AsyncStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error('Error saving lesson progress:', error);
  }
}

// Update step progress after practice
export async function updateStepProgress(
  lessonId: string,
  stepId: string,
  correct: boolean
): Promise<{ completed: boolean; accuracy: number }> {
  const progress = await getLessonProgress(lessonId);
  if (!progress) {
    throw new Error('Lesson not started');
  }

  if (!progress.stepProgress[stepId]) {
    progress.stepProgress[stepId] = {
      attempts: 0,
      correctAnswers: 0,
      completed: false,
    };
  }

  const stepProgress = progress.stepProgress[stepId];
  stepProgress.attempts++;
  if (correct) {
    stepProgress.correctAnswers++;
  }

  // Get the lesson to check requirements
  const plans = await getLessonPlans();
  const plan = plans.find(p => p.id === lessonId);
  const step = plan?.steps.find(s => s.id === stepId);

  if (step && stepProgress.attempts >= step.minAttempts) {
    const accuracy = (stepProgress.correctAnswers / stepProgress.attempts) * 100;
    if (accuracy >= step.targetAccuracy) {
      stepProgress.completed = true;
      stepProgress.completedAt = new Date().toISOString();

      // Check if we should advance to next step
      const currentStepIndex = plan.steps.findIndex(s => s.id === stepId);
      if (currentStepIndex === progress.currentStepIndex && currentStepIndex < plan.steps.length - 1) {
        progress.currentStepIndex++;
      }

      // Check if lesson is complete
      if (progress.currentStepIndex === plan.steps.length - 1 && stepProgress.completed) {
        const allStepsComplete = plan.steps.every(s => progress.stepProgress[s.id]?.completed);
        if (allStepsComplete) {
          progress.completedAt = new Date().toISOString();
        }
      }
    }
  }

  await saveLessonProgress(progress);

  const accuracy = stepProgress.attempts > 0
    ? (stepProgress.correctAnswers / stepProgress.attempts) * 100
    : 0;

  return { completed: stepProgress.completed, accuracy };
}

// Reset lesson progress
export async function resetLessonProgress(lessonId: string): Promise<void> {
  const allProgress = await getAllLessonProgress();
  delete allProgress[lessonId];
  await AsyncStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(allProgress));
}

// Calculate overall lesson completion percentage
export function calculateLessonCompletion(plan: LessonPlan, progress: LessonProgress | null): number {
  if (!progress) return 0;

  const completedSteps = plan.steps.filter(step =>
    progress.stepProgress[step.id]?.completed
  ).length;

  return Math.round((completedSteps / plan.steps.length) * 100);
}
