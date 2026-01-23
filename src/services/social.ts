import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from './leaderboard';

// Note: This is a mock implementation
// In production, use a real-time backend like Firebase, Supabase, or Socket.io

const STORAGE_KEYS = {
  MESSAGES: 'keyPerfect_messages',
  DUETS: 'keyPerfect_duets',
  GROUP_CHALLENGES: 'keyPerfect_groupChallenges',
  FRIENDS: 'keyPerfect_friends',
  FRIEND_REQUESTS: 'keyPerfect_friendRequests',
  HEAD_TO_HEAD_CHALLENGES: 'keyPerfect_headToHeadChallenges',
  ACTIVITY_FEED: 'keyPerfect_activityFeed',
  SOCIAL_CURRENCY: 'keyPerfect_socialCurrency',
  GIFTS: 'keyPerfect_gifts',
};

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'emoji' | 'challenge' | 'achievement';
}

export interface Conversation {
  friendId: string;
  friendName: string;
  friendAvatar: string;
  lastMessage: ChatMessage;
  unreadCount: number;
}

export interface DuetSession {
  id: string;
  status: 'waiting' | 'active' | 'completed';
  players: {
    userId: string;
    userName: string;
    avatar: string;
    score: number;
    ready: boolean;
  }[];
  gameMode: string;
  difficulty: string;
  startTime?: string;
  endTime?: string;
  winner?: string;
}

export interface GroupChallenge {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName: string;
  members: GroupMember[];
  goal: ChallengeGoal;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed';
  leaderboard: GroupMember[];
}

export interface GroupMember {
  userId: string;
  userName: string;
  avatar: string;
  score: number;
  contribution: number;
  joinedAt: string;
}

export interface ChallengeGoal {
  type: 'total_score' | 'average_accuracy' | 'total_xp' | 'collective_streak';
  target: number;
  current: number;
  unit: string;
}

// NEW: Friend System Types
export type FriendStatus = 'pending' | 'accepted' | 'blocked';
export type OnlineStatus = 'online' | 'away' | 'offline';

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number;
  totalXP: number;
  status: FriendStatus;
  onlineStatus: OnlineStatus;
  lastOnline: number;
  friendSince: number;
  mutualFriends: number;
  gamesPlayed: number;
  winRate: number;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number;
  message?: string;
  timestamp: number;
  status: FriendStatus;
}

// NEW: Head-to-Head Challenge Types
export type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'active' | 'completed' | 'expired';

export interface HeadToHeadChallenge {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUsername: string;
  toUsername: string;
  status: ChallengeStatus;
  wager?: number;
  mode: 'speed' | 'accuracy' | 'survival' | 'intervals' | 'chords';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  rounds: number;
  createdAt: number;
  expiresAt: number;
  startedAt?: number;
  completedAt?: number;
  winner?: string;
  scores: {
    [userId: string]: {
      score: number;
      accuracy: number;
      time: number;
    };
  };
}

// NEW: Activity Feed Types
export type ActivityType = 'friend_added' | 'challenge_sent' | 'challenge_won' | 'achievement_unlocked' | 'level_up' | 'gift_sent';

export interface ActivityFeedItem {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  type: ActivityType;
  description: string;
  timestamp: number;
  metadata?: any;
}

// NEW: Social Currency & Gifts
export interface SocialCurrency {
  userId: string;
  coins: number;
  gems: number;
  giftsReceived: number;
  giftsSent: number;
}

export interface Gift {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUsername: string;
  type: 'coin_pack' | 'gem_pack' | 'xp_boost' | 'power_up' | 'sticker';
  name: string;
  description: string;
  value: number;
  icon: string;
  timestamp: number;
  claimed: boolean;
}

// ===== CHAT FUNCTIONS =====

export async function getConversations(userId: string): Promise<Conversation[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (data) {
      const allMessages: ChatMessage[] = JSON.parse(data);

      // Group by conversation
      const conversationMap = new Map<string, ChatMessage[]>();
      allMessages
        .filter(m => m.senderId === userId || m.receiverId === userId)
        .forEach(msg => {
          const friendId = msg.senderId === userId ? msg.receiverId : msg.senderId;
          if (!conversationMap.has(friendId)) {
            conversationMap.set(friendId, []);
          }
          conversationMap.get(friendId)!.push(msg);
        });

      // Create conversation objects
      const conversations: Conversation[] = [];
      conversationMap.forEach((messages, friendId) => {
        const sortedMessages = messages.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        const lastMessage = sortedMessages[0];
        const unreadCount = messages.filter(m =>
          m.receiverId === userId && !m.read
        ).length;

        conversations.push({
          friendId,
          friendName: lastMessage.senderId === userId ? 'Friend' : lastMessage.senderName,
          friendAvatar: lastMessage.senderId === userId ? '👤' : lastMessage.senderAvatar,
          lastMessage,
          unreadCount,
        });
      });

      return conversations.sort((a, b) =>
        new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
      );
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
  }
  return [];
}

export async function getMessages(userId: string, friendId: string): Promise<ChatMessage[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (data) {
      const allMessages: ChatMessage[] = JSON.parse(data);
      return allMessages
        .filter(m =>
          (m.senderId === userId && m.receiverId === friendId) ||
          (m.senderId === friendId && m.receiverId === userId)
        )
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
  } catch (error) {
    console.error('Error loading messages:', error);
  }
  return [];
}

export async function sendMessage(
  senderId: string,
  senderName: string,
  senderAvatar: string,
  receiverId: string,
  content: string,
  type: ChatMessage['type'] = 'text'
): Promise<ChatMessage> {
  const message: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    senderId,
    senderName,
    senderAvatar,
    receiverId,
    content,
    timestamp: new Date().toISOString(),
    read: false,
    type,
  };

  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
    const messages: ChatMessage[] = data ? JSON.parse(data) : [];
    messages.push(message);

    // Keep only last 1000 messages
    const trimmed = messages.slice(-1000);
    await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error sending message:', error);
  }

  return message;
}

export async function markMessagesAsRead(userId: string, friendId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (data) {
      const messages: ChatMessage[] = JSON.parse(data);
      messages.forEach(msg => {
        if (msg.senderId === friendId && msg.receiverId === userId) {
          msg.read = true;
        }
      });
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

export async function getTotalUnreadCount(userId: string): Promise<number> {
  const conversations = await getConversations(userId);
  return conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
}

// ===== DUET MODE FUNCTIONS =====

export async function createDuetSession(
  hostId: string,
  hostName: string,
  hostAvatar: string,
  gameMode: string,
  difficulty: string
): Promise<DuetSession> {
  const session: DuetSession = {
    id: `duet_${Date.now()}`,
    status: 'waiting',
    players: [
      {
        userId: hostId,
        userName: hostName,
        avatar: hostAvatar,
        score: 0,
        ready: true,
      },
    ],
    gameMode,
    difficulty,
  };

  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DUETS);
    const sessions: DuetSession[] = data ? JSON.parse(data) : [];
    sessions.push(session);
    await AsyncStorage.setItem(STORAGE_KEYS.DUETS, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error creating duet session:', error);
  }

  return session;
}

export async function joinDuetSession(
  sessionId: string,
  userId: string,
  userName: string,
  userAvatar: string
): Promise<DuetSession | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DUETS);
    if (data) {
      const sessions: DuetSession[] = JSON.parse(data);
      const session = sessions.find(s => s.id === sessionId);

      if (session && session.status === 'waiting' && session.players.length < 2) {
        session.players.push({
          userId,
          userName,
          avatar: userAvatar,
          score: 0,
          ready: false,
        });

        await AsyncStorage.setItem(STORAGE_KEYS.DUETS, JSON.stringify(sessions));
        return session;
      }
    }
  } catch (error) {
    console.error('Error joining duet session:', error);
  }

  return null;
}

export async function updateDuetScore(
  sessionId: string,
  userId: string,
  score: number
): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DUETS);
    if (data) {
      const sessions: DuetSession[] = JSON.parse(data);
      const session = sessions.find(s => s.id === sessionId);

      if (session) {
        const player = session.players.find(p => p.userId === userId);
        if (player) {
          player.score = score;
        }

        // Check if both players finished
        if (session.players.every(p => p.score > 0)) {
          session.status = 'completed';
          session.endTime = new Date().toISOString();

          // Determine winner
          const winner = session.players.reduce((max, p) =>
            p.score > max.score ? p : max
          );
          session.winner = winner.userId;
        }

        await AsyncStorage.setItem(STORAGE_KEYS.DUETS, JSON.stringify(sessions));
      }
    }
  } catch (error) {
    console.error('Error updating duet score:', error);
  }
}

export async function getDuetSession(sessionId: string): Promise<DuetSession | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DUETS);
    if (data) {
      const sessions: DuetSession[] = JSON.parse(data);
      return sessions.find(s => s.id === sessionId) || null;
    }
  } catch (error) {
    console.error('Error getting duet session:', error);
  }
  return null;
}

export async function getActiveDuetSessions(): Promise<DuetSession[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DUETS);
    if (data) {
      const sessions: DuetSession[] = JSON.parse(data);
      return sessions.filter(s => s.status === 'waiting' || s.status === 'active');
    }
  } catch (error) {
    console.error('Error getting active duets:', error);
  }
  return [];
}

// ===== GROUP CHALLENGE FUNCTIONS =====

export async function createGroupChallenge(
  creatorId: string,
  creatorName: string,
  name: string,
  description: string,
  goalType: ChallengeGoal['type'],
  target: number,
  durationDays: number
): Promise<GroupChallenge> {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + durationDays);

  const challenge: GroupChallenge = {
    id: `group_${Date.now()}`,
    name,
    description,
    creatorId,
    creatorName,
    members: [
      {
        userId: creatorId,
        userName: creatorName,
        avatar: '👤',
        score: 0,
        contribution: 0,
        joinedAt: now.toISOString(),
      },
    ],
    goal: {
      type: goalType,
      target,
      current: 0,
      unit: getGoalUnit(goalType),
    },
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    status: 'active',
    leaderboard: [],
  };

  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GROUP_CHALLENGES);
    const challenges: GroupChallenge[] = data ? JSON.parse(data) : [];
    challenges.push(challenge);
    await AsyncStorage.setItem(STORAGE_KEYS.GROUP_CHALLENGES, JSON.stringify(challenges));
  } catch (error) {
    console.error('Error creating group challenge:', error);
  }

  return challenge;
}

export async function joinGroupChallenge(
  challengeId: string,
  userId: string,
  userName: string,
  userAvatar: string
): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GROUP_CHALLENGES);
    if (data) {
      const challenges: GroupChallenge[] = JSON.parse(data);
      const challenge = challenges.find(c => c.id === challengeId);

      if (challenge && challenge.status === 'active') {
        const alreadyMember = challenge.members.some(m => m.userId === userId);
        if (!alreadyMember) {
          challenge.members.push({
            userId,
            userName,
            avatar: userAvatar,
            score: 0,
            contribution: 0,
            joinedAt: new Date().toISOString(),
          });

          await AsyncStorage.setItem(STORAGE_KEYS.GROUP_CHALLENGES, JSON.stringify(challenges));
          return true;
        }
      }
    }
  } catch (error) {
    console.error('Error joining group challenge:', error);
  }

  return false;
}

export async function updateGroupProgress(
  challengeId: string,
  userId: string,
  contribution: number
): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GROUP_CHALLENGES);
    if (data) {
      const challenges: GroupChallenge[] = JSON.parse(data);
      const challenge = challenges.find(c => c.id === challengeId);

      if (challenge) {
        const member = challenge.members.find(m => m.userId === userId);
        if (member) {
          member.contribution += contribution;
          member.score += contribution;
        }

        // Update total progress
        challenge.goal.current = challenge.members.reduce((sum, m) => sum + m.contribution, 0);

        // Update leaderboard
        challenge.leaderboard = [...challenge.members]
          .sort((a, b) => b.contribution - a.contribution)
          .slice(0, 20);

        // Check if goal reached
        if (challenge.goal.current >= challenge.goal.target) {
          challenge.status = 'completed';
        }

        await AsyncStorage.setItem(STORAGE_KEYS.GROUP_CHALLENGES, JSON.stringify(challenges));
      }
    }
  } catch (error) {
    console.error('Error updating group progress:', error);
  }
}

export async function getGroupChallenges(userId?: string): Promise<GroupChallenge[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GROUP_CHALLENGES);
    if (data) {
      const challenges: GroupChallenge[] = JSON.parse(data);

      if (userId) {
        // Return only challenges user is part of
        return challenges.filter(c => c.members.some(m => m.userId === userId));
      }

      return challenges.filter(c => c.status === 'active');
    }
  } catch (error) {
    console.error('Error getting group challenges:', error);
  }

  return [];
}

export async function getGroupChallenge(challengeId: string): Promise<GroupChallenge | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GROUP_CHALLENGES);
    if (data) {
      const challenges: GroupChallenge[] = JSON.parse(data);
      return challenges.find(c => c.id === challengeId) || null;
    }
  } catch (error) {
    console.error('Error getting group challenge:', error);
  }

  return null;
}

function getGoalUnit(type: ChallengeGoal['type']): string {
  switch (type) {
    case 'total_score': return 'points';
    case 'average_accuracy': return '% accuracy';
    case 'total_xp': return 'XP';
    case 'collective_streak': return 'day streak';
    default: return 'points';
  }
}

// ===== FRIEND MANAGEMENT =====

export async function getFriends(userId: string): Promise<Friend[]> {
  try {
    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.FRIENDS}_${userId}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading friends:', error);
  }
  return [];
}

export async function getFriendRequests(userId: string): Promise<FriendRequest[]> {
  try {
    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.FRIEND_REQUESTS}_${userId}`);
    if (data) {
      const requests: FriendRequest[] = JSON.parse(data);
      return requests.filter(r => r.status === 'pending');
    }
  } catch (error) {
    console.error('Error loading friend requests:', error);
  }
  return [];
}

export async function sendFriendRequest(
  fromUserId: string,
  toUserId: string,
  message?: string
): Promise<boolean> {
  try {
    const mockUser = {
      username: `user_${fromUserId}`,
      displayName: `Player ${fromUserId}`,
      level: 15,
      avatar: '👤',
    };

    const request: FriendRequest = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      fromUserId,
      toUserId,
      username: mockUser.username,
      displayName: mockUser.displayName,
      avatar: mockUser.avatar,
      level: mockUser.level,
      message,
      timestamp: Date.now(),
      status: 'pending',
    };

    const existingRequests = await getFriendRequests(toUserId);
    existingRequests.push(request);
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.FRIEND_REQUESTS}_${toUserId}`,
      JSON.stringify(existingRequests)
    );

    await addActivityFeedItem({
      userId: fromUserId,
      username: mockUser.username,
      type: 'friend_added',
      description: `sent you a friend request`,
      timestamp: Date.now(),
    });

    return true;
  } catch (error) {
    console.error('Error sending friend request:', error);
    return false;
  }
}

export async function acceptFriendRequest(
  userId: string,
  requestId: string
): Promise<boolean> {
  try {
    const requests = await getFriendRequests(userId);
    const request = requests.find(r => r.id === requestId);

    if (!request) return false;

    const newFriend: Friend = {
      id: request.fromUserId,
      username: request.username,
      displayName: request.displayName,
      avatar: request.avatar,
      level: request.level,
      totalXP: request.level * 1000,
      status: 'accepted',
      onlineStatus: 'online',
      lastOnline: Date.now(),
      friendSince: Date.now(),
      mutualFriends: 0,
      gamesPlayed: 0,
      winRate: 0,
    };

    const userFriends = await getFriends(userId);
    userFriends.push(newFriend);
    await AsyncStorage.setItem(`${STORAGE_KEYS.FRIENDS}_${userId}`, JSON.stringify(userFriends));

    const friendFriends = await getFriends(request.fromUserId);
    friendFriends.push({
      ...newFriend,
      id: userId,
      username: `user_${userId}`,
      displayName: `Player ${userId}`,
    });
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.FRIENDS}_${request.fromUserId}`,
      JSON.stringify(friendFriends)
    );

    const updatedRequests = requests.filter(r => r.id !== requestId);
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.FRIEND_REQUESTS}_${userId}`,
      JSON.stringify(updatedRequests)
    );

    return true;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return false;
  }
}

export async function declineFriendRequest(
  userId: string,
  requestId: string
): Promise<boolean> {
  try {
    const requests = await getFriendRequests(userId);
    const updatedRequests = requests.filter(r => r.id !== requestId);
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.FRIEND_REQUESTS}_${userId}`,
      JSON.stringify(updatedRequests)
    );
    return true;
  } catch (error) {
    console.error('Error declining friend request:', error);
    return false;
  }
}

export async function removeFriend(userId: string, friendId: string): Promise<boolean> {
  try {
    const friends = await getFriends(userId);
    const updatedFriends = friends.filter(f => f.id !== friendId);
    await AsyncStorage.setItem(`${STORAGE_KEYS.FRIENDS}_${userId}`, JSON.stringify(updatedFriends));

    const friendFriends = await getFriends(friendId);
    const updatedFriendFriends = friendFriends.filter(f => f.id !== userId);
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.FRIENDS}_${friendId}`,
      JSON.stringify(updatedFriendFriends)
    );

    return true;
  } catch (error) {
    console.error('Error removing friend:', error);
    return false;
  }
}

export async function searchUsers(query: string): Promise<Friend[]> {
  const mockUsers: Friend[] = [
    {
      id: 'user1',
      username: 'piano_master',
      displayName: 'Piano Master',
      level: 42,
      totalXP: 42000,
      status: 'accepted',
      onlineStatus: 'online',
      lastOnline: Date.now(),
      friendSince: Date.now() - 86400000 * 30,
      mutualFriends: 5,
      gamesPlayed: 120,
      winRate: 67,
      avatar: '🎹',
    },
    {
      id: 'user2',
      username: 'chord_wizard',
      displayName: 'Chord Wizard',
      level: 35,
      totalXP: 35000,
      status: 'accepted',
      onlineStatus: 'away',
      lastOnline: Date.now() - 3600000,
      friendSince: Date.now() - 86400000 * 15,
      mutualFriends: 2,
      gamesPlayed: 85,
      winRate: 72,
      avatar: '🎸',
    },
  ];

  return mockUsers.filter(user =>
    user.username.toLowerCase().includes(query.toLowerCase()) ||
    user.displayName.toLowerCase().includes(query.toLowerCase())
  );
}

// ===== HEAD-TO-HEAD CHALLENGES =====

export async function getHeadToHeadChallenges(userId: string): Promise<HeadToHeadChallenge[]> {
  try {
    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.HEAD_TO_HEAD_CHALLENGES}_${userId}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading head-to-head challenges:', error);
  }
  return [];
}

export async function createHeadToHeadChallenge(
  fromUserId: string,
  toUserId: string,
  mode: HeadToHeadChallenge['mode'],
  difficulty: HeadToHeadChallenge['difficulty'],
  rounds: number,
  wager?: number
): Promise<HeadToHeadChallenge | null> {
  try {
    const friends = await getFriends(fromUserId);
    const friend = friends.find(f => f.id === toUserId);

    if (!friend) {
      console.error('Not friends with this user');
      return null;
    }

    const challenge: HeadToHeadChallenge = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      fromUserId,
      toUserId,
      fromUsername: `user_${fromUserId}`,
      toUsername: friend.username,
      status: 'pending',
      wager,
      mode,
      difficulty,
      rounds,
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
      scores: {},
    };

    const fromChallenges = await getHeadToHeadChallenges(fromUserId);
    fromChallenges.push(challenge);
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.HEAD_TO_HEAD_CHALLENGES}_${fromUserId}`,
      JSON.stringify(fromChallenges)
    );

    const toChallenges = await getHeadToHeadChallenges(toUserId);
    toChallenges.push(challenge);
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.HEAD_TO_HEAD_CHALLENGES}_${toUserId}`,
      JSON.stringify(toChallenges)
    );

    return challenge;
  } catch (error) {
    console.error('Error creating head-to-head challenge:', error);
    return null;
  }
}

export async function acceptHeadToHeadChallenge(userId: string, challengeId: string): Promise<boolean> {
  try {
    const challenges = await getHeadToHeadChallenges(userId);
    const challenge = challenges.find(c => c.id === challengeId);

    if (!challenge) return false;

    challenge.status = 'accepted';
    challenge.startedAt = Date.now();

    await AsyncStorage.setItem(`${STORAGE_KEYS.HEAD_TO_HEAD_CHALLENGES}_${userId}`, JSON.stringify(challenges));

    const opponentId = challenge.fromUserId === userId ? challenge.toUserId : challenge.fromUserId;
    const opponentChallenges = await getHeadToHeadChallenges(opponentId);
    const opponentChallenge = opponentChallenges.find(c => c.id === challengeId);
    if (opponentChallenge) {
      opponentChallenge.status = 'accepted';
      opponentChallenge.startedAt = Date.now();
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.HEAD_TO_HEAD_CHALLENGES}_${opponentId}`,
        JSON.stringify(opponentChallenges)
      );
    }

    return true;
  } catch (error) {
    console.error('Error accepting challenge:', error);
    return false;
  }
}

export async function submitHeadToHeadScore(
  userId: string,
  challengeId: string,
  score: number,
  accuracy: number,
  time: number
): Promise<boolean> {
  try {
    const challenges = await getHeadToHeadChallenges(userId);
    const challenge = challenges.find(c => c.id === challengeId);

    if (!challenge) return false;

    challenge.scores[userId] = { score, accuracy, time };

    const opponentId = challenge.fromUserId === userId ? challenge.toUserId : challenge.fromUserId;
    if (challenge.scores[opponentId]) {
      if (challenge.scores[userId].score > challenge.scores[opponentId].score) {
        challenge.winner = userId;
      } else if (challenge.scores[userId].score < challenge.scores[opponentId].score) {
        challenge.winner = opponentId;
      } else {
        if (challenge.scores[userId].accuracy > challenge.scores[opponentId].accuracy) {
          challenge.winner = userId;
        } else {
          challenge.winner = opponentId;
        }
      }

      challenge.status = 'completed';
      challenge.completedAt = Date.now();

      if (challenge.winner) {
        await updateFriendStats(userId, opponentId, challenge.winner === userId);
      }

      if (challenge.winner === userId) {
        await addActivityFeedItem({
          userId,
          username: challenge.fromUsername === `user_${userId}` ? challenge.fromUsername : challenge.toUsername,
          type: 'challenge_won',
          description: `won a ${challenge.mode} challenge!`,
          timestamp: Date.now(),
        });
      }
    }

    await AsyncStorage.setItem(`${STORAGE_KEYS.HEAD_TO_HEAD_CHALLENGES}_${userId}`, JSON.stringify(challenges));

    return true;
  } catch (error) {
    console.error('Error submitting challenge score:', error);
    return false;
  }
}

async function updateFriendStats(
  userId: string,
  friendId: string,
  didWin: boolean
): Promise<void> {
  try {
    const friends = await getFriends(userId);
    const friend = friends.find(f => f.id === friendId);

    if (friend) {
      friend.gamesPlayed++;
      if (didWin) {
        friend.winRate = ((friend.winRate * (friend.gamesPlayed - 1) + 100) / friend.gamesPlayed);
      } else {
        friend.winRate = ((friend.winRate * (friend.gamesPlayed - 1)) / friend.gamesPlayed);
      }

      await AsyncStorage.setItem(`${STORAGE_KEYS.FRIENDS}_${userId}`, JSON.stringify(friends));
    }
  } catch (error) {
    console.error('Error updating friend stats:', error);
  }
}

// ===== ACTIVITY FEED =====

export async function getActivityFeed(userId: string): Promise<ActivityFeedItem[]> {
  try {
    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.ACTIVITY_FEED}_${userId}`);
    if (data) {
      const feed: ActivityFeedItem[] = JSON.parse(data);
      return feed.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
    }
  } catch (error) {
    console.error('Error loading activity feed:', error);
  }
  return [];
}

export async function addActivityFeedItem(item: Omit<ActivityFeedItem, 'id'>): Promise<void> {
  try {
    const feed = await getActivityFeed(item.userId);

    const newItem: ActivityFeedItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    };

    feed.unshift(newItem);

    const trimmedFeed = feed.slice(0, 100);

    await AsyncStorage.setItem(
      `${STORAGE_KEYS.ACTIVITY_FEED}_${item.userId}`,
      JSON.stringify(trimmedFeed)
    );
  } catch (error) {
    console.error('Error adding activity feed item:', error);
  }
}

// ===== SOCIAL CURRENCY & GIFTS =====

export async function getSocialCurrency(userId: string): Promise<SocialCurrency> {
  try {
    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.SOCIAL_CURRENCY}_${userId}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading social currency:', error);
  }

  return {
    userId,
    coins: 1000,
    gems: 50,
    giftsReceived: 0,
    giftsSent: 0,
  };
}

export async function updateSocialCurrency(
  userId: string,
  coins?: number,
  gems?: number
): Promise<void> {
  try {
    const currency = await getSocialCurrency(userId);

    if (coins !== undefined) currency.coins += coins;
    if (gems !== undefined) currency.gems += gems;

    await AsyncStorage.setItem(
      `${STORAGE_KEYS.SOCIAL_CURRENCY}_${userId}`,
      JSON.stringify(currency)
    );
  } catch (error) {
    console.error('Error updating social currency:', error);
  }
}

export async function sendGift(
  fromUserId: string,
  toUserId: string,
  giftType: Gift['type']
): Promise<boolean> {
  try {
    const currency = await getSocialCurrency(fromUserId);

    const gifts: Record<Gift['type'], { name: string; cost: number; value: number; icon: string; description: string }> = {
      coin_pack: { name: 'Coin Pack', cost: 0, value: 100, icon: '💰', description: '100 coins' },
      gem_pack: { name: 'Gem Pack', cost: 50, value: 10, icon: '💎', description: '10 gems' },
      xp_boost: { name: 'XP Boost', cost: 100, value: 500, icon: '⚡', description: '+500 XP' },
      power_up: { name: 'Power Up', cost: 150, value: 1, icon: '🚀', description: 'Practice boost' },
      sticker: { name: 'Sticker', cost: 25, value: 1, icon: '⭐', description: 'Special sticker' },
    };

    const giftData = gifts[giftType];
    if (!giftData) return false;

    if (currency.coins < giftData.cost) {
      console.error('Insufficient coins');
      return false;
    }

    const gift: Gift = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      fromUserId,
      toUserId,
      fromUsername: `user_${fromUserId}`,
      type: giftType,
      name: giftData.name,
      description: giftData.description,
      value: giftData.value,
      icon: giftData.icon,
      timestamp: Date.now(),
      claimed: false,
    };

    await updateSocialCurrency(fromUserId, -giftData.cost);

    currency.giftsSent++;
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.SOCIAL_CURRENCY}_${fromUserId}`,
      JSON.stringify(currency)
    );

    const recipientGifts = await getGifts(toUserId);
    recipientGifts.push(gift);
    await AsyncStorage.setItem(`${STORAGE_KEYS.GIFTS}_${toUserId}`, JSON.stringify(recipientGifts));

    await addActivityFeedItem({
      userId: toUserId,
      username: `user_${fromUserId}`,
      type: 'gift_sent',
      description: `sent you a ${giftData.name}`,
      timestamp: Date.now(),
      metadata: { giftType },
    });

    return true;
  } catch (error) {
    console.error('Error sending gift:', error);
    return false;
  }
}

export async function getGifts(userId: string): Promise<Gift[]> {
  try {
    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.GIFTS}_${userId}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading gifts:', error);
  }
  return [];
}

export async function claimGift(userId: string, giftId: string): Promise<boolean> {
  try {
    const gifts = await getGifts(userId);
    const gift = gifts.find(g => g.id === giftId);

    if (!gift || gift.claimed) return false;

    gift.claimed = true;

    switch (gift.type) {
      case 'coin_pack':
        await updateSocialCurrency(userId, gift.value);
        break;
      case 'gem_pack':
        await updateSocialCurrency(userId, 0, gift.value);
        break;
      case 'xp_boost':
      case 'power_up':
      case 'sticker':
        break;
    }

    const currency = await getSocialCurrency(userId);
    currency.giftsReceived++;
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.SOCIAL_CURRENCY}_${userId}`,
      JSON.stringify(currency)
    );

    await AsyncStorage.setItem(`${STORAGE_KEYS.GIFTS}_${userId}`, JSON.stringify(gifts));

    return true;
  } catch (error) {
    console.error('Error claiming gift:', error);
    return false;
  }
}

// ===== UTILITY FUNCTIONS =====

export async function getOnlineFriendsCount(userId: string): Promise<number> {
  const friends = await getFriends(userId);
  return friends.filter(f => f.onlineStatus === 'online').length;
}

export async function getPendingFriendRequestsCount(userId: string): Promise<number> {
  const requests = await getFriendRequests(userId);
  return requests.length;
}

export async function getPendingChallengesCount(userId: string): Promise<number> {
  const challenges = await getHeadToHeadChallenges(userId);
  return challenges.filter(c => c.status === 'pending' && c.toUserId === userId).length;
}

// ===== SOCIAL SHARING =====

export interface ShareContent {
  type: 'achievement' | 'score' | 'streak' | 'level';
  title: string;
  description: string;
  imageUrl?: string;
  shareUrl?: string;
}

export function generateShareContent(
  type: ShareContent['type'],
  data: any
): ShareContent {
  switch (type) {
    case 'achievement':
      return {
        type: 'achievement',
        title: `🏅 Achievement Unlocked!`,
        description: `I just unlocked "${data.name}" in Key Perfect! ${data.description}`,
        shareUrl: 'https://keyperfect.app/share/achievement',
      };

    case 'score':
      return {
        type: 'score',
        title: `🎵 New High Score!`,
        description: `I scored ${data.score} in ${data.mode} mode on Key Perfect! Can you beat it?`,
        shareUrl: 'https://keyperfect.app/share/score',
      };

    case 'streak':
      return {
        type: 'streak',
        title: `🔥 ${data.days}-Day Streak!`,
        description: `${data.days} days of perfect pitch practice and counting! Join me on Key Perfect!`,
        shareUrl: 'https://keyperfect.app/share/streak',
      };

    case 'level':
      return {
        type: 'level',
        title: `✨ Level ${data.level} Complete!`,
        description: `Just completed Level ${data.level} in Key Perfect with ${data.accuracy}% accuracy!`,
        shareUrl: 'https://keyperfect.app/share/level',
      };

    default:
      return {
        type: 'achievement',
        title: 'Key Perfect',
        description: 'Train your ear with Key Perfect!',
      };
  }
}

// Mock function for sharing (would use react-native-share in production)
export async function shareToSocial(content: ShareContent): Promise<boolean> {
  console.log('Mock: Sharing to social media:', content);
  // In production: Share.share({ message: content.description, url: content.shareUrl });
  return true;
}
