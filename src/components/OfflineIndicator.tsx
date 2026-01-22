import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';
import useNetworkStatus from '../hooks/useNetworkStatus';
import { getOfflineQueue, getLastSyncTime } from '../services/offlineSync';

export default function OfflineIndicator() {
  const { isConnected, pendingSyncCount } = useNetworkStatus();
  const [lastSync, setLastSync] = useState<number | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadLastSync();
  }, []);

  useEffect(() => {
    if (!isConnected) {
      // Fade in when offline
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out when online
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isConnected]);

  const loadLastSync = async () => {
    const time = await getLastSyncTime();
    setLastSync(time);
  };

  const getTimeSinceSync = () => {
    if (!lastSync) return 'Never';

    const now = Date.now();
    const diffMs = now - lastSync;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  if (isConnected && pendingSyncCount === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <Ionicons
          name={isConnected ? 'cloud-upload' : 'cloud-offline'}
          size={16}
          color={isConnected ? COLORS.info : COLORS.warning}
        />
        <View style={styles.textContainer}>
          {!isConnected ? (
            <>
              <Text style={styles.title}>Offline Mode</Text>
              <Text style={styles.subtitle}>Progress saved locally</Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>Syncing...</Text>
              <Text style={styles.subtitle}>
                {pendingSyncCount} item{pendingSyncCount !== 1 ? 's' : ''} pending
              </Text>
            </>
          )}
        </View>
      </View>
      {lastSync && (
        <Text style={styles.lastSync}>Last sync: {getTimeSinceSync()}</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  lastSync: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
});
