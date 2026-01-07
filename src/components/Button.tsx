import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { safeHaptics } from '../utils/haptics';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  haptic = true,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  // iOS-style scale animation
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (haptic) {
      safeHaptics.buttonPressDown();
    }
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    if (haptic) {
      safeHaptics.mediumTap();
    }
    onPress();
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: COLORS.glass,
      borderColor: COLORS.glassBorder,
    },
    secondary: {
      backgroundColor: COLORS.cardBackground,
      borderColor: COLORS.divider,
    },
    success: {
      backgroundColor: COLORS.successLight,
      borderColor: COLORS.success,
    },
    error: {
      backgroundColor: COLORS.errorLight,
      borderColor: COLORS.error,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: COLORS.glassBorder,
    },
  };

  const variantTextStyles: Record<string, TextStyle> = {
    primary: { color: COLORS.textPrimary },
    secondary: { color: COLORS.textSecondary },
    success: { color: COLORS.success },
    error: { color: COLORS.error },
    ghost: { color: COLORS.textSecondary },
    outline: { color: COLORS.textPrimary },
  };

  const sizeStyles: Record<string, { button: ViewStyle; text: TextStyle }> = {
    sm: {
      button: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm },
      text: { fontSize: 14 },
    },
    md: {
      button: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
      text: { fontSize: 16 },
    },
    lg: {
      button: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
      text: { fontSize: 18 },
    },
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        SHADOWS.small,
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: disabled || loading }}
        style={[
          styles.button,
          variantStyles[variant],
          sizeStyles[size].button,
          disabled && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={variantTextStyles[variant].color} />
        ) : (
          <>
            {icon}
            <Text
              style={[
                styles.text,
                variantTextStyles[variant],
                sizeStyles[size].text,
                icon && styles.textWithIcon,
                textStyle,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textWithIcon: {
    marginLeft: SPACING.xs,
  },
  disabled: {
    opacity: 0.5,
  },
});
