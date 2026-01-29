import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../utils/theme';

interface SoundVisualizerProps {
  isPlaying: boolean;
  frequency?: number; // Hz
  intensity?: number; // 0-1
  color?: string;
  variant?: 'waveform' | 'bars' | 'circular' | 'particle';
}

const { width } = Dimensions.get('window');
const BAR_COUNT = 32;
const PARTICLE_COUNT = 20;

export default function SoundVisualizer({
  isPlaying,
  frequency = 440,
  intensity = 0.8,
  color = COLORS.gradientStart,
  variant = 'waveform'
}: SoundVisualizerProps) {
  const animatedValues = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0))
  ).current;

  const particlePositions = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * 200),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  const wavePhase = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isPlaying) {
      startAnimation();
    } else {
      stopAnimation();
    }

    return () => {
      stopAnimation();
    };
  }, [isPlaying]);

  const startAnimation = () => {
    if (variant === 'waveform') {
      startWaveAnimation();
    } else if (variant === 'bars') {
      startBarAnimation();
    } else if (variant === 'circular') {
      startCircularAnimation();
    } else if (variant === 'particle') {
      startParticleAnimation();
    }
  };

  const stopAnimation = () => {
    animatedValues.forEach(val => val.setValue(0));
    particlePositions.forEach(particle => {
      particle.scale.setValue(0);
      particle.opacity.setValue(0);
    });
    wavePhase.setValue(0);
    pulseScale.setValue(1);
  };

  const startWaveAnimation = () => {
    // Continuous wave animation
    Animated.loop(
      Animated.timing(wavePhase, {
        toValue: 2 * Math.PI,
        duration: 2000 / (frequency / 440), // Faster for higher frequencies
        useNativeDriver: true,
      })
    ).start();
  };

  const startBarAnimation = () => {
    // Animated bars with random heights
    const animations = animatedValues.map((value, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: Math.random() * intensity,
            duration: 100 + Math.random() * 200,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: Math.random() * intensity * 0.5,
            duration: 100 + Math.random() * 200,
            useNativeDriver: true,
          }),
        ])
      );
    });

    Animated.parallel(animations).start();
  };

  const startCircularAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1 + intensity * 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startParticleAnimation = () => {
    const animations = particlePositions.map((particle) => {
      return Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(particle.y, {
              toValue: -50,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(particle.y, {
            toValue: 200,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    });

    Animated.parallel(animations).start();
  };

  const renderWaveform = () => {
    const points = 50;
    return (
      <View style={styles.waveContainer}>
        {Array.from({ length: points }).map((_, index) => {
          const progress = index / points;
          const animatedHeight = wavePhase.interpolate({
            inputRange: [0, 2 * Math.PI],
            outputRange: [
              20 + Math.sin(progress * Math.PI * 4) * intensity * 40,
              20 + Math.sin(progress * Math.PI * 4 + Math.PI) * intensity * 40,
            ],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.waveDot,
                {
                  left: (width - 80) * progress + 40,
                  height: animatedHeight,
                  backgroundColor: color,
                  opacity: isPlaying ? 0.8 : 0,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const renderBars = () => {
    return (
      <View style={styles.barsContainer}>
        {animatedValues.map((value, index) => {
          const height = value.interpolate({
            inputRange: [0, 1],
            outputRange: [5, 100],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.bar,
                {
                  height,
                  backgroundColor: color,
                  opacity: isPlaying ? 0.9 : 0,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const renderCircular = () => {
    return (
      <View style={styles.circularContainer}>
        <Animated.View
          style={[
            styles.outerRing,
            {
              transform: [{ scale: pulseScale }],
              borderColor: color,
              opacity: isPlaying ? 0.6 : 0,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.middleRing,
            {
              transform: [{ scale: pulseScale }],
              borderColor: color,
              opacity: isPlaying ? 0.8 : 0,
            },
          ]}
        />
        <View style={[styles.innerCircle, { backgroundColor: color, opacity: isPlaying ? 1 : 0 }]} />
      </View>
    );
  };

  const renderParticles = () => {
    return (
      <View style={styles.particleContainer}>
        {particlePositions.map((particle, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: particle.x,
                transform: [
                  { translateY: particle.y },
                  { scale: particle.scale },
                ],
                opacity: particle.opacity,
                backgroundColor: color,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {variant === 'waveform' && renderWaveform()}
      {variant === 'bars' && renderBars()}
      {variant === 'circular' && renderCircular()}
      {variant === 'particle' && renderParticles()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 120,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  waveContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  waveDot: {
    position: 'absolute',
    width: 3,
    borderRadius: 1.5,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    height: 100,
  },
  bar: {
    width: 6,
    borderRadius: 3,
  },
  circularContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  middleRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
  },
  innerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  particleContainer: {
    flex: 1,
    width: '100%',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
