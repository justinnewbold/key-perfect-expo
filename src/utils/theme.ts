export const COLORS = {
  // Primary gradient
  gradientStart: '#667eea',
  gradientEnd: '#764ba2',
  
  // Glass morphism
  glass: 'rgba(255, 255, 255, 0.1)',
  glassBorder: 'rgba(255, 255, 255, 0.2)',
  glassLight: 'rgba(255, 255, 255, 0.15)',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  textDark: '#1a1a2e',
  
  // Status colors
  success: '#4ade80',
  successLight: 'rgba(74, 222, 128, 0.2)',
  error: '#f87171',
  errorLight: 'rgba(248, 113, 113, 0.2)',
  warning: '#fbbf24',
  warningLight: 'rgba(251, 191, 36, 0.2)',
  info: '#60a5fa',
  infoLight: 'rgba(96, 165, 250, 0.2)',
  
  // XP/Progress
  xpGradientStart: '#a855f7',
  xpGradientEnd: '#6366f1',
  xpBackground: 'rgba(168, 85, 247, 0.2)',
  
  // Game mode colors
  speedMode: '#FF6B6B',
  survivalMode: '#4ECDC4',
  dailyChallenge: '#FFE66D',
  intervals: '#95E1D3',
  progressions: '#F38181',
  reverseMode: '#AA96DA',
  inversions: '#FCBAD3',
  scales: '#A8E6CF',
  
  // Misc
  overlay: 'rgba(0, 0, 0, 0.5)',
  cardBackground: 'rgba(255, 255, 255, 0.08)',
  inputBackground: 'rgba(255, 255, 255, 0.05)',
  divider: 'rgba(255, 255, 255, 0.1)',
  
  // Level colors
  levelLocked: 'rgba(255, 255, 255, 0.3)',
  levelUnlocked: 'rgba(255, 255, 255, 0.1)',
  levelCompleted: 'rgba(74, 222, 128, 0.2)',
  levelPerfect: 'rgba(251, 191, 36, 0.3)',
};

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
