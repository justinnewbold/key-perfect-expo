import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from './leaderboard';

// Note: This is a mock implementation
// In production, use a real-time backend like Firebase, Supabase, or Socket.io

const STORAGE_KEYS = {
  MESSAGES: 'keyPerfect_messages',
  DUETS: 'keyPerfect_duets',
  GROUP_CHALLENGES: 'keyPerfect_groupChallenges',
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
