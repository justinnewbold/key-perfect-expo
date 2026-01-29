import React, { memo } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, AccessibilityRole } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '../utils/theme';

interface PressableCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'light' | 'dark' | 'success' | 'error';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
  enableHaptics?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityHint?: string;
}

function PressableCard({
  children,
  onPress,
  onLongPress,
  style,
  variant = 'default',
  padding = 'md',
  disabled = false,
  enableHaptics = true,
  accessibilityLabel,
  accessibilityRole,
  accessibilityHint,
}: PressableCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const variantStyles = {
    default: { backgroundColor: COLORS.glass },
    light: { backgroundColor: COLORS.glassLight },
    dark: { backgroundColor: COLORS.cardBackground },
    success: { backgroundColor: COLORS.successLight },
    error: { backgroundColor: COLORS.errorLight },
  };

  const paddingStyles = {
    none: 0,
    sm: SPACING.sm,
    md: SPACING.md,
    lg: SPACING.lg,
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.96, {
      damping: 15,
      stiffness: 150,
    });
    opacity.value = withTiming(0.8, { duration: 100 });
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    if (disabled) return;
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress?.();
  };

  const handleLongPress = () => {
    if (disabled) return;
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onLongPress?.();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={disabled || (!onPress && !onLongPress)}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole || (accessibilityLabel ? 'button' : undefined)}
      accessibilityHint={accessibilityHint}
    >
      <Animated.View
        style={[
          styles.card,
          variantStyles[variant],
          { padding: paddingStyles[padding] },
          SHADOWS.medium,
          disabled && styles.disabled,
          animatedStyle,
          style,
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default memo(PressableCard);
