import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Cross-platform haptics wrapper that safely handles web platform
export const safeHaptics = {
  // Standard impacts
  impactAsync: async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(style);
      } catch (error) {
        // Silently fail if haptics not available
      }
    }
  },

  // Notification feedback
  notificationAsync: async (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(type);
      } catch (error) {
        // Silently fail if haptics not available
      }
    }
  },

  // Selection feedback (scrolling through options)
  selectionAsync: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.selectionAsync();
      } catch (error) {
        // Silently fail if haptics not available
      }
    }
  },

  // iOS-native-style patterns for specific actions

  // Light tap - for scrolling through options
  lightTap: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {}
    }
  },

  // Medium tap - for button presses
  mediumTap: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {}
    }
  },

  // Heavy tap - for important actions
  heavyTap: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {}
    }
  },

  // Rigid impact - for correct answers (satisfying confirmation)
  rigidImpact: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      } catch (error) {}
    }
  },

  // Soft impact - for subtle interactions like note playing
  softImpact: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      } catch (error) {}
    }
  },

  // Success pattern - for correct answers and achievements
  successPattern: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {}
    }
  },

  // Error pattern - for wrong answers
  errorPattern: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (error) {}
    }
  },

  // Warning pattern - for low lives, time running out
  warningPattern: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (error) {}
    }
  },

  // Victory celebration pattern - for level completion
  victoryPattern: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(async () => {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          } catch (error) {}
        }, 100);
        setTimeout(async () => {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch (error) {}
        }, 200);
        setTimeout(async () => {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch (error) {}
        }, 300);
      } catch (error) {}
    }
  },

  // Achievement unlocked pattern
  achievementPattern: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        setTimeout(async () => {
          try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {}
        }, 150);
      } catch (error) {}
    }
  },

  // Level up pattern
  levelUpPattern: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(async () => {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch (error) {}
        }, 100);
        setTimeout(async () => {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          } catch (error) {}
        }, 200);
        setTimeout(async () => {
          try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {}
        }, 350);
      } catch (error) {}
    }
  },

  // Streak milestone pattern
  streakPattern: async () => {
    if (Platform.OS !== 'web') {
      try {
        for (let i = 0; i < 3; i++) {
          setTimeout(async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
            } catch (error) {}
          }, i * 100);
        }
      } catch (error) {}
    }
  },

  // Game over pattern
  gameOverPattern: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(async () => {
          try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          } catch (error) {}
        }, 200);
      } catch (error) {}
    }
  },

  // Countdown tick
  countdownTick: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      } catch (error) {}
    }
  },

  // Note play feedback
  notePlayFeedback: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      } catch (error) {}
    }
  },

  // Button press down
  buttonPressDown: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {}
    }
  },

  // Toggle switch
  toggleSwitch: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      } catch (error) {}
    }
  },

  // Slider change
  sliderChange: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.selectionAsync();
      } catch (error) {}
    }
  },
};

// Re-export the types for convenience
export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';
