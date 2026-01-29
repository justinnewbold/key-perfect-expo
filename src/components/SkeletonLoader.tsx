import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SPACING } from '../utils/theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width = '100%', height = 20, borderRadius = BORDER_RADIUS.md, style }: SkeletonLoaderProps) {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, []);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  style?: ViewStyle;
  rows?: number;
}

export function SkeletonCard({ style, rows = 3 }: SkeletonCardProps) {
  return (
    <View style={[styles.card, style]}>
      <SkeletonBox width="40%" height={24} style={{ marginBottom: SPACING.md }} />
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={{ marginBottom: SPACING.sm }}>
          <SkeletonBox height={16} style={{ marginBottom: SPACING.xs }} />
          <SkeletonBox width="80%" height={12} />
        </View>
      ))}
    </View>
  );
}

interface SkeletonListProps {
  count?: number;
  style?: ViewStyle;
}

export function SkeletonList({ count = 3, style }: SkeletonListProps) {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} style={{ marginBottom: SPACING.md }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.glass,
  },
  card: {
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.md,
  },
});
