import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';

export interface MenuAction {
  icon: string;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'destructive';
}

interface LongPressMenuProps {
  children: React.ReactNode;
  actions: MenuAction[];
  onLongPress?: () => void;
}

export default function LongPressMenu({ children, actions, onLongPress }: LongPressMenuProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const scale = useRef(new Animated.Value(1)).current;
  const menuScale = useRef(new Animated.Value(0.9)).current;
  const menuOpacity = useRef(new Animated.Value(0)).current;

  const handleLongPress = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setMenuPosition({ x: pageX, y: pageY });

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Scale down slightly
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 5,
    }).start();

    setMenuVisible(true);
    onLongPress?.();

    // Animate menu in
    Animated.parallel([
      Animated.spring(menuScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }),
      Animated.timing(menuOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handleMenuDismiss = () => {
    Animated.parallel([
      Animated.timing(menuScale, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(menuOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuVisible(false);
    });
  };

  const handleActionPress = (action: MenuAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleMenuDismiss();
    // Delay action slightly to let menu close
    setTimeout(() => action.onPress(), 150);
  };

  return (
    <>
      <Pressable
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
        delayLongPress={400}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          {children}
        </Animated.View>
      </Pressable>

      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={handleMenuDismiss}
      >
        <Pressable style={styles.modalOverlay} onPress={handleMenuDismiss}>
          <Animated.View
            style={[
              styles.menu,
              {
                top: menuPosition.y - 50,
                left: Math.max(SPACING.md, Math.min(menuPosition.x - 100, 400 - SPACING.md)),
                transform: [{ scale: menuScale }],
                opacity: menuOpacity,
              },
            ]}
          >
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index === 0 && styles.menuItemFirst,
                  index === actions.length - 1 && styles.menuItemLast,
                ]}
                onPress={() => handleActionPress(action)}
              >
                <Ionicons
                  name={action.icon as any}
                  size={20}
                  color={action.variant === 'destructive' ? COLORS.error : COLORS.textPrimary}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    action.variant === 'destructive' && styles.menuItemTextDestructive,
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  menu: {
    position: 'absolute',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    minWidth: 200,
    ...SHADOWS.large,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  menuItemFirst: {
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  menuItemLast: {
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  menuItemTextDestructive: {
    color: COLORS.error,
  },
});
