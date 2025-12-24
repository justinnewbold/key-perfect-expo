import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Cross-platform haptics wrapper that safely handles web platform
export const safeHaptics = {
  impactAsync: async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(style);
      } catch (error) {
        // Silently fail if haptics not available
      }
    }
  },

  notificationAsync: async (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(type);
      } catch (error) {
        // Silently fail if haptics not available
      }
    }
  },

  selectionAsync: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.selectionAsync();
      } catch (error) {
        // Silently fail if haptics not available
      }
    }
  },
};

// Re-export the types for convenience
export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';
