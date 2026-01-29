import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import {
  getProgression,
  updateCustomization,
  claimQuestReward,
  getProgressionStats,
  getAchievementsByTier,
  ProgressionData,
  Achievement,
  Quest,
  Title,
  AchievementTier,
} from '../services/progression';
import { useUserStats } from '../hooks/useUserStats';
import AnimatedCounter, { AnimatedPercentageCounter } from '../components/AnimatedCounter';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { stats } = useUserStats();
  const userId = stats?.id || 'current_user';
  const [progression, setProgression] = useState<ProgressionData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'achievements' | 'quests' | 'titles'>('achievements');
  const [selectedTier, setSelectedTier] = useState<AchievementTier | 'all'>('all');
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);

  useEffect(() => {
    loadProgression();
  }, []);

  const loadProgression = async () => {
    setRefreshing(true);
    try {
      const data = await getProgression(userId);
      setProgression(data);
    } catch (error) {
      console.error('Error loading progression:', error);
    }
    setRefreshing(false);
  };

  const handleClaimQuest = async (questId: string) => {
    const success = await claimQuestReward(userId, questId);
    if (success) {
      loadProgression();
    }
  };

  const handleSelectAvatar = async (avatar: string) => {
    await updateCustomization(userId, { avatar });
    loadProgression();
    setShowCustomizationModal(false);
  };

  if (!progression) {
    return (
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  const progressStats = getProgressionStats(progression);
  const levelProgress = (progression.level.currentXP / progression.level.xpToNextLevel) * 100;

  const filteredAchievements = selectedTier === 'all'
    ? progression.achievements
    : getAchievementsByTier(progression, selectedTier);

  const activeQuests = progression.quests.filter(q => q.status === 'active' || q.status === 'completed');

  return (
    <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadProgression} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity onPress={() => setShowCustomizationModal(true)} style={styles.settingsButton}>
            <Ionicons name="settings" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => setShowCustomizationModal(true)}
            >
              <Text style={styles.avatar}>{progression.customization.avatar}</Text>
              <View style={styles.editIconContainer}>
                <Ionicons name="create" size={16} color={COLORS.textPrimary} />
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.username}>Player {userId.slice(0, 8)}</Text>
              {progression.customization.title && (
                <Text style={styles.playerTitle}>{progression.customization.title}</Text>
              )}
              <View style={styles.levelContainer}>
                <Text style={styles.levelText}>Level {progression.level.level}</Text>
                {progression.level.prestige > 0 && (
                  <View style={styles.prestigeBadge}>
                    <Ionicons name="star" size={12} color={COLORS.warning} />
                    <Text style={styles.prestigeText}>{progression.level.prestige}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* XP Progress */}
          <View style={styles.xpContainer}>
            <View style={styles.xpHeader}>
              <Text style={styles.xpLabel}>
                <AnimatedCounter value={progression.level.currentXP} decimals={0} style={{ color: COLORS.textSecondary, fontSize: 14 }} /> / {progression.level.xpToNextLevel} XP
              </Text>
              <AnimatedPercentageCounter value={Math.round(levelProgress)} style={styles.xpPercentage} />
            </View>
            <View style={styles.xpBarContainer}>
              <View style={[styles.xpBar, { width: `${levelProgress}%` }]} />
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <AnimatedCounter value={progression.level.totalXP} decimals={0} style={styles.statValue} />
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statBox}>
              <AnimatedCounter value={progressStats.unlockedAchievements} decimals={0} style={styles.statValue} />
              <Text style={styles.statLabel}>Achievements</Text>
            </View>
            <View style={styles.statBox}>
              <AnimatedCounter value={progressStats.unlockedTitles} decimals={0} style={styles.statValue} />
              <Text style={styles.statLabel}>Titles</Text>
            </View>
            <View style={styles.statBox}>
              <AnimatedCounter value={progressStats.completedQuests} decimals={0} style={styles.statValue} />
              <Text style={styles.statLabel}>Quests Done</Text>
            </View>
          </View>
        </GlassCard>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'achievements' && styles.tabActive]}
            onPress={() => setSelectedTab('achievements')}
          >
            <Ionicons name="trophy" size={20} color={selectedTab === 'achievements' ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.tabText, selectedTab === 'achievements' && styles.tabTextActive]}>
              Achievements
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'quests' && styles.tabActive]}
            onPress={() => setSelectedTab('quests')}
          >
            <Ionicons name="list" size={20} color={selectedTab === 'quests' ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.tabText, selectedTab === 'quests' && styles.tabTextActive]}>
              Quests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'titles' && styles.tabActive]}
            onPress={() => setSelectedTab('titles')}
          >
            <Ionicons name="ribbon" size={20} color={selectedTab === 'titles' ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.tabText, selectedTab === 'titles' && styles.tabTextActive]}>
              Titles
            </Text>
          </TouchableOpacity>
        </View>

        {/* Achievements Tab */}
        {selectedTab === 'achievements' && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tierFilter}>
              {(['all', 'beginner', 'skill', 'streak', 'social', 'secret'] as const).map(tier => (
                <TouchableOpacity
                  key={tier}
                  style={[styles.tierChip, selectedTier === tier && styles.tierChipActive]}
                  onPress={() => setSelectedTier(tier)}
                >
                  <Text style={[styles.tierChipText, selectedTier === tier && styles.tierChipTextActive]}>
                    {tier.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.achievementsList}>
              {filteredAchievements.map(achievement => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </View>
          </>
        )}

        {/* Quests Tab */}
        {selectedTab === 'quests' && (
          <View style={styles.questsList}>
            {activeQuests.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-circle-outline" size={64} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No active quests</Text>
              </View>
            ) : (
              activeQuests.map(quest => (
                <QuestCard key={quest.id} quest={quest} onClaim={() => handleClaimQuest(quest.id)} />
              ))
            )}
          </View>
        )}

        {/* Titles Tab */}
        {selectedTab === 'titles' && (
          <View style={styles.titlesList}>
            {progression.titles.map(title => (
              <TitleCard key={title.id} title={title} isEquipped={progression.customization.title === title.name} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Customization Modal */}
      <Modal visible={showCustomizationModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customize Profile</Text>
              <TouchableOpacity onPress={() => setShowCustomizationModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Select Avatar</Text>
            <View style={styles.avatarGrid}>
              {['👤', '🎵', '🎹', '🎸', '🎤', '🥁', '🎺', '🎻', '🎷', '🎼', '🎧', '🎚️'].map(avatar => (
                <TouchableOpacity
                  key={avatar}
                  style={[
                    styles.avatarOption,
                    progression.customization.avatar === avatar && styles.avatarOptionActive,
                  ]}
                  onPress={() => handleSelectAvatar(avatar)}
                >
                  <Text style={styles.avatarOptionText}>{avatar}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
        </View>
      </Modal>
    </LinearGradient>
  );
}

interface AchievementCardProps {
  achievement: Achievement;
}

function AchievementCard({ achievement }: AchievementCardProps) {
  const getRarityColor = (rarity: string): string => {
    const colors: Record<string, string> = {
      common: COLORS.textSecondary,
      rare: COLORS.info,
      epic: COLORS.primary,
      legendary: COLORS.warning,
      mythic: '#9333ea',
    };
    return colors[rarity] || COLORS.textSecondary;
  };

  const progress = achievement.isUnlocked ? 100 : (achievement.current / achievement.requirement) * 100;

  return (
    <GlassCard style={[styles.achievementCard, achievement.isUnlocked && styles.achievementCardUnlocked]}>
      <View style={styles.achievementHeader}>
        <Text style={[styles.achievementIcon, !achievement.isUnlocked && styles.achievementIconLocked]}>
          {achievement.icon}
        </Text>
        <View style={styles.achievementInfo}>
          <Text style={[styles.achievementName, !achievement.isUnlocked && styles.achievementNameLocked]}>
            {achievement.name}
          </Text>
          <Text style={styles.achievementDescription}>{achievement.description}</Text>
          {!achievement.isUnlocked && (
            <View style={styles.achievementProgress}>
              <View style={styles.achievementProgressBar}>
                <View style={[styles.achievementProgressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.achievementProgressText}>
                {achievement.current} / {achievement.requirement}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.achievementFooter}>
        <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(achievement.rarity) + '30' }]}>
          <Text style={[styles.rarityText, { color: getRarityColor(achievement.rarity) }]}>
            {achievement.rarity.toUpperCase()}
          </Text>
        </View>
        <View style={styles.achievementRewards}>
          <Text style={styles.rewardText}>+{achievement.xpReward} XP</Text>
          <Text style={styles.rewardText}>💰 {achievement.coinReward}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

interface QuestCardProps {
  quest: Quest;
  onClaim: () => void;
}

function QuestCard({ quest, onClaim }: QuestCardProps) {
  const progress = (quest.progress / quest.requirement) * 100;
  const isCompleted = quest.status === 'completed';

  return (
    <GlassCard style={styles.questCard}>
      <View style={styles.questHeader}>
        <View style={styles.questInfo}>
          <Text style={styles.questName}>{quest.name}</Text>
          <Text style={styles.questDescription}>{quest.description}</Text>
        </View>
        {isCompleted && (
          <TouchableOpacity style={styles.claimButton} onPress={onClaim}>
            <Text style={styles.claimButtonText}>Claim</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.questProgress}>
        <View style={styles.questProgressBar}>
          <View style={[styles.questProgressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.questProgressText}>
          {quest.progress} / {quest.requirement}
        </Text>
      </View>
      <View style={styles.questFooter}>
        <View style={styles.questRewards}>
          <Text style={styles.questRewardText}>+{quest.xpReward} XP</Text>
          <Text style={styles.questRewardText}>💰 {quest.coinReward}</Text>
        </View>
        <Text style={styles.questExpiry}>Expires: {new Date(quest.expiresAt).toLocaleDateString()}</Text>
      </View>
    </GlassCard>
  );
}

interface TitleCardProps {
  title: Title;
  isEquipped: boolean;
}

function TitleCard({ title, isEquipped }: TitleCardProps) {
  return (
    <GlassCard style={[styles.titleCard, isEquipped && styles.titleCardEquipped]}>
      <Text style={[styles.titleIcon, !title.isUnlocked && styles.titleIconLocked]}>{title.icon}</Text>
      <View style={styles.titleInfo}>
        <Text style={[styles.titleName, !title.isUnlocked && styles.titleNameLocked]}>
          {title.name}
        </Text>
        <Text style={styles.titleDescription}>{title.description}</Text>
      </View>
      {isEquipped && (
        <View style={styles.equippedBadge}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  backButton: {
    padding: SPACING.xs,
  },
  settingsButton: {
    padding: SPACING.xs,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    fontSize: 64,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playerTitle: {
    color: COLORS.warning,
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  levelText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  prestigeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.warning + '30',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  prestigeText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: 'bold',
  },
  xpContainer: {
    marginBottom: SPACING.md,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  xpLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  xpPercentage: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  xpBarContainer: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface + '60',
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  tabActive: {
    backgroundColor: COLORS.primary + '40',
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.textPrimary,
  },
  tierFilter: {
    marginBottom: SPACING.md,
  },
  tierChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.surface + '60',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tierChipActive: {
    backgroundColor: COLORS.primary + '40',
    borderColor: COLORS.primary,
  },
  tierChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  tierChipTextActive: {
    color: COLORS.textPrimary,
  },
  achievementsList: {
    gap: SPACING.sm,
  },
  achievementCard: {
    padding: SPACING.md,
    opacity: 0.6,
  },
  achievementCardUnlocked: {
    opacity: 1,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  achievementHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  achievementIcon: {
    fontSize: 40,
    marginRight: SPACING.md,
  },
  achievementIconLocked: {
    opacity: 0.3,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementNameLocked: {
    color: COLORS.textSecondary,
  },
  achievementDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  achievementProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  achievementProgressText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rarityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  achievementRewards: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  rewardText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  questsList: {
    gap: SPACING.sm,
  },
  questCard: {
    padding: SPACING.md,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  questInfo: {
    flex: 1,
  },
  questName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  questDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  claimButton: {
    backgroundColor: COLORS.success + '40',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  claimButtonText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  questProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  questProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  questProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  questProgressText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  questFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questRewards: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  questRewardText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  questExpiry: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  titlesList: {
    gap: SPACING.sm,
  },
  titleCard: {
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.6,
  },
  titleCardEquipped: {
    opacity: 1,
    borderWidth: 2,
    borderColor: COLORS.success + '80',
  },
  titleIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  titleIconLocked: {
    opacity: 0.3,
  },
  titleInfo: {
    flex: 1,
  },
  titleName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  titleNameLocked: {
    color: COLORS.textSecondary,
  },
  titleDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  equippedBadge: {
    marginLeft: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    marginTop: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.md,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  avatarOption: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.surface + '60',
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  avatarOptionText: {
    fontSize: 32,
  },
});
