import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';

interface VoiceEncouragementProps {
  message: string | null;
  type?: 'success' | 'combo' | 'milestone' | 'perfect';
  onComplete?: () => void;
}

const ENCOURAGEMENT_MESSAGES = {
  combo: {
    3: ['Nice!', 'Good job!', 'Keep going!'],
    5: ['Great!', 'Fantastic!', 'You\'re on fire!'],
    10: ['Incredible!', 'Amazing!', 'Unstoppable!'],
    15: ['Legendary!', 'Phenomenal!', 'Godlike!'],
    20: ['INSANE!', 'UNBELIEVABLE!', 'PERFECTION!'],
  },
  success: ['Correct!', 'Yes!', 'Perfect!', 'Excellent!', 'Well done!'],
  milestone: ['Milestone reached!', 'Great progress!', 'You\'re crushing it!'],
  perfect: ['PERFECT!', 'FLAWLESS!', '100%!', 'AMAZING!'],
};

export function getEncouragementMessage(type: 'success' | 'combo' | 'milestone' | 'perfect', combo?: number): string {
  if (type === 'combo' && combo) {
    if (combo >= 20) return ENCOURAGEMENT_MESSAGES.combo[20][Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.combo[20].length)];
    if (combo >= 15) return ENCOURAGEMENT_MESSAGES.combo[15][Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.combo[15].length)];
    if (combo >= 10) return ENCOURAGEMENT_MESSAGES.combo[10][Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.combo[10].length)];
    if (combo >= 5) return ENCOURAGEMENT_MESSAGES.combo[5][Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.combo[5].length)];
    if (combo >= 3) return ENCOURAGEMENT_MESSAGES.combo[3][Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.combo[3].length)];
  }

  if (type === 'success') {
    return ENCOURAGEMENT_MESSAGES.success[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.success.length)];
  }

  if (type === 'milestone') {
    return ENCOURAGEMENT_MESSAGES.milestone[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.milestone.length)];
  }

  if (type === 'perfect') {
    return ENCOURAGEMENT_MESSAGES.perfect[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.perfect.length)];
  }

  return '';
}

export default function VoiceEncouragement({
  message,
  type = 'success',
  onComplete,
}: VoiceEncouragementProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (message) {
      // Haptic feedback
      if (type === 'perfect' || type === 'milestone') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else if (type === 'combo') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Animate in
      Animated.parallel([
        Animated.spring(opacity, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
          tension: 40,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
          tension: 40,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 6,
          tension: 40,
        }),
      ]).start();

      // Animate out
      const timeout = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Reset for next message
          scale.setValue(0.5);
          translateY.setValue(20);
          onComplete?.();
        });
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [message]);

  if (!message) return null;

  const getColor = () => {
    switch (type) {
      case 'perfect':
        return COLORS.warning;
      case 'combo':
        return COLORS.primary;
      case 'milestone':
        return COLORS.success;
      default:
        return COLORS.info;
    }
  };

  const getSize = () => {
    switch (type) {
      case 'perfect':
        return 36;
      case 'combo':
        return 32;
      case 'milestone':
        return 28;
      default:
        return 24;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ scale }, { translateY }],
        },
      ]}
    >
      <View style={[styles.bubble, { borderColor: getColor() + '60' }]}>
        <Text
          style={[
            styles.message,
            { color: getColor(), fontSize: getSize() },
          ]}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  bubble: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 3,
    ...SHADOWS.large,
  },
  message: {
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
