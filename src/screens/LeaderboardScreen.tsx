import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Share,
} from 'react-native';
import { ScrollView } from '../utils/scrollComponents';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import {
  LeaderboardData,
  LeaderboardEntry,
  Friend,
  Challenge,
  UserProfile,
  getLeaderboardData,
  getFriends,
  getChallenges,
  getUserProfile,
  getFriendCode,
  addFriend,
  removeFriend,
  updateDisplayName,
  updateAvatar,
  AVATAR_EMOJIS,
} from '../services/leaderboard';
import { useApp } from '../context/AppContext';

type TabType = 'leaderboard' | 'friends' | 'challenges' | 'profile';
type LeaderboardCategory = 'daily' | 'weekly' | 'allTime' | 'speed' | 'survival';

export default function LeaderboardScreen() {
  const navigation = useNavigation<any>();
  const { stats } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('leaderboard');
  const [leaderboardCategory, setLeaderboardCategory] = useState<LeaderboardCategory>('daily');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friendCode, setFriendCode] = useState('');
  const [addFriendCode, setAddFriendCode] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const loadData = useCallback(async () => {
    const [lb, fr, ch, pr, fc] = await Promise.all([
      getLeaderboardData(),
      getFriends(),
      getChallenges(),
      getUserProfile(),
      getFriendCode(),
    ]);
    setLeaderboardData(lb);
    setFriends(fr);
    setChallenges(ch);
    setProfile(pr);
    setFriendCode(fc);
    if (pr) {
      setNewName(pr.displayName);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleAddFriend = async () => {
    if (!addFriendCode.trim()) {
      Alert.alert('Error', 'Please enter a friend code');
      return;
    }

    const result = await addFriend(addFriendCode.trim());
    if (result.success) {
      Alert.alert('Success', 'Friend added!');
      setAddFriendCode('');
      loadData();
    } else {
      Alert.alert('Error', result.error || 'Failed to add friend');
    }
  };

  const handleRemoveFriend = (friend: Friend) => {
    Alert.alert(
      'Remove Friend',
      `Remove ${friend.displayName} from friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeFriend(friend.userId);
            loadData();
          },
        },
      ]
    );
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Add me on Key Perfect! My friend code is: ${friendCode}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSaveName = async () => {
    if (newName.trim()) {
      await updateDisplayName(newName);
      setEditingName(false);
      loadData();
    }
  };

  const handleSelectAvatar = async (emoji: string) => {
    await updateAvatar(emoji);
    setShowAvatarPicker(false);
    loadData();
  };

  const renderLeaderboardTab = () => {
    const categories: { key: LeaderboardCategory; label: string }[] = [
      { key: 'daily', label: 'Daily' },
      { key: 'weekly', label: 'Weekly' },
      { key: 'allTime', label: 'All Time' },
      { key: 'speed', label: 'Speed' },
      { key: 'survival', label: 'Survival' },
    ];

    const entries = leaderboardData?.[leaderboardCategory] || [];

    return (
      <>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryButton,
                leaderboardCategory === cat.key && styles.categoryButtonActive,
              ]}
              onPress={() => setLeaderboardCategory(cat.key)}
              accessibilityLabel={`${cat.label} leaderboard`}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  leaderboardCategory === cat.key && styles.categoryButtonTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <GlassCard style={styles.leaderboardCard}>
          {entries.length === 0 ? (
            <Text style={styles.emptyText}>No scores yet. Be the first!</Text>
          ) : (
            entries.slice(0, 10).map((entry, index) => (
              <View
                key={entry.userId}
                style={[
                  styles.leaderboardEntry,
                  index === 0 && styles.firstPlace,
                  index === 1 && styles.secondPlace,
                  index === 2 && styles.thirdPlace,
                  entry.userId === profile?.id && styles.currentUser,
                ]}
              >
                <View style={styles.rankContainer}>
                  {index < 3 ? (
                    <Text style={styles.medalEmoji}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </Text>
                  ) : (
                    <Text style={styles.rankText}>{entry.rank}</Text>
                  )}
                </View>
                <Text style={styles.avatarEmoji}>{entry.avatarEmoji}</Text>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryName}>
                    {entry.displayName}
                    {entry.userId === profile?.id && ' (You)'}
                  </Text>
                </View>
                <Text style={styles.entryScore}>{entry.score.toLocaleString()}</Text>
              </View>
            ))
          )}
        </GlassCard>
      </>
    );
  };

  const renderFriendsTab = () => (
    <>
      {/* Add Friend */}
      <GlassCard style={styles.addFriendCard}>
        <Text style={styles.cardTitle}>Add Friend</Text>
        <View style={styles.addFriendRow}>
          <TextInput
            style={styles.friendCodeInput}
            placeholder="Enter friend code"
            placeholderTextColor={COLORS.textMuted}
            value={addFriendCode}
            onChangeText={setAddFriendCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddFriend}
            accessibilityLabel="Add friend"
            accessibilityRole="button"
          >
            <Ionicons name="person-add" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Your Code */}
      <GlassCard style={styles.yourCodeCard}>
        <Text style={styles.cardTitle}>Your Friend Code</Text>
        <View style={styles.codeRow}>
          <Text style={styles.friendCodeDisplay}>{friendCode}</Text>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareCode}
            accessibilityLabel="Share friend code"
            accessibilityRole="button"
          >
            <Ionicons name="share-outline" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Friends List */}
      <GlassCard style={styles.friendsListCard}>
        <Text style={styles.cardTitle}>Friends ({friends.length})</Text>
        {friends.length === 0 ? (
          <Text style={styles.emptyText}>No friends yet. Share your code!</Text>
        ) : (
          friends.map((friend) => (
            <View key={friend.userId} style={styles.friendRow}>
              <Text style={styles.avatarEmoji}>{friend.avatarEmoji}</Text>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{friend.displayName}</Text>
                <Text style={styles.friendStats}>
                  {friend.totalXP.toLocaleString()} XP • {friend.currentStreak}🔥
                </Text>
              </View>
              <TouchableOpacity
                style={styles.challengeButton}
                onPress={() => Alert.alert('Coming Soon', 'Challenge feature coming soon!')}
                accessibilityLabel={`Challenge ${friend.displayName}`}
                accessibilityRole="button"
              >
                <Ionicons name="flash" size={16} color={COLORS.warning} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveFriend(friend)}
                accessibilityLabel={`Remove ${friend.displayName}`}
                accessibilityRole="button"
              >
                <Ionicons name="close" size={16} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </GlassCard>
    </>
  );

  const renderChallengesTab = () => {
    const pending = challenges.filter(c => c.status === 'pending');
    const active = challenges.filter(c => c.status === 'accepted');
    const completed = challenges.filter(c => c.status === 'completed').slice(0, 5);

    return (
      <>
        {/* Pending Challenges */}
        <GlassCard style={styles.challengeSection}>
          <Text style={styles.cardTitle}>Pending Challenges ({pending.length})</Text>
          {pending.length === 0 ? (
            <Text style={styles.emptyText}>No pending challenges</Text>
          ) : (
            pending.map((challenge) => (
              <View key={challenge.id} style={styles.challengeCard}>
                <View style={styles.challengeHeader}>
                  <Text style={styles.avatarEmoji}>{challenge.challenger.avatarEmoji}</Text>
                  <View style={styles.challengeInfo}>
                    <Text style={styles.challengeName}>
                      {challenge.challenger.displayName}
                    </Text>
                    <Text style={styles.challengeType}>
                      {challenge.type.toUpperCase()} Challenge
                    </Text>
                  </View>
                  <Text style={styles.challengeScore}>{challenge.challenger.score}</Text>
                </View>
                <View style={styles.challengeActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => navigation.navigate('GameMode', { mode: challenge.type })}
                  >
                    <Text style={styles.actionButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.declineButton]}
                    onPress={() => Alert.alert('Declined', 'Challenge declined')}
                  >
                    <Text style={styles.actionButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </GlassCard>

        {/* Recent Results */}
        <GlassCard style={styles.challengeSection}>
          <Text style={styles.cardTitle}>Recent Results</Text>
          {completed.length === 0 ? (
            <Text style={styles.emptyText}>No completed challenges yet</Text>
          ) : (
            completed.map((challenge) => (
              <View key={challenge.id} style={styles.resultCard}>
                <View style={styles.resultPlayers}>
                  <Text style={styles.avatarEmoji}>{challenge.challenger.avatarEmoji}</Text>
                  <Text style={styles.vsText}>VS</Text>
                  <Text style={styles.avatarEmoji}>{challenge.challenged.avatarEmoji}</Text>
                </View>
                <View style={styles.resultScores}>
                  <Text style={styles.resultScore}>{challenge.challenger.score}</Text>
                  <Text style={styles.resultDash}>-</Text>
                  <Text style={styles.resultScore}>{challenge.challenged.score}</Text>
                </View>
                <Text style={[
                  styles.resultOutcome,
                  challenge.winner === profile?.id ? styles.winText : styles.loseText,
                ]}>
                  {challenge.winner === profile?.id ? 'Won!' : 'Lost'}
                </Text>
              </View>
            ))
          )}
        </GlassCard>
      </>
    );
  };

  const renderProfileTab = () => (
    <>
      <GlassCard style={styles.profileCard}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => setShowAvatarPicker(true)}
          accessibilityLabel="Change avatar"
          accessibilityRole="button"
        >
          <Text style={styles.profileAvatar}>{profile?.avatarEmoji}</Text>
          <View style={styles.editBadge}>
            <Ionicons name="pencil" size={12} color={COLORS.textPrimary} />
          </View>
        </TouchableOpacity>

        {editingName ? (
          <View style={styles.editNameContainer}>
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              maxLength={20}
              autoFocus
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveName}>
              <Ionicons name="checkmark" size={20} color={COLORS.success} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setEditingName(false);
                setNewName(profile?.displayName || '');
              }}
            >
              <Ionicons name="close" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.nameContainer}
            onPress={() => setEditingName(true)}
            accessibilityLabel="Edit display name"
            accessibilityRole="button"
          >
            <Text style={styles.profileName}>{profile?.displayName}</Text>
            <Ionicons name="pencil" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}

        <Text style={styles.friendCodeLabel}>Friend Code: {friendCode}</Text>
      </GlassCard>

      <GlassCard style={styles.statsCard}>
        <Text style={styles.cardTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalXP.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.longestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.levelsCompleted}</Text>
            <Text style={styles.statLabel}>Levels Done</Text>
          </View>
        </View>
      </GlassCard>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <View style={styles.avatarPickerOverlay}>
          <GlassCard style={styles.avatarPicker}>
            <Text style={styles.cardTitle}>Choose Avatar</Text>
            <View style={styles.avatarGrid}>
              {AVATAR_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.avatarOption,
                    profile?.avatarEmoji === emoji && styles.avatarOptionSelected,
                  ]}
                  onPress={() => handleSelectAvatar(emoji)}
                >
                  <Text style={styles.avatarOptionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.closePickerButton}
              onPress={() => setShowAvatarPicker(false)}
            >
              <Text style={styles.closePickerText}>Cancel</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      )}
    </>
  );

  const tabs: { key: TabType; icon: string; label: string }[] = [
    { key: 'leaderboard', icon: 'trophy', label: 'Rankings' },
    { key: 'friends', icon: 'people', label: 'Friends' },
    { key: 'challenges', icon: 'flash', label: 'Challenges' },
    { key: 'profile', icon: 'person', label: 'Profile' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        bounces={true}
        overScrollMode="always"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.textPrimary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Social</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab.key }}
            >
              <Ionicons
                name={(activeTab === tab.key ? tab.icon : `${tab.icon}-outline`) as any}
                size={20}
                color={activeTab === tab.key ? COLORS.textPrimary : COLORS.textMuted}
              />
              <Text
                style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'leaderboard' && renderLeaderboardTab()}
        {activeTab === 'friends' && renderFriendsTab()}
        {activeTab === 'challenges' && renderChallengesTab()}
        {activeTab === 'profile' && renderProfileTab()}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
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
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
    marginBottom: SPACING.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: COLORS.cardBackground,
  },
  tabLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: COLORS.textPrimary,
  },
  categoryScroll: {
    marginBottom: SPACING.md,
  },
  categoryButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.xpGradientStart,
  },
  categoryButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: COLORS.textPrimary,
  },
  leaderboardCard: {
    marginBottom: SPACING.md,
  },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  firstPlace: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
  },
  secondPlace: {
    backgroundColor: 'rgba(192, 192, 192, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
  },
  thirdPlace: {
    backgroundColor: 'rgba(205, 127, 50, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
  },
  currentUser: {
    backgroundColor: COLORS.xpGradientStart + '20',
    borderRadius: BORDER_RADIUS.md,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
  },
  medalEmoji: {
    fontSize: 20,
  },
  rankText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  avatarEmoji: {
    fontSize: 24,
    marginHorizontal: SPACING.sm,
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  entryScore: {
    color: COLORS.xpGradientStart,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  addFriendCard: {
    marginBottom: SPACING.md,
  },
  addFriendRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  friendCodeInput: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: COLORS.xpGradientStart,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yourCodeCard: {
    marginBottom: SPACING.md,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  friendCodeDisplay: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  shareButton: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.full,
    padding: SPACING.sm,
  },
  friendsListCard: {
    marginBottom: SPACING.md,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  friendInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  friendName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  friendStats: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  challengeButton: {
    backgroundColor: COLORS.warning + '20',
    borderRadius: BORDER_RADIUS.full,
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  removeButton: {
    backgroundColor: COLORS.error + '20',
    borderRadius: BORDER_RADIUS.full,
    padding: SPACING.xs,
  },
  challengeSection: {
    marginBottom: SPACING.md,
  },
  challengeCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  challengeInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  challengeName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  challengeType: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  challengeScore: {
    color: COLORS.xpGradientStart,
    fontSize: 18,
    fontWeight: 'bold',
  },
  challengeActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: COLORS.success + '30',
  },
  declineButton: {
    backgroundColor: COLORS.error + '30',
  },
  actionButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  resultPlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  vsText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  resultScores: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  resultScore: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultDash: {
    color: COLORS.textMuted,
  },
  resultOutcome: {
    fontSize: 14,
    fontWeight: '600',
  },
  winText: {
    color: COLORS.success,
  },
  loseText: {
    color: COLORS.error,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  profileAvatar: {
    fontSize: 64,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    backgroundColor: COLORS.xpGradientStart,
    borderRadius: BORDER_RADIUS.full,
    padding: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  profileName: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  nameInput: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    minWidth: 150,
  },
  saveButton: {
    backgroundColor: COLORS.success + '30',
    borderRadius: BORDER_RADIUS.full,
    padding: SPACING.xs,
  },
  cancelButton: {
    backgroundColor: COLORS.error + '30',
    borderRadius: BORDER_RADIUS.full,
    padding: SPACING.xs,
  },
  friendCodeLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: SPACING.sm,
  },
  statsCard: {
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.xpGradientStart,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  avatarPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  avatarPicker: {
    width: '90%',
    maxHeight: '80%',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  avatarOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOptionSelected: {
    backgroundColor: COLORS.xpGradientStart,
  },
  avatarOptionEmoji: {
    fontSize: 24,
  },
  closePickerButton: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  closePickerText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});
