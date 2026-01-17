import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import GlassCard from './GlassCard';
import { useApp } from '../context/AppContext';
import {
  getStreakStats,
  getAvailableMilestones,
  claimMilestoneRewards,
  getPowerUps,
  getActiveMultipliers,
  StreakStats,
  StreakMilestone,
  PowerUp,
  ActiveMultiplier,
} from '../services/streakRewards';

interface StreakDashboardProps {
  style?: any;
}

export default function StreakDashboard({ style }: StreakDashboardProps) {
  const { stats, addXP, updateSettings, settings } = useApp();
  const [streakStats, setStreakStats] = useState<StreakStats | null>(null);
  const [milestones, setMilestones] = useState<StreakMilestone[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [activeMultipliers, setActiveMultipliers] = useState<ActiveMultiplier[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>('streak');

  useEffect(() => {
    loadData();
  }, [stats.currentStreak]);

  const loadData = async () => {
    const [streakData, milestonesData, powerUpsData, multipliersData] = await Promise.all([
      getStreakStats(stats),
      getAvailableMilestones(stats.currentStreak),
      getPowerUps(),
      getActiveMultipliers(),
    ]);

    setStreakStats(streakData);
    setMilestones(milestonesData);
    setPowerUps(powerUpsData);
    setActiveMultipliers(multipliersData);
  };

  const handleClaimReward = useCallback(async (milestone: StreakMilestone) => {
    if (milestone.claimed) return;

    const result = await claimMilestoneRewards(
      milestone.days,
      async (xp) => await addXP(xp),
      (packId) => {
        // Add pack to owned packs
        const currentPacks = settings.ownedInstrumentPacks || ['free'];
        if (!currentPacks.includes(packId)) {
          updateSettings({ ownedInstrumentPacks: [...currentPacks, packId] });
        }
      }
    );

    if (result.success) {
      Alert.alert(
        `${milestone.badge} ${milestone.title} Claimed!`,
        getRewardsSummary(result.rewards),
        [{ text: 'Awesome!', onPress: () => loadData() }]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to claim rewards');
    }
  }, [addXP, updateSettings, settings.ownedInstrumentPacks]);

  const getRewardsSummary = (rewards: any[]): string => {
    const summary: string[] = [];
    rewards.forEach(reward => {
      if (reward.type === 'xp' && reward.amount) {
        summary.push(`+${reward.amount} XP`);
      }
      if (reward.type === 'shield' && reward.amount) {
        summary.push(`${reward.amount}x Streak Shield`);
      }
      if (reward.type === 'multiplier' && reward.amount && reward.duration) {
        summary.push(`${reward.amount}x XP for ${reward.duration} min`);
      }
      if (reward.type === 'pack') {
        summary.push(`Free Instrument Pack!`);
      }
    });
    return summary.join('\n');
  };

  const getTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (!streakStats) return null;

  const unclaimedMilestones = milestones.filter(m => !m.claimed);

  return (
    <GlassCard style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.fireEmoji}>🔥</Text>
          <View style={styles.streakInfo}>
            <Text style={styles.streakNumber}>{streakStats.currentStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
          {streakStats.streakProtected && (
            <View style={styles.protectedBadge}>
              <Text style={styles.protectedIcon}>🛡️</Text>
              <Text style={styles.protectedText}>Protected</Text>
            </View>
          )}
        </View>

        {streakStats.nextMilestone && (
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Next: {streakStats.nextMilestone.title}</Text>
              <Text style={styles.progressDays}>{streakStats.daysUntilNext} days to go</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(streakStats.currentStreak / streakStats.nextMilestone.days) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {/* Active Multipliers */}
      {activeMultipliers.length > 0 && (
        <View style={styles.multipliersContainer}>
          {activeMultipliers.map(mult => (
            <View key={mult.id} style={styles.multiplierCard}>
              <Text style={styles.multiplierIcon}>⚡</Text>
              <View style={styles.multiplierInfo}>
                <Text style={styles.multiplierText}>{mult.multiplier}x XP Active</Text>
                <Text style={styles.multiplierTime}>{getTimeRemaining(mult.expiresAt)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Unclaimed Rewards Banner */}
      {unclaimedMilestones.length > 0 && (
        <TouchableOpacity
          style={styles.unclaimedBanner}
          onPress={() => setExpandedSection(expandedSection === 'milestones' ? null : 'milestones')}
        >
          <View style={styles.unclaimedInfo}>
            <Text style={styles.unclaimedIcon}>🎁</Text>
            <Text style={styles.unclaimedText}>
              {unclaimedMilestones.length} Reward{unclaimedMilestones.length > 1 ? 's' : ''} Available!
            </Text>
          </View>
          <Ionicons
            name={expandedSection === 'milestones' ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.warning}
          />
        </TouchableOpacity>
      )}

      {/* Milestones Section */}
      {expandedSection === 'milestones' && (
        <View style={styles.milestonesContainer}>
          {milestones.map(milestone => (
            <View
              key={milestone.days}
              style={[
                styles.milestoneCard,
                milestone.claimed && styles.milestoneCardClaimed,
              ]}
            >
              <View style={styles.milestoneHeader}>
                <Text style={styles.milestoneBadge}>{milestone.badge}</Text>
                <View style={styles.milestoneInfo}>
                  <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                  <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                </View>
                {milestone.claimed ? (
                  <View style={styles.claimedBadge}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.claimButton}
                    onPress={() => handleClaimReward(milestone)}
                  >
                    <Text style={styles.claimButtonText}>Claim</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Rewards List */}
              <View style={styles.rewardsList}>
                {milestone.rewards.map((reward, idx) => (
                  <View key={idx} style={styles.rewardItem}>
                    {reward.type === 'xp' && (
                      <Text style={styles.rewardText}>⭐ {reward.amount} XP</Text>
                    )}
                    {reward.type === 'shield' && (
                      <Text style={styles.rewardText}>🛡️ {reward.amount}x Streak Shield</Text>
                    )}
                    {reward.type === 'multiplier' && (
                      <Text style={styles.rewardText}>
                        ⚡ {reward.amount}x XP ({reward.duration}min)
                      </Text>
                    )}
                    {reward.type === 'pack' && (
                      <Text style={styles.rewardText}>🎵 Free Instrument Pack</Text>
                    )}
                    {reward.type === 'badge' && (
                      <Text style={styles.rewardText}>🏅 Exclusive Badge</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Power-ups Section */}
      {powerUps.length > 0 && (
        <>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setExpandedSection(expandedSection === 'powerups' ? null : 'powerups')}
          >
            <Text style={styles.sectionTitle}>💫 Power-ups ({powerUps.reduce((sum, p) => sum + p.quantity, 0)})</Text>
            <Ionicons
              name={expandedSection === 'powerups' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          {expandedSection === 'powerups' && (
            <View style={styles.powerUpsContainer}>
              {powerUps.map(powerUp => (
                <View key={powerUp.id} style={styles.powerUpCard}>
                  <Text style={styles.powerUpIcon}>{powerUp.icon}</Text>
                  <View style={styles.powerUpInfo}>
                    <Text style={styles.powerUpName}>{powerUp.name}</Text>
                    <Text style={styles.powerUpDescription}>{powerUp.description}</Text>
                  </View>
                  <View style={styles.powerUpQuantity}>
                    <Text style={styles.powerUpQuantityText}>x{powerUp.quantity}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  fireEmoji: {
    fontSize: 40,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    color: COLORS.warning,
    fontSize: 32,
    fontWeight: 'bold',
  },
  streakLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  protectedIcon: {
    fontSize: 16,
  },
  protectedText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '600',
  },
  progressContainer: {
    backgroundColor: COLORS.cardBackground + '60',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  progressLabel: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressDays: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.warning,
  },
  multipliersContainer: {
    marginBottom: SPACING.md,
  },
  multiplierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warning + '20',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
  },
  multiplierIcon: {
    fontSize: 24,
  },
  multiplierInfo: {
    flex: 1,
  },
  multiplierText: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: 'bold',
  },
  multiplierTime: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  unclaimedBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.warning + '40',
  },
  unclaimedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  unclaimedIcon: {
    fontSize: 24,
  },
  unclaimedText: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: 'bold',
  },
  milestonesContainer: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  milestoneCard: {
    backgroundColor: COLORS.cardBackground + '80',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  milestoneCardClaimed: {
    opacity: 0.6,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  milestoneBadge: {
    fontSize: 32,
    marginRight: SPACING.sm,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  milestoneDescription: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  claimButton: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.medium,
  },
  claimButtonText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  claimedBadge: {
    opacity: 0.7,
  },
  rewardsList: {
    gap: SPACING.xs,
  },
  rewardItem: {
    paddingVertical: 2,
  },
  rewardText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  powerUpsContainer: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  powerUpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground + '60',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  powerUpIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  powerUpInfo: {
    flex: 1,
  },
  powerUpName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  powerUpDescription: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  powerUpQuantity: {
    backgroundColor: COLORS.primary + '40',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  powerUpQuantityText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
