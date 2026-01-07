import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle, AccessibilityRole, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '../utils/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'light' | 'dark' | 'success' | 'error' | 'blur';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityHint?: string;
  blurIntensity?: number;
}

function GlassCard({
  children,
  style,
  variant = 'default',
  padding = 'md',
  accessibilityLabel,
  accessibilityRole,
  accessibilityHint,
  blurIntensity = 50,
}: GlassCardProps) {
  const variantStyles = {
    default: { backgroundColor: COLORS.glass },
    light: { backgroundColor: COLORS.glassLight },
    dark: { backgroundColor: COLORS.cardBackground },
    success: { backgroundColor: COLORS.successLight },
    error: { backgroundColor: COLORS.errorLight },
    blur: { backgroundColor: 'transparent' },
  };

  const paddingStyles = {
    none: 0,
    sm: SPACING.sm,
    md: SPACING.md,
    lg: SPACING.lg,
  };

  // Use BlurView on iOS for authentic frosted glass effect
  if (variant === 'blur' && Platform.OS === 'ios') {
    return (
      <View
        accessible={!!accessibilityLabel}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole || (accessibilityLabel ? 'summary' : undefined)}
        accessibilityHint={accessibilityHint}
        style={[
          styles.card,
          SHADOWS.medium,
          style,
        ]}
      >
        <BlurView
          intensity={blurIntensity}
          tint="dark"
          style={[StyleSheet.absoluteFill, { borderRadius: BORDER_RADIUS.xl }]}
        />
        <View style={{ padding: paddingStyles[padding] }}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole || (accessibilityLabel ? 'summary' : undefined)}
      accessibilityHint={accessibilityHint}
      style={[
        styles.card,
        variantStyles[variant],
        { padding: paddingStyles[padding] },
        SHADOWS.medium,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
});

export default memo(GlassCard);
