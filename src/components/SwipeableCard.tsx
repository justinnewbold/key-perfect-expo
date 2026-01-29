import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';

export interface SwipeAction {
  text: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  style?: ViewStyle;
  enabled?: boolean;
}

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 100;

export default function SwipeableCard({
  children,
  leftAction,
  rightAction,
  style,
  enabled = true,
}: SwipeableCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);
  const actionTriggered = useRef(false);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    {
      useNativeDriver: true,
      listener: (event: PanGestureHandlerGestureEvent) => {
        const { translationX } = event.nativeEvent;
        const totalTranslation = lastOffset.current + translationX;

        // Trigger haptic when crossing threshold
        if (!actionTriggered.current) {
          if (leftAction && totalTranslation < -SWIPE_THRESHOLD) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            actionTriggered.current = true;
          } else if (rightAction && totalTranslation > SWIPE_THRESHOLD) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            actionTriggered.current = true;
          }
        }
      },
    }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === 4) { // ACTIVE state
      const { translationX } = event.nativeEvent;
      const totalTranslation = lastOffset.current + translationX;

      // Check if action should be triggered
      if (leftAction && totalTranslation < -SWIPE_THRESHOLD) {
        // Swipe left action
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Animated.timing(translateX, {
          toValue: -ACTION_WIDTH * 2,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          leftAction.onPress();
          resetPosition();
        });
      } else if (rightAction && totalTranslation > SWIPE_THRESHOLD) {
        // Swipe right action
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Animated.timing(translateX, {
          toValue: ACTION_WIDTH * 2,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          rightAction.onPress();
          resetPosition();
        });
      } else {
        // Reset to original position
        resetPosition();
      }

      actionTriggered.current = false;
    }
  };

  const resetPosition = () => {
    lastOffset.current = 0;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  };

  if (!enabled || (!leftAction && !rightAction)) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={[styles.container, style]}>
      {/* Left Action (revealed when swiping left) */}
      {leftAction && (
        <View style={[styles.actionContainer, styles.leftAction, { backgroundColor: leftAction.color }]}>
          <Ionicons name={leftAction.icon as any} size={24} color={COLORS.textPrimary} />
          <Text style={styles.actionText}>{leftAction.text}</Text>
        </View>
      )}

      {/* Right Action (revealed when swiping right) */}
      {rightAction && (
        <View style={[styles.actionContainer, styles.rightAction, { backgroundColor: rightAction.color }]}>
          <Ionicons name={rightAction.icon as any} size={24} color={COLORS.textPrimary} />
          <Text style={styles.actionText}>{rightAction.text}</Text>
        </View>
      )}

      {/* Swipeable Content */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.xl,
  },
  content: {
    backgroundColor: 'transparent',
  },
  actionContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  leftAction: {
    right: 0,
  },
  rightAction: {
    left: 0,
  },
  actionText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});
