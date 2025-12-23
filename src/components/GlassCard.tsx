import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '../utils/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'light' | 'dark' | 'success' | 'error';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  accessibilityLabel?: string;
}

function GlassCard({
  children,
  style,
  variant = 'default',
  padding = 'md',
  accessibilityLabel,
}: GlassCardProps) {
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

  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'summary' : undefined}
      style={[
        styles.card,
        variantStyles[variant],
        { padding: paddingStyles[padding] },
        SHADOWS.medium,
        style
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
