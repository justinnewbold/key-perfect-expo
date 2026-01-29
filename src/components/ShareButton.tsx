import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useToast } from './ToastNotification';

interface ShareButtonProps {
  title: string;
  message: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
}

export default function ShareButton({
  title,
  message,
  size = 'md',
  variant = 'ghost'
}: ShareButtonProps) {
  const toast = useToast();

  const iconSizes = {
    sm: 20,
    md: 24,
    lg: 28,
  };

  const containerSizes = {
    sm: 36,
    md: 48,
    lg: 56,
  };

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        toast.error('Sharing is not available on this device');
        return;
      }

      // Create a shareable text file
      const fileName = `key-perfect-${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.txt`;
      const fileUri = `${require('expo-file-system').FileSystem.cacheDirectory}${fileName}`;

      // Write the message to a file
      await require('expo-file-system').FileSystem.writeAsStringAsync(fileUri, message);

      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: title,
        UTI: 'public.plain-text',
      });

      toast.success('Share dialog opened!');
    } catch (error: any) {
      // User cancelled share - this is normal behavior, don't show error
      if (error?.message?.includes('cancelled') || error?.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [
      styles.button,
      {
        width: containerSizes[size],
        height: containerSizes[size],
        borderRadius: containerSizes[size] / 2,
      }
    ];

    if (variant === 'primary') {
      return [...baseStyle, styles.buttonPrimary];
    } else if (variant === 'secondary') {
      return [...baseStyle, styles.buttonSecondary];
    }

    return [...baseStyle, styles.buttonGhost];
  };

  const getIconColor = () => {
    if (variant === 'primary' || variant === 'secondary') {
      return COLORS.textPrimary;
    }
    return COLORS.textSecondary;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handleShare}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons
        name={Platform.OS === 'ios' ? 'share-outline' : 'share-social-outline'}
        size={iconSizes[size]}
        color={getIconColor()}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: COLORS.gradientStart,
    ...SHADOWS.small,
  },
  buttonSecondary: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.divider,
    ...SHADOWS.small,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
});
