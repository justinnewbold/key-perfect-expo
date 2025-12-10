import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Safe haptics wrapper that only runs on native platforms
export const safeHaptics = {
  impact: async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(style);
      } catch (e) {
        // Silently fail if haptics not available
      }
    }
  },

  notification: async (type: Haptics.NotificationFeedbackType) => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(type);
      } catch (e) {
        // Silently fail if haptics not available
      }
    }
  },

  selection: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.selectionAsync();
      } catch (e) {
        // Silently fail if haptics not available
      }
    }
  },
};

// Re-export types for convenience
export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';
