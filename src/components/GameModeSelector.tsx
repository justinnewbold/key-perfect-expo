import React, { forwardRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import BottomSheetComponent from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { GAME_MODES } from '../types';
import BottomSheet from './BottomSheet';

interface GameModeSelectorProps {
  onSelectMode: (modeId: string) => void;
}

const GameModeSelector = forwardRef<BottomSheetComponent, GameModeSelectorProps>(
  ({ onSelectMode }, ref) => {
    const handleSelectMode = useCallback((modeId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelectMode(modeId);
      // Close the sheet
      (ref as any)?.current?.close();
    }, [onSelectMode, ref]);

    return (
      <BottomSheet
        ref={ref}
        title="Quick Play"
        snapPoints={['60%', '90%']}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.subtitle}>Choose a game mode to play</Text>

          <View style={styles.modesGrid}>
            {GAME_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={[styles.modeCard, { backgroundColor: mode.color + '20' }]}
                onPress={() => handleSelectMode(mode.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.modeIconContainer, { backgroundColor: mode.color }]}>
                  <Text style={styles.modeIcon}>{mode.icon}</Text>
                </View>
                <Text style={styles.modeName}>{mode.name}</Text>
                <Text style={styles.modeDescription} numberOfLines={2}>
                  {mode.description}
                </Text>
                <View style={styles.modeFooter}>
                  <View style={styles.modeTag}>
                    <Ionicons name="time-outline" size={12} color={mode.color} />
                    <Text style={[styles.modeTagText, { color: mode.color }]}>
                      {mode.id === 'speed' ? '30s' : mode.id === 'daily' ? 'Daily' : 'Endless'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Campaign Shortcut */}
          <TouchableOpacity
            style={styles.campaignButton}
            onPress={() => handleSelectMode('campaign')}
          >
            <View style={styles.campaignIconContainer}>
              <Ionicons name="trophy" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.campaignText}>
              <Text style={styles.campaignTitle}>Campaign Mode</Text>
              <Text style={styles.campaignSubtitle}>Progress through 8 levels</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </ScrollView>
      </BottomSheet>
    );
  }
);

GameModeSelector.displayName = 'GameModeSelector';

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  modesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  modeCard: {
    width: '47%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modeIcon: {
    fontSize: 24,
  },
  modeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    minHeight: 32,
  },
  modeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
  },
  modeTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  campaignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  campaignIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  campaignText: {
    flex: 1,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  campaignSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default GameModeSelector;
