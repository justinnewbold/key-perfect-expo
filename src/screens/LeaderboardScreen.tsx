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
import { ScrollView } from 'react-native-gesture-handler';
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
  Tournament,
  TournamentHistory,
  getLeaderboardData,
  getFriends,
  getChallenges,
  getUserProfile,
  getFriendCode,
  addFriend,
  removeFriend,
  updateDisplayName,
  updateAvatar,
  getCurrentTournament,
  getTournamentHistory,
  getTimeUntilTournamentEnd,
  getUserPrize,
  AVATAR_EMOJIS,
} from '../services/leaderboard';
import { useApp } from '../context/AppContext';

type TabType = 'leaderboard' | 'tournament' | 'friends' | 'challenges' | 'profile';
type LeaderboardCategory = 'daily' | 'weekly' | 'allTime' | 'speed' | 'survival';

export default function LeaderboardScreen() {
  const navigation = useNavigation<any>();
  const { stats } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('leaderboard');
  const [leaderboardCategory, setLeaderboardCategory] = useState<LeaderboardCategory>('daily');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [tournamentHistory, setTournamentHistory] = useState<TournamentHistory | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isEnding: false });
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
    const [lb, tr, th, fr, ch, pr, fc] = await Promise.all([
      getLeaderboardData(),
      getCurrentTournament(),
      getTournamentHistory(),
      getFriends(),
      getChallenges(),
      getUserProfile(),
      getFriendCode(),
    ]);
    setLeaderboardData(lb);
    setTournament(tr);
    setTournamentHistory(th);
    setFriends(fr);
    setChallenges(ch);
    setProfile(pr);
    setFriendCode(fc);
    if (pr) {
      setNewName(pr.displayName);
    }
    if (tr) {
      setTimeLeft(getTimeUntilTournamentEnd(tr));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update tournament timer every second
  useEffect(() => {
    if (!tournament) return;

    const interval = setInterval(() => {
      const time = getTimeUntilTournamentEnd(tournament);
      setTimeLeft(time);

      // Reload if tournament ended
      if (time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0) {
        loadData();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tournament, loadData]);

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

  const renderTournamentTab = () => {
    if (!tournament || !tournamentHistory) return null;

    const userEntry = tournament.leaderboard.find(e => e.userId === profile?.id);
    const userRank = userEntry?.rank || 0;
    const userScore = userEntry?.weekScore || 0;
    const prize = getUserPrize(userRank);

    return (
      <>
        {/* Timer & Prize Info */}
        <GlassCard style={styles.tournamentHeader}>
          <View style={styles.tournamentTitleRow}>
            <Ionicons name="trophy" size={28} color={COLORS.warning} />
            <View style={styles.tournamentTitleInfo}>
              <Text style={styles.tournamentTitle}>Week {tournament.weekNumber} Tournament</Text>
              <Text style={styles.tournamentSubtitle}>
                {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Countdown Timer */}
          <View style={styles.tournamentTimer}>
            <Text style={styles.timerLabel}>Ends in:</Text>
            <View style={styles.timerDisplay}>
              {timeLeft.days > 0 && (
                <View style={styles.timerUnit}>
                  <Text style={styles.timerNumber}>{timeLeft.days}</Text>
                  <Text style={styles.timerText}>d</Text>
                </View>
              )}
              <View style={styles.timerUnit}>
                <Text style={styles.timerNumber}>{String(timeLeft.hours).padStart(2, '0')}</Text>
                <Text style={styles.timerText}>h</Text>
              </View>
              <View style={styles.timerUnit}>
                <Text style={styles.timerNumber}>{String(timeLeft.minutes).padStart(2, '0')}</Text>
                <Text style={styles.timerText}>m</Text>
              </View>
              <View style={styles.timerUnit}>
                <Text style={styles.timerNumber}>{String(timeLeft.seconds).padStart(2, '0')}</Text>
                <Text style={styles.timerText}>s</Text>
              </View>
            </View>
          </View>

          {/* User's Current Standing */}
          <View style={styles.userStanding}>
            <View style={styles.standingRow}>
              <Text style={styles.standingLabel}>Your Rank:</Text>
              <Text style={[styles.standingValue, userRank <= 10 && styles.standingValuePrize]}>
                #{userRank || 'Not ranked'}
              </Text>
            </View>
            <View style={styles.standingRow}>
              <Text style={styles.standingLabel}>Your Score:</Text>
              <Text style={styles.standingValue}>{userScore.toLocaleString()}</Text>
            </View>
            {prize && (
              <View style={[styles.prizeIndicator, timeLeft.isEnding && styles.prizeIndicatorPulsing]}>
                <Text style={styles.prizeBadge}>{prize.badge}</Text>
                <Text style={styles.prizeText}>
                  {prize.title} - {prize.xpBonus} XP Bonus!
                </Text>
              </View>
            )}
          </View>
        </GlassCard>

        {/* Current Leaderboard */}
        <GlassCard style={styles.leaderboardCard}>
          <Text style={styles.cardTitle}>Tournament Leaderboard</Text>
          {tournament.leaderboard.slice(0, 20).map((entry, index) => {
            const entryPrize = getUserPrize(entry.rank);

            return (
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
                  {entryPrize && (
                    <Text style={styles.entryPrize}>
                      {entryPrize.badge} {entryPrize.title}
                    </Text>
                  )}
                </View>
                <Text style={styles.entryScore}>{entry.weekScore.toLocaleString()}</Text>
              </View>
            );
          })}
        </GlassCard>

        {/* Past Tournaments */}
        {tournamentHistory.tournaments.length > 0 && (
          <GlassCard style={styles.historyCard}>
            <Text style={styles.cardTitle}>Your Tournament History</Text>
            <View style={styles.historyStats}>
              <View style={styles.historyStat}>
                <Text style={styles.historyStatValue}>{tournamentHistory.userBestRank}</Text>
                <Text style={styles.historyStatLabel}>Best Rank</Text>
              </View>
              <View style={styles.historyStat}>
                <Text style={styles.historyStatValue}>{tournamentHistory.userTotalWins}</Text>
                <Text style={styles.historyStatLabel}>Wins</Text>
              </View>
              <View style={styles.historyStat}>
                <Text style={styles.historyStatValue}>{tournamentHistory.userTotalPrizes.length}</Text>
                <Text style={styles.historyStatLabel}>Prizes</Text>
              </View>
            </View>

            <Text style={styles.historyTitle}>Recent Tournaments</Text>
            {tournamentHistory.tournaments.slice(0, 5).map((pastTournament) => {
              const userPastEntry = pastTournament.leaderboard.find(e => e.userId === profile?.id);
              return (
                <View key={pastTournament.id} style={styles.historyEntry}>
                  <Text style={styles.historyWeek}>Week {pastTournament.weekNumber}</Text>
                  {userPastEntry ? (
                    <>
                      <Text style={styles.historyRank}>Rank #{userPastEntry.rank}</Text>
                      <Text style={styles.historyScore}>{userPastEntry.weekScore.toLocaleString()}</Text>
                    </>
                  ) : (
                    <Text style={styles.historyNotParticipated}>Not participated</Text>
                  )}
                </View>
              );
            })}
          </GlassCard>
        )}
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
    { key: 'leaderboard', icon: 'podium', label: 'Rankings' },
    { key: 'tournament', icon: 'trophy', label: 'Tournament' },
    { key: 'friends', icon: 'people', label: 'Friends' },
    { key: 'challenges', icon: 'flash', label: 'Challenges' },
    { key: 'profile', icon: 'person', label: 'Profile' },
  ];

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.container}
    >
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
        {activeTab === 'tournament' && renderTournamentTab()}
        {activeTab === 'friends' && renderFriendsTab()}
        {activeTab === 'challenges' && renderChallengesTab()}
        {activeTab === 'profile' && renderProfileTab()}

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
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
  // Tournament Tab Styles
  tournamentHeader: {
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.warning + '40',
  },
  tournamentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tournamentTitleInfo: {
    flex: 1,
  },
  tournamentTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  tournamentSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  tournamentTimer: {
    marginBottom: SPACING.md,
  },
  timerLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  timerDisplay: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  timerUnit: {
    flex: 1,
    backgroundColor: COLORS.cardBackground + '80',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  timerNumber: {
    color: COLORS.warning,
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerText: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  userStanding: {
    backgroundColor: COLORS.cardBackground + '60',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  standingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  standingLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  standingValue: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  standingValuePrize: {
    color: COLORS.warning,
  },
  prizeIndicator: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  prizeIndicatorPulsing: {
    backgroundColor: COLORS.warning + '20',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  prizeBadge: {
    fontSize: 24,
  },
  prizeText: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  entryPrize: {
    color: COLORS.warning,
    fontSize: 11,
    marginTop: 2,
  },
  historyCard: {
    marginBottom: SPACING.md,
  },
  historyStats: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  historyStat: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  historyStatValue: {
    color: COLORS.warning,
    fontSize: 24,
    fontWeight: 'bold',
  },
  historyStatLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: SPACING.xs,
  },
  historyTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  historyEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  historyWeek: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    width: 80,
  },
  historyRank: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: 'bold',
    width: 70,
  },
  historyScore: {
    color: COLORS.textPrimary,
    fontSize: 14,
    textAlign: 'right',
    flex: 1,
  },
  historyNotParticipated: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
  },
});
