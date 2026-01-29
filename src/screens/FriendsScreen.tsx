import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/ToastNotification';
import {
  getFriends,
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  searchUsers,
  sendFriendRequest,
  createHeadToHeadChallenge,
  getHeadToHeadChallenges,
  getSocialCurrency,
  sendGift,
  Friend,
  FriendRequest,
  HeadToHeadChallenge,
  SocialCurrency,
} from '../services/social';

export default function FriendsScreen() {
  const navigation = useNavigation<any>();
  const toast = useToast();
  const userId = 'current_user'; // Mock
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [challenges, setChallenges] = useState<HeadToHeadChallenge[]>([]);
  const [currency, setCurrency] = useState<SocialCurrency | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [friendsData, requestsData, challengesData, currencyData] = await Promise.all([
        getFriends(userId),
        getFriendRequests(userId),
        getHeadToHeadChallenges(userId),
        getSocialCurrency(userId),
      ]);

      setFriends(friendsData);
      setFriendRequests(requestsData);
      setChallenges(challengesData);
      setCurrency(currencyData);
    } catch (error) {
      console.error('Error loading friends data:', error);
    }
    setRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      const results = await searchUsers(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    const success = await acceptFriendRequest(userId, requestId);
    if (success) {
      toast.success('Friend request accepted!');
      loadData();
    } else {
      toast.error('Failed to accept friend request');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    const success = await declineFriendRequest(userId, requestId);
    if (success) {
      toast.info('Friend request declined');
      loadData();
    } else {
      toast.error('Failed to decline friend request');
    }
  };

  const handleSendRequest = async (toUserId: string) => {
    const success = await sendFriendRequest(userId, toUserId);
    if (success) {
      toast.success('Friend request sent!');

      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleChallengeFriend = (friend: Friend) => {
    setSelectedFriend(friend);
    setShowChallengeModal(true);
  };

  const handleCreateChallenge = async (
    mode: HeadToHeadChallenge['mode'],
    difficulty: HeadToHeadChallenge['difficulty']
  ) => {
    if (!selectedFriend) return;

    const challenge = await createHeadToHeadChallenge(
      userId,
      selectedFriend.id,
      mode,
      difficulty,
      5
    );

    if (challenge) {
      setShowChallengeModal(false);
      setSelectedFriend(null);
      loadData();
    }
  };

  const handleSendGift = async (giftType: 'coin_pack' | 'gem_pack' | 'xp_boost' | 'power_up' | 'sticker') => {
    if (!selectedFriend) return;

    const success = await sendGift(userId, selectedFriend.id, giftType);
    if (success) {
      setShowGiftModal(false);
      setSelectedFriend(null);
      loadData();
    }
  };

  const onlineFriends = friends.filter(f => f.onlineStatus === 'online');
  const offlineFriends = friends.filter(f => f.onlineStatus !== 'online');
  const pendingChallenges = challenges.filter(c => c.status === 'pending' && c.toUserId === userId);

  return (
    <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Friends</Text>
          <TouchableOpacity onPress={() => setSearchQuery('?')} style={styles.searchButton}>
            <Ionicons name="search" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Currency Display */}
        {currency && (
          <View style={styles.currencyRow}>
            <View style={styles.currencyItem}>
              <Text style={styles.currencyIcon}>💰</Text>
              <Text style={styles.currencyValue}>{currency.coins}</Text>
            </View>
            <View style={styles.currencyItem}>
              <Text style={styles.currencyIcon}>💎</Text>
              <Text style={styles.currencyValue}>{currency.gems}</Text>
            </View>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {searchResults.map(user => (
              <GlassCard key={user.id} style={styles.friendCard}>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendAvatar}>{user.avatar || '👤'}</Text>
                  <View style={styles.friendDetails}>
                    <Text style={styles.friendName}>{user.displayName}</Text>
                    <Text style={styles.friendUsername}>@{user.username}</Text>
                  </View>
                  <View style={styles.friendStats}>
                    <Text style={styles.friendLevel}>Lv {user.level}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleSendRequest(user.id)}
                >
                  <Ionicons name="person-add" size={20} color={COLORS.primary} />
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </GlassCard>
            ))}
          </View>
        )}

        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Friend Requests ({friendRequests.length})</Text>
            {friendRequests.map(request => (
              <GlassCard key={request.id} style={styles.requestCard}>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendAvatar}>{request.avatar || '👤'}</Text>
                  <View style={styles.friendDetails}>
                    <Text style={styles.friendName}>{request.displayName}</Text>
                    <Text style={styles.friendUsername}>@{request.username}</Text>
                    {request.message && (
                      <Text style={styles.requestMessage}>{request.message}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptRequest(request.id)}
                  >
                    <Ionicons name="checkmark" size={20} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => handleDeclineRequest(request.id)}
                  >
                    <Ionicons name="close" size={20} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {/* Pending Challenges */}
        {pendingChallenges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Challenges ({pendingChallenges.length})</Text>
            {pendingChallenges.map(challenge => (
              <GlassCard key={challenge.id} style={styles.challengeCard}>
                <View style={styles.challengeInfo}>
                  <Ionicons name="game-controller" size={32} color={COLORS.warning} />
                  <View style={styles.challengeDetails}>
                    <Text style={styles.challengeFrom}>From: {challenge.fromUsername}</Text>
                    <Text style={styles.challengeMode}>{challenge.mode} • {challenge.difficulty}</Text>
                    <Text style={styles.challengeRounds}>{challenge.rounds} rounds</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.challengeAcceptButton}
                  onPress={() => navigation.navigate('Challenge', { challengeId: challenge.id })}
                >
                  <Text style={styles.challengeAcceptText}>Accept</Text>
                </TouchableOpacity>
              </GlassCard>
            ))}
          </View>
        )}

        {/* Online Friends */}
        {onlineFriends.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="radio-button-on" size={16} color={COLORS.success} />
              <Text style={styles.sectionTitle}>Online ({onlineFriends.length})</Text>
            </View>
            {onlineFriends.map(friend => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onChallenge={() => handleChallengeFriend(friend)}
                onGift={() => {
                  setSelectedFriend(friend);
                  setShowGiftModal(true);
                }}
                onMessage={() => navigation.navigate('Chat', { friendId: friend.id })}
              />
            ))}
          </View>
        )}

        {/* Offline Friends */}
        {offlineFriends.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Offline ({offlineFriends.length})</Text>
            {offlineFriends.map(friend => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onChallenge={() => handleChallengeFriend(friend)}
                onGift={() => {
                  setSelectedFriend(friend);
                  setShowGiftModal(true);
                }}
                onMessage={() => navigation.navigate('Chat', { friendId: friend.id })}
              />
            ))}
          </View>
        )}

        {friends.length === 0 && !refreshing && (
          <EmptyState
            icon="people-outline"
            title="No Friends Yet"
            description="Search for other musicians and add them as friends to compete and share your progress!"
            variant="subtle"
          />
        )}
      </ScrollView>

      {/* Challenge Modal */}
      <Modal visible={showChallengeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Challenge {selectedFriend?.displayName}</Text>
              <TouchableOpacity onPress={() => setShowChallengeModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Select Game Mode</Text>
            <View style={styles.modeGrid}>
              {(['speed', 'accuracy', 'survival', 'intervals', 'chords'] as const).map(mode => (
                <TouchableOpacity
                  key={mode}
                  style={styles.modeButton}
                  onPress={() => handleCreateChallenge(mode, 'medium')}
                >
                  <Text style={styles.modeButtonText}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* Gift Modal */}
      <Modal visible={showGiftModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Gift to {selectedFriend?.displayName}</Text>
              <TouchableOpacity onPress={() => setShowGiftModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Your Balance: 💰 {currency?.coins}</Text>
            <View style={styles.giftGrid}>
              <TouchableOpacity style={styles.giftButton} onPress={() => handleSendGift('coin_pack')}>
                <Text style={styles.giftIcon}>💰</Text>
                <Text style={styles.giftName}>Coin Pack</Text>
                <Text style={styles.giftCost}>Free</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.giftButton} onPress={() => handleSendGift('gem_pack')}>
                <Text style={styles.giftIcon}>💎</Text>
                <Text style={styles.giftName}>Gem Pack</Text>
                <Text style={styles.giftCost}>50 coins</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.giftButton} onPress={() => handleSendGift('xp_boost')}>
                <Text style={styles.giftIcon}>⚡</Text>
                <Text style={styles.giftName}>XP Boost</Text>
                <Text style={styles.giftCost}>100 coins</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.giftButton} onPress={() => handleSendGift('sticker')}>
                <Text style={styles.giftIcon}>⭐</Text>
                <Text style={styles.giftName}>Sticker</Text>
                <Text style={styles.giftCost}>25 coins</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </LinearGradient>
  );
}

interface FriendCardProps {
  friend: Friend;
  onChallenge: () => void;
  onGift: () => void;
  onMessage: () => void;
}

function FriendCard({ friend, onChallenge, onGift, onMessage }: FriendCardProps) {
  return (
    <GlassCard style={styles.friendCard}>
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.friendAvatar}>{friend.avatar || '👤'}</Text>
          <View
            style={[
              styles.onlineIndicator,
              { backgroundColor: friend.onlineStatus === 'online' ? COLORS.success : COLORS.textMuted },
            ]}
          />
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{friend.displayName}</Text>
          <Text style={styles.friendUsername}>@{friend.username}</Text>
          <View style={styles.friendStatsRow}>
            <Text style={styles.friendStat}>Lv {friend.level}</Text>
            <Text style={styles.friendStat}>•</Text>
            <Text style={styles.friendStat}>{friend.gamesPlayed} games</Text>
            {friend.winRate > 0 && (
              <>
                <Text style={styles.friendStat}>•</Text>
                <Text style={styles.friendStat}>{Math.round(friend.winRate)}% WR</Text>
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.friendActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onChallenge}>
          <Ionicons name="game-controller" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onGift}>
          <Ionicons name="gift" size={20} color={COLORS.warning} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onMessage}>
          <Ionicons name="chatbubble" size={20} color={COLORS.info} />
        </TouchableOpacity>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  backButton: {
    padding: SPACING.xs,
  },
  searchButton: {
    padding: SPACING.xs,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface + '60',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  currencyIcon: {
    fontSize: 20,
  },
  currencyValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface + '60',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  friendCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  friendAvatar: {
    fontSize: 40,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendUsername: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  friendStatsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  friendStat: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  friendStats: {
    alignItems: 'flex-end',
  },
  friendLevel: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  friendActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.surface + '60',
    borderRadius: BORDER_RADIUS.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary + '40',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  addButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  requestCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  requestMessage: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  requestActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: COLORS.success + '40',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  declineButton: {
    flex: 1,
    backgroundColor: COLORS.error + '40',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  challengeCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  challengeDetails: {
    flex: 1,
  },
  challengeFrom: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  challengeMode: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  challengeRounds: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  challengeAcceptButton: {
    backgroundColor: COLORS.success + '40',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  challengeAcceptText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: SPACING.md,
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: SPACING.xs,
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
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  modeButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.primary + '40',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modeButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  giftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  giftButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.warning + '20',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  giftIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  giftName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  giftCost: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
});
