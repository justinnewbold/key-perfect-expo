import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { safeHaptics } from '../utils/haptics';
import { COLORS, BORDER_RADIUS, SPACING } from '../utils/theme';

interface SegmentedControlProps {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  disabled?: boolean;
}

export default function IOSSegmentedControl({
  values,
  selectedIndex,
  onChange,
  disabled = false,
}: SegmentedControlProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const segmentWidth = useRef(0);

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: selectedIndex * segmentWidth.current,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  }, [selectedIndex]);

  const handleLayout = (event: LayoutChangeEvent) => {
    segmentWidth.current = event.nativeEvent.layout.width / values.length;
    translateX.setValue(selectedIndex * segmentWidth.current);
  };

  const handlePress = (index: number) => {
    if (disabled || index === selectedIndex) return;
    safeHaptics.selectionAsync();
    onChange(index);
  };

  return (
    <View style={[styles.container, disabled && styles.disabled]} onLayout={handleLayout}>
      <Animated.View
        style={[
          styles.slider,
          {
            width: `${100 / values.length}%`,
            transform: [{ translateX }],
          },
        ]}
      />
      {values.map((value, index) => (
        <TouchableOpacity
          key={index}
          style={styles.segment}
          onPress={() => handlePress(index)}
          disabled={disabled}
          accessibilityRole="tab"
          accessibilityState={{ selected: index === selectedIndex }}
          accessibilityLabel={value}
        >
          <Text
            style={[
              styles.text,
              index === selectedIndex && styles.selectedText,
            ]}
          >
            {value}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: 2,
    position: 'relative',
  },
  slider: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 2,
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.md - 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  selectedText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
