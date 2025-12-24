// Theme types
export type ThemeId = 'purple' | 'ocean' | 'sunset' | 'forest' | 'midnight';

export interface ThemeColors {
  gradientStart: string;
  gradientEnd: string;
  glass: string;
  glassBorder: string;
  glassLight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDark: string;
  success: string;
  successLight: string;
  error: string;
  errorLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;
  xpGradientStart: string;
  xpGradientEnd: string;
  xpBackground: string;
  speedMode: string;
  survivalMode: string;
  dailyChallenge: string;
  intervals: string;
  progressions: string;
  reverseMode: string;
  inversions: string;
  scales: string;
  overlay: string;
  cardBackground: string;
  inputBackground: string;
  divider: string;
  levelLocked: string;
  levelUnlocked: string;
  levelCompleted: string;
  levelPerfect: string;
}

// Available themes
export const THEMES: Record<ThemeId, { name: string; colors: ThemeColors }> = {
  purple: {
    name: 'Purple Dream',
    colors: {
      gradientStart: '#667eea',
      gradientEnd: '#764ba2',
      glass: 'rgba(255, 255, 255, 0.1)',
      glassBorder: 'rgba(255, 255, 255, 0.2)',
      glassLight: 'rgba(255, 255, 255, 0.15)',
      textPrimary: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.8)',
      textMuted: 'rgba(255, 255, 255, 0.6)',
      textDark: '#1a1a2e',
      success: '#4ade80',
      successLight: 'rgba(74, 222, 128, 0.2)',
      error: '#f87171',
      errorLight: 'rgba(248, 113, 113, 0.2)',
      warning: '#fbbf24',
      warningLight: 'rgba(251, 191, 36, 0.2)',
      info: '#60a5fa',
      infoLight: 'rgba(96, 165, 250, 0.2)',
      xpGradientStart: '#a855f7',
      xpGradientEnd: '#6366f1',
      xpBackground: 'rgba(168, 85, 247, 0.2)',
      speedMode: '#FF6B6B',
      survivalMode: '#4ECDC4',
      dailyChallenge: '#FFE66D',
      intervals: '#95E1D3',
      progressions: '#F38181',
      reverseMode: '#AA96DA',
      inversions: '#FCBAD3',
      scales: '#A8E6CF',
      overlay: 'rgba(0, 0, 0, 0.5)',
      cardBackground: 'rgba(255, 255, 255, 0.08)',
      inputBackground: 'rgba(255, 255, 255, 0.05)',
      divider: 'rgba(255, 255, 255, 0.1)',
      levelLocked: 'rgba(255, 255, 255, 0.3)',
      levelUnlocked: 'rgba(255, 255, 255, 0.1)',
      levelCompleted: 'rgba(74, 222, 128, 0.2)',
      levelPerfect: 'rgba(251, 191, 36, 0.3)',
    },
  },
  ocean: {
    name: 'Ocean Blue',
    colors: {
      gradientStart: '#0077b6',
      gradientEnd: '#023e8a',
      glass: 'rgba(255, 255, 255, 0.1)',
      glassBorder: 'rgba(255, 255, 255, 0.2)',
      glassLight: 'rgba(255, 255, 255, 0.15)',
      textPrimary: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.8)',
      textMuted: 'rgba(255, 255, 255, 0.6)',
      textDark: '#1a1a2e',
      success: '#4ade80',
      successLight: 'rgba(74, 222, 128, 0.2)',
      error: '#f87171',
      errorLight: 'rgba(248, 113, 113, 0.2)',
      warning: '#fbbf24',
      warningLight: 'rgba(251, 191, 36, 0.2)',
      info: '#90e0ef',
      infoLight: 'rgba(144, 224, 239, 0.2)',
      xpGradientStart: '#00b4d8',
      xpGradientEnd: '#0077b6',
      xpBackground: 'rgba(0, 180, 216, 0.2)',
      speedMode: '#FF6B6B',
      survivalMode: '#4ECDC4',
      dailyChallenge: '#FFE66D',
      intervals: '#95E1D3',
      progressions: '#F38181',
      reverseMode: '#AA96DA',
      inversions: '#FCBAD3',
      scales: '#A8E6CF',
      overlay: 'rgba(0, 0, 0, 0.5)',
      cardBackground: 'rgba(255, 255, 255, 0.08)',
      inputBackground: 'rgba(255, 255, 255, 0.05)',
      divider: 'rgba(255, 255, 255, 0.1)',
      levelLocked: 'rgba(255, 255, 255, 0.3)',
      levelUnlocked: 'rgba(255, 255, 255, 0.1)',
      levelCompleted: 'rgba(74, 222, 128, 0.2)',
      levelPerfect: 'rgba(251, 191, 36, 0.3)',
    },
  },
  sunset: {
    name: 'Sunset Glow',
    colors: {
      gradientStart: '#f97316',
      gradientEnd: '#dc2626',
      glass: 'rgba(255, 255, 255, 0.1)',
      glassBorder: 'rgba(255, 255, 255, 0.2)',
      glassLight: 'rgba(255, 255, 255, 0.15)',
      textPrimary: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.8)',
      textMuted: 'rgba(255, 255, 255, 0.6)',
      textDark: '#1a1a2e',
      success: '#4ade80',
      successLight: 'rgba(74, 222, 128, 0.2)',
      error: '#fca5a5',
      errorLight: 'rgba(252, 165, 165, 0.2)',
      warning: '#fcd34d',
      warningLight: 'rgba(252, 211, 77, 0.2)',
      info: '#60a5fa',
      infoLight: 'rgba(96, 165, 250, 0.2)',
      xpGradientStart: '#fb923c',
      xpGradientEnd: '#ea580c',
      xpBackground: 'rgba(251, 146, 60, 0.2)',
      speedMode: '#FF6B6B',
      survivalMode: '#4ECDC4',
      dailyChallenge: '#FFE66D',
      intervals: '#95E1D3',
      progressions: '#F38181',
      reverseMode: '#AA96DA',
      inversions: '#FCBAD3',
      scales: '#A8E6CF',
      overlay: 'rgba(0, 0, 0, 0.5)',
      cardBackground: 'rgba(255, 255, 255, 0.08)',
      inputBackground: 'rgba(255, 255, 255, 0.05)',
      divider: 'rgba(255, 255, 255, 0.1)',
      levelLocked: 'rgba(255, 255, 255, 0.3)',
      levelUnlocked: 'rgba(255, 255, 255, 0.1)',
      levelCompleted: 'rgba(74, 222, 128, 0.2)',
      levelPerfect: 'rgba(251, 191, 36, 0.3)',
    },
  },
  forest: {
    name: 'Forest Green',
    colors: {
      gradientStart: '#059669',
      gradientEnd: '#065f46',
      glass: 'rgba(255, 255, 255, 0.1)',
      glassBorder: 'rgba(255, 255, 255, 0.2)',
      glassLight: 'rgba(255, 255, 255, 0.15)',
      textPrimary: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.8)',
      textMuted: 'rgba(255, 255, 255, 0.6)',
      textDark: '#1a1a2e',
      success: '#6ee7b7',
      successLight: 'rgba(110, 231, 183, 0.2)',
      error: '#f87171',
      errorLight: 'rgba(248, 113, 113, 0.2)',
      warning: '#fbbf24',
      warningLight: 'rgba(251, 191, 36, 0.2)',
      info: '#60a5fa',
      infoLight: 'rgba(96, 165, 250, 0.2)',
      xpGradientStart: '#34d399',
      xpGradientEnd: '#10b981',
      xpBackground: 'rgba(52, 211, 153, 0.2)',
      speedMode: '#FF6B6B',
      survivalMode: '#4ECDC4',
      dailyChallenge: '#FFE66D',
      intervals: '#95E1D3',
      progressions: '#F38181',
      reverseMode: '#AA96DA',
      inversions: '#FCBAD3',
      scales: '#A8E6CF',
      overlay: 'rgba(0, 0, 0, 0.5)',
      cardBackground: 'rgba(255, 255, 255, 0.08)',
      inputBackground: 'rgba(255, 255, 255, 0.05)',
      divider: 'rgba(255, 255, 255, 0.1)',
      levelLocked: 'rgba(255, 255, 255, 0.3)',
      levelUnlocked: 'rgba(255, 255, 255, 0.1)',
      levelCompleted: 'rgba(74, 222, 128, 0.2)',
      levelPerfect: 'rgba(251, 191, 36, 0.3)',
    },
  },
  midnight: {
    name: 'Midnight',
    colors: {
      gradientStart: '#1e1b4b',
      gradientEnd: '#0f0f23',
      glass: 'rgba(255, 255, 255, 0.08)',
      glassBorder: 'rgba(255, 255, 255, 0.15)',
      glassLight: 'rgba(255, 255, 255, 0.12)',
      textPrimary: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.75)',
      textMuted: 'rgba(255, 255, 255, 0.5)',
      textDark: '#1a1a2e',
      success: '#4ade80',
      successLight: 'rgba(74, 222, 128, 0.2)',
      error: '#f87171',
      errorLight: 'rgba(248, 113, 113, 0.2)',
      warning: '#fbbf24',
      warningLight: 'rgba(251, 191, 36, 0.2)',
      info: '#818cf8',
      infoLight: 'rgba(129, 140, 248, 0.2)',
      xpGradientStart: '#8b5cf6',
      xpGradientEnd: '#6366f1',
      xpBackground: 'rgba(139, 92, 246, 0.2)',
      speedMode: '#FF6B6B',
      survivalMode: '#4ECDC4',
      dailyChallenge: '#FFE66D',
      intervals: '#95E1D3',
      progressions: '#F38181',
      reverseMode: '#AA96DA',
      inversions: '#FCBAD3',
      scales: '#A8E6CF',
      overlay: 'rgba(0, 0, 0, 0.6)',
      cardBackground: 'rgba(255, 255, 255, 0.05)',
      inputBackground: 'rgba(255, 255, 255, 0.03)',
      divider: 'rgba(255, 255, 255, 0.08)',
      levelLocked: 'rgba(255, 255, 255, 0.25)',
      levelUnlocked: 'rgba(255, 255, 255, 0.08)',
      levelCompleted: 'rgba(74, 222, 128, 0.2)',
      levelPerfect: 'rgba(251, 191, 36, 0.3)',
    },
  },
};

// Default colors (Purple Dream theme)
export const COLORS = THEMES.purple.colors;

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  }),
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const INSTRUMENTS = [
  { id: 'piano', name: 'Piano', icon: '🎹' },
  { id: 'guitar', name: 'Guitar', icon: '🎸' },
  { id: 'strings', name: 'Strings', icon: '🎻' },
  { id: 'synth', name: 'Synth', icon: '🎛️' },
  { id: 'organ', name: 'Organ', icon: '🎹' },
  { id: 'bass', name: 'Bass', icon: '🎸' },
  { id: 'drums', name: 'Drums', icon: '🥁' },
  { id: 'brass', name: 'Brass', icon: '🎺' },
  { id: 'woodwind', name: 'Woodwind', icon: '🎷' },
  { id: 'vocals', name: 'Vocals', icon: '🎤' },
] as const;

export const LEVEL_TITLES = [
  { min: 1, max: 4, title: 'Beginner', color: '#9ca3af' },
  { min: 5, max: 9, title: 'Novice', color: '#22c55e' },
  { min: 10, max: 19, title: 'Intermediate', color: '#3b82f6' },
  { min: 20, max: 34, title: 'Advanced', color: '#a855f7' },
  { min: 35, max: 49, title: 'Expert', color: '#f59e0b' },
  { min: 50, max: 74, title: 'Master', color: '#ef4444' },
  { min: 75, max: 99, title: 'Virtuoso', color: '#ec4899' },
  { min: 100, max: Infinity, title: 'Legend', color: '#fbbf24' },
];

export function getLevelTitle(level: number): { title: string; color: string } {
  const found = LEVEL_TITLES.find(t => level >= t.min && level <= t.max);
  return found || { title: 'Beginner', color: '#9ca3af' };
}
