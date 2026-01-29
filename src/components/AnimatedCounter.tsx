import React, { useEffect, useRef, useState } from 'react';
import { Text, Animated, TextStyle, Easing } from 'react-native';
import { COLORS } from '../utils/theme';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: TextStyle;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export default function AnimatedCounter({
  value,
  duration = 800,
  style,
  prefix = '',
  suffix = '',
  decimals = 0,
  easing = 'easeOut'
}: AnimatedCounterProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    // Set up listener to update display value
    const listenerId = animatedValue.addListener(({ value: newValue }) => {
      setDisplayValue(newValue);
    });

    // Animate from previous value to new value
    animatedValue.setValue(previousValue.current);

    const easingFunc = getEasing(easing);

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
      easing: easingFunc,
    }).start();

    previousValue.current = value;

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [value]);

  const getEasing = (type: string) => {
    switch (type) {
      case 'linear':
        return Easing.linear;
      case 'easeIn':
        return Easing.in(Easing.ease);
      case 'easeOut':
        return Easing.out(Easing.ease);
      case 'easeInOut':
        return Easing.inOut(Easing.ease);
      default:
        return Easing.out(Easing.ease);
    }
  };

  const formatted = displayValue.toFixed(decimals);

  return (
    <Text style={[{ color: COLORS.textPrimary }, style]}>
      {prefix}{formatted}{suffix}
    </Text>
  );
}

// Specialized counter for XP with + prefix
export function AnimatedXPCounter({ value, style }: { value: number; style?: TextStyle }) {
  const combinedStyle = { color: COLORS.success, fontWeight: 'bold' as 'bold', ...(style || {}) };
  return (
    <AnimatedCounter
      value={value}
      prefix="+"
      suffix=" XP"
      duration={1000}
      easing="easeOut"
      style={combinedStyle}
    />
  );
}

// Specialized counter for scores
export function AnimatedScoreCounter({ value, style }: { value: number; style?: TextStyle }) {
  const combinedStyle = { fontSize: 32, fontWeight: 'bold' as 'bold', ...(style || {}) };
  return (
    <AnimatedCounter
      value={value}
      duration={600}
      easing="easeOut"
      style={combinedStyle}
    />
  );
}

// Specialized counter for percentages
export function AnimatedPercentageCounter({ value, style }: { value: number; style?: TextStyle }) {
  return (
    <AnimatedCounter
      value={value}
      suffix="%"
      decimals={1}
      duration={800}
      easing="easeOut"
      style={style}
    />
  );
}
