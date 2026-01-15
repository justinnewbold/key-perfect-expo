import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';
import { getComboMessage, getComboMultiplier } from '../types';

interface ComboIndicatorProps {
  combo: number;
  style?: any;
}

export default function ComboIndicator({ combo, style }: ComboIndicatorProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animate when combo reaches milestones
  useEffect(() => {
    const message = getComboMessage(combo);
    if (message) {
      // Pop animation
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.3,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [combo]);

  // Continuous pulse for active combo
  useEffect(() => {
    if (combo >= 3) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [combo >= 3]);

  if (combo < 3) {
    return null;
  }

  const multiplier = getComboMultiplier(combo);
  const message = getComboMessage(combo);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Text style={styles.comboText}>{combo}x COMBO</Text>
        {message && <Text style={styles.message}>{message}</Text>}
        {multiplier > 1 && (
          <Text style={styles.multiplier}>{multiplier}x XP</Text>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    backgroundColor: COLORS.warning + '20',
    borderWidth: 2,
    borderColor: COLORS.warning,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  comboText: {
    color: COLORS.warning,
    fontSize: 20,
    fontWeight: 'bold',
  },
  message: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  multiplier: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
