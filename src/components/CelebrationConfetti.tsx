import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface CelebrationConfettiProps {
  visible: boolean;
  type?: 'achievement' | 'levelup' | 'victory' | 'milestone';
  onComplete?: () => void;
}

export default function CelebrationConfetti({
  visible,
  type = 'achievement',
  onComplete
}: CelebrationConfettiProps) {
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    if (visible && confettiRef.current) {
      // Trigger haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Fire confetti
      confettiRef.current?.start();

      // Call onComplete after animation
      const timeout = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [visible]);

  if (!visible) return null;

  const getConfettiConfig = () => {
    switch (type) {
      case 'levelup':
        return {
          count: 200,
          origin: { x: width / 2, y: height / 2 },
          explosionSpeed: 450,
          fallSpeed: 3000,
          colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#A78BFA'],
        };
      case 'victory':
        return {
          count: 250,
          origin: { x: width / 2, y: -10 },
          explosionSpeed: 350,
          fallSpeed: 2500,
          colors: ['#FFD700', '#FFA500', '#FF1493', '#00CED1', '#7B68EE'],
        };
      case 'milestone':
        return {
          count: 150,
          origin: { x: width / 2, y: height },
          explosionSpeed: 400,
          fallSpeed: 2800,
          colors: ['#FFD700', '#32CD32', '#FF6347', '#1E90FF', '#FF69B4'],
        };
      default: // achievement
        return {
          count: 120,
          origin: { x: width / 2, y: 0 },
          explosionSpeed: 350,
          fallSpeed: 2500,
          colors: ['#A78BFA', '#F472B6', '#60A5FA', '#34D399', '#FBBF24'],
        };
    }
  };

  const config = getConfettiConfig();

  return (
    <View style={styles.container} pointerEvents="none">
      <ConfettiCannon
        ref={confettiRef}
        count={config.count}
        origin={config.origin}
        autoStart={false}
        fadeOut={true}
        explosionSpeed={config.explosionSpeed}
        fallSpeed={config.fallSpeed}
        colors={config.colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
});
