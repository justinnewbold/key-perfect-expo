import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';

interface BadgeIconProps {
  children: React.ReactNode;
  count?: number;
  showBadge?: boolean;
  maxCount?: number;
  variant?: 'dot' | 'count';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export default function BadgeIcon({
  children,
  count = 0,
  showBadge = false,
  maxCount = 99,
  variant = 'count',
  position = 'top-right'
}: BadgeIconProps) {
  const shouldShowBadge = showBadge || (count > 0 && variant === 'count');

  const getPositionStyle = () => {
    switch (position) {
      case 'top-right':
        return { top: -2, right: -6 };
      case 'top-left':
        return { top: -2, left: -6 };
      case 'bottom-right':
        return { bottom: -2, right: -6 };
      case 'bottom-left':
        return { bottom: -2, left: -6 };
      default:
        return { top: -2, right: -6 };
    }
  };

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <View style={styles.container}>
      {children}
      {shouldShowBadge && (
        <View style={[
          variant === 'dot' ? styles.dot : styles.badge,
          getPositionStyle()
        ]}>
          {variant === 'count' && count > 0 && (
            <Text style={styles.badgeText}>{displayCount}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: COLORS.cardBackground,
  },
  badgeText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    borderWidth: 1.5,
    borderColor: COLORS.cardBackground,
  },
});
