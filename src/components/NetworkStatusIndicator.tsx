import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';
import { NetworkStatus } from '../hooks/useNetworkStatus';

interface NetworkStatusIndicatorProps {
  status: NetworkStatus;
  compact?: boolean;
}

export default function NetworkStatusIndicator({
  status,
  compact = true,
}: NetworkStatusIndicatorProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Show/hide animation when offline
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: status.isConnected ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [status.isConnected, fadeAnim]);

  // Pulse animation when syncing
  useEffect(() => {
    if (status.isSyncing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status.isSyncing, pulseAnim]);

  // Compact mode: just show a small indicator
  if (compact) {
    // Only show when there's something to indicate
    if (status.isConnected && status.pendingSyncCount === 0 && !status.isSyncing) {
      return null;
    }

    return (
      <View
        style={styles.compactContainer}
        accessibilityRole="text"
        accessibilityLabel={
          !status.isConnected
            ? 'Offline mode. Changes will sync when connected.'
            : status.isSyncing
            ? 'Syncing data...'
            : `${status.pendingSyncCount} items pending sync`
        }
      >
        {!status.isConnected ? (
          <View style={[styles.dot, styles.dotOffline]} />
        ) : status.isSyncing ? (
          <Animated.View style={[styles.dot, styles.dotSyncing, { opacity: pulseAnim }]} />
        ) : status.pendingSyncCount > 0 ? (
          <View style={[styles.dot, styles.dotPending]}>
            <Text style={styles.pendingCount}>{status.pendingSyncCount}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  // Full banner mode for offline
  return (
    <Animated.View
      style={[
        styles.banner,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            },
          ],
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel="You are offline. Changes will be saved locally and synced when connected."
    >
      <Ionicons name="cloud-offline-outline" size={20} color={COLORS.textPrimary} />
      <Text style={styles.bannerText}>
        Offline Mode
        {status.pendingSyncCount > 0 && ` (${status.pendingSyncCount} pending)`}
      </Text>
      {status.isSyncing && (
        <Animated.View style={{ opacity: pulseAnim }}>
          <Ionicons name="sync" size={16} color={COLORS.textPrimary} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 100,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotOffline: {
    backgroundColor: COLORS.error,
  },
  dotSyncing: {
    backgroundColor: COLORS.info,
  },
  dotPending: {
    backgroundColor: COLORS.warning,
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  pendingCount: {
    color: COLORS.textDark,
    fontSize: 10,
    fontWeight: 'bold',
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    zIndex: 1000,
  },
  bannerText: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '600',
  },
});
