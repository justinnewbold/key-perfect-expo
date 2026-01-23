import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'keyPerfect_onboarding';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  action?: string;
  highlightElement?: string;
}

export interface OnboardingProgress {
  completed: boolean;
  currentStep: number;
  stepsCompleted: string[];
  skipped: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Key Perfect!',
    description: 'Train your ear to recognize musical notes, intervals, and chords.',
    icon: '🎵',
  },
  {
    id: 'how_it_works',
    title: 'How It Works',
    description: 'Listen to a sound, identify the note, and build your perfect pitch skills!',
    icon: '🎧',
  },
  {
    id: 'play_demo',
    title: 'Try It Out!',
    description: 'Let\'s practice identifying a note. Listen carefully and select the correct answer.',
    icon: '🎹',
    action: 'play_demo_note',
  },
  {
    id: 'correct_feedback',
    title: 'Great Job! 🎉',
    description: 'You earned XP and improved your accuracy. Keep practicing to level up!',
    icon: '⭐',
  },
  {
    id: 'game_modes',
    title: 'Explore Game Modes',
    description: 'Choose from 8 different modes: Campaign, Speed, Survival, and more!',
    icon: '🎮',
    highlightElement: 'game_modes',
  },
  {
    id: 'daily_practice',
    title: 'Build a Streak',
    description: 'Practice daily to maintain your streak and unlock special rewards!',
    icon: '🔥',
  },
  {
    id: 'ready_to_start',
    title: 'You\'re All Set!',
    description: 'Start your journey to perfect pitch. Good luck!',
    icon: '🚀',
  },
];

// Get onboarding progress
export async function getOnboardingProgress(): Promise<OnboardingProgress> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading onboarding progress:', error);
  }

  return {
    completed: false,
    currentStep: 0,
    stepsCompleted: [],
    skipped: false,
  };
}

// Save onboarding progress
async function saveOnboardingProgress(progress: OnboardingProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving onboarding progress:', error);
  }
}

// Check if onboarding completed
export async function isOnboardingCompleted(): Promise<boolean> {
  const progress = await getOnboardingProgress();
  return progress.completed || progress.skipped;
}

// Complete current step and move to next
export async function completeCurrentStep(): Promise<OnboardingProgress> {
  const progress = await getOnboardingProgress();
  const currentStepId = ONBOARDING_STEPS[progress.currentStep]?.id;

  if (currentStepId && !progress.stepsCompleted.includes(currentStepId)) {
    progress.stepsCompleted.push(currentStepId);
  }

  progress.currentStep += 1;

  if (progress.currentStep >= ONBOARDING_STEPS.length) {
    progress.completed = true;
  }

  await saveOnboardingProgress(progress);
  return progress;
}

// Skip onboarding
export async function skipOnboarding(): Promise<void> {
  const progress = await getOnboardingProgress();
  progress.skipped = true;
  progress.completed = true;
  await saveOnboardingProgress(progress);
}

// Reset onboarding (for testing)
export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// Get current step
export async function getCurrentStep(): Promise<OnboardingStep | null> {
  const progress = await getOnboardingProgress();
  if (progress.completed || progress.currentStep >= ONBOARDING_STEPS.length) {
    return null;
  }
  return ONBOARDING_STEPS[progress.currentStep];
}

// Interactive tutorial tooltips
export interface TooltipConfig {
  id: string;
  element: string;
  title: string;
  message: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  dismissable: boolean;
}

export const TOOLTIPS: TooltipConfig[] = [
  {
    id: 'xp_bar',
    element: 'xp_display',
    title: 'Your XP Progress',
    message: 'Earn XP by answering correctly. Level up to unlock new features!',
    position: 'bottom',
    dismissable: true,
  },
  {
    id: 'streak_indicator',
    element: 'streak_display',
    title: 'Daily Streak',
    message: 'Practice every day to build your streak and earn bonus rewards!',
    position: 'bottom',
    dismissable: true,
  },
  {
    id: 'game_modes',
    element: 'game_modes_button',
    title: 'Game Modes',
    message: 'Try different modes to practice various musical skills!',
    position: 'bottom',
    dismissable: true,
  },
  {
    id: 'settings',
    element: 'settings_button',
    title: 'Settings',
    message: 'Customize your instrument, difficulty, and more!',
    position: 'left',
    dismissable: true,
  },
];

// Track which tooltips have been shown
const TOOLTIPS_SHOWN_KEY = 'keyPerfect_tooltipsShown';

export async function getShownTooltips(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(TOOLTIPS_SHOWN_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
}

export async function markTooltipAsShown(tooltipId: string): Promise<void> {
  try {
    const shown = await getShownTooltips();
    if (!shown.includes(tooltipId)) {
      shown.push(tooltipId);
      await AsyncStorage.setItem(TOOLTIPS_SHOWN_KEY, JSON.stringify(shown));
    }
  } catch (error) {
    console.error('Error marking tooltip as shown:', error);
  }
}

export async function shouldShowTooltip(tooltipId: string): Promise<boolean> {
  const shown = await getShownTooltips();
  return !shown.includes(tooltipId);
}

// First-time user achievements
export interface WelcomeAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  reward: {
    type: 'xp' | 'power_up';
    amount: number;
  };
}

export const WELCOME_ACHIEVEMENTS: WelcomeAchievement[] = [
  {
    id: 'first_note',
    title: 'First Note',
    description: 'Identify your first note correctly',
    icon: '🎵',
    reward: { type: 'xp', amount: 50 },
  },
  {
    id: 'five_in_a_row',
    title: 'On a Roll',
    description: 'Get 5 notes correct in a row',
    icon: '🔥',
    reward: { type: 'xp', amount: 100 },
  },
  {
    id: 'complete_tutorial',
    title: 'Quick Learner',
    description: 'Complete the tutorial',
    icon: '🎓',
    reward: { type: 'xp', amount: 200 },
  },
  {
    id: 'first_level',
    title: 'Getting Started',
    description: 'Complete your first level',
    icon: '⭐',
    reward: { type: 'xp', amount: 300 },
  },
];
