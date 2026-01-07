import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safeHaptics } from '../utils/haptics';
import { COLORS, SPACING } from '../utils/theme';

interface SettingsRowProps {
  icon?: string;
  iconColor?: string;
  iconBackground?: string;
  title: string;
  subtitle?: string;
  value?: string;
  type?: 'navigation' | 'toggle' | 'button' | 'value';
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export default function IOSSettingsRow({
  icon,
  iconColor = COLORS.textPrimary,
  iconBackground,
  title,
  subtitle,
  value,
  type = 'navigation',
  toggleValue,
  onToggle,
  onPress,
  destructive = false,
  disabled = false,
}: SettingsRowProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePress = () => {
    if (disabled) return;
    safeHaptics.lightTap();
    onPress?.();
  };

  const handleToggle = (val: boolean) => {
    if (disabled) return;
    safeHaptics.toggleSwitch();
    onToggle?.(val);
  };

  const renderRight = () => {
    switch (type) {
      case 'toggle':
        return (
          <Switch
            value={toggleValue}
            onValueChange={handleToggle}
            disabled={disabled}
            trackColor={{ false: COLORS.divider, true: COLORS.success }}
            thumbColor={Platform.OS === 'android' ? COLORS.textPrimary : undefined}
            ios_backgroundColor={COLORS.divider}
          />
        );
      case 'value':
        return (
          <View style={styles.valueContainer}>
            <Text style={styles.value}>{value}</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </View>
        );
      case 'navigation':
        return (
          <View style={styles.valueContainer}>
            {value && <Text style={styles.value}>{value}</Text>}
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </View>
        );
      case 'button':
        return null;
      default:
        return null;
    }
  };

  const content = (
    <View style={[styles.container, disabled && styles.disabled]}>
      {icon && (
        <View
          style={[
            styles.iconContainer,
            iconBackground && { backgroundColor: iconBackground },
          ]}
        >
          <Ionicons name={icon as any} size={20} color={iconColor} />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            destructive && styles.destructiveTitle,
            !icon && styles.titleNoIcon,
          ]}
        >
          {title}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {renderRight()}
    </View>
  );

  if (type === 'toggle') {
    return content;
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={subtitle}
      >
        {content}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  titleNoIcon: {
    marginLeft: 0,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  destructiveTitle: {
    color: COLORS.error,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  disabled: {
    opacity: 0.5,
  },
});
