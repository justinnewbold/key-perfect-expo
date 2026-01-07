import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, BORDER_RADIUS, SPACING } from '../utils/theme';

interface SettingsGroupProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
}

export default function IOSSettingsGroup({ title, footer, children }: SettingsGroupProps) {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title.toUpperCase()}</Text>}
      <View style={styles.groupContainer}>
        {Platform.OS === 'ios' && (
          <BlurView
            intensity={30}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.itemsContainer}>
          {React.Children.map(children, (child, index) => (
            <>
              {child}
              {index < React.Children.count(children) - 1 && (
                <View style={styles.separator} />
              )}
            </>
          ))}
        </View>
      </View>
      {footer && <Text style={styles.footer}>{footer}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: SPACING.md,
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  groupContainer: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(30, 30, 46, 0.8)' : COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  itemsContainer: {
    zIndex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.divider,
    marginLeft: SPACING.md + 40, // Align with text after icons
  },
  footer: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: SPACING.xs,
    marginHorizontal: SPACING.md,
    lineHeight: 16,
  },
});
