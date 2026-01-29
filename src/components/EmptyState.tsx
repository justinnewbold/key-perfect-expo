import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Button from './Button';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'subtle';
}

export default function EmptyState({
  icon = 'file-tray-outline',
  title,
  description,
  actionLabel,
  onAction,
  style,
  variant = 'default',
}: EmptyStateProps) {
  if (variant === 'subtle') {
    return (
      <View style={[styles.container, styles.subtleContainer, style]}>
        <Ionicons name={icon as any} size={48} color={COLORS.textMuted} />
        <Text style={styles.subtleTitle}>{title}</Text>
        {description && <Text style={styles.subtleDescription}>{description}</Text>}
        {actionLabel && onAction && (
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="outline"
            size="md"
            style={{ marginTop: SPACING.md }}
          />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={[COLORS.primary + '20', COLORS.primary + '10']}
          style={styles.iconGradient}
        >
          <Ionicons name={icon as any} size={64} color={COLORS.primary} />
        </LinearGradient>
      </View>

      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}

      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size="lg"
          style={{ marginTop: SPACING.lg }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl * 2,
  },
  subtleContainer: {
    paddingVertical: SPACING.xl,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  subtleTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  subtleDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
});
