import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';
import { getComboMessage, getComboMultiplier } from '../types';

// Animation constants
const COMBO_MIN_THRESHOLD = 3; // Minimum combo to show indicator
const ANIMATION_SPRING_FRICTION = 3;
const ANIMATION_PULSE_DURATION = 500; // ms
const ANIMATION_SCALE_POPUP = 1.3;
const ANIMATION_SCALE_PULSE = 1.1;

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
          toValue: ANIMATION_SCALE_POPUP,
          friction: ANIMATION_SPRING_FRICTION,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: ANIMATION_SPRING_FRICTION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [combo]);

  // Continuous pulse for active combo
  useEffect(() => {
    if (combo >= COMBO_MIN_THRESHOLD) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: ANIMATION_SCALE_PULSE,
            duration: ANIMATION_PULSE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: ANIMATION_PULSE_DURATION,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [combo >= COMBO_MIN_THRESHOLD]);

  if (combo < COMBO_MIN_THRESHOLD) {
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
