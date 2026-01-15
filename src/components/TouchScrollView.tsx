import React from 'react';
import { ScrollView, ScrollViewProps } from 'react-native-gesture-handler';
import { Platform } from 'react-native';

/**
 * Enhanced ScrollView component optimized for touch devices
 * Fixes common scrolling issues on mobile by ensuring proper
 * gesture handler configuration
 */
export default function TouchScrollView({
  children,
  contentContainerStyle,
  ...props
}: ScrollViewProps) {
  return (
    <ScrollView
      {...props}
      contentContainerStyle={contentContainerStyle}
      // Critical props for touch scrolling on mobile devices
      showsVerticalScrollIndicator={props.showsVerticalScrollIndicator ?? false}
      scrollEventThrottle={props.scrollEventThrottle ?? 16}
      bounces={props.bounces ?? true}
      overScrollMode={props.overScrollMode ?? 'always'}
      keyboardShouldPersistTaps={props.keyboardShouldPersistTaps ?? 'handled'}
      // Native-specific optimizations
      removeClippedSubviews={Platform.OS !== 'web' ? true : false}
      // Ensure smooth scrolling on Android
      nestedScrollEnabled={Platform.OS === 'android' ? true : undefined}
      // iOS-specific optimizations
      scrollIndicatorInsets={Platform.OS === 'ios' ? { right: 1 } : undefined}
      // Ensure gestures are properly recognized
      waitFor={undefined}
      simultaneousHandlers={undefined}
    >
      {children}
    </ScrollView>
  );
}
