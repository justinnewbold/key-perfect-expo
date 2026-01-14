import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'keyPerfect_userProfile',
  LOCAL_LEADERBOARD: 'keyPerfect_localLeaderboard',
  FRIENDS: 'keyPerfect_friends',
  CHALLENGES: 'keyPerfect_challenges',
};

export interface UserProfile {
  id: string;
  displayName: string;
  avatarEmoji: string;
  createdAt: string;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarEmoji: string;
  score: number;
  date: string;
}

export interface LeaderboardData {
  daily: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  allTime: LeaderboardEntry[];
  speed: LeaderboardEntry[];
  survival: LeaderboardEntry[];
}

export interface Friend {
  userId: string;
  displayName: string;
  avatarEmoji: string;
  addedAt: string;
  lastActive: string;
  totalXP: number;
  currentStreak: number;
}

export interface Challenge {
  id: string;
  type: 'speed' | 'survival' | 'accuracy' | 'streak';
  challenger: {
    userId: string;
    displayName: string;
    avatarEmoji: string;
    score: number;
  };
  challenged: {
    userId: string;
    displayName: string;
    avatarEmoji: string;
    score?: number;
  };
  status: 'pending' | 'accepted' | 'completed' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
  winner?: string;
}

// Avatar emoji options
export const AVATAR_EMOJIS = [
  '🎹', '🎸', '🎺', '🎻', '🥁', '🎷', '🎤', '🎵',
  '🎼', '🎧', '🎶', '🎙️', '🪕', '🪗', '🪘', '🎚️',
  '🦊', '🐼', '🦁', '🐯', '🐻', '🐨', '🐸', '🦉',
  '⭐', '🌟', '💫', '✨', '🔥', '💎', '🏆', '👑',
];

// Generate a unique user ID
function generateUserId(): string {
  return 'user_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}

// Get or create user profile
export async function getUserProfile(): Promise<UserProfile> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
  }

  // Create new profile
  const newProfile: UserProfile = {
    id: generateUserId(),
    displayName: 'Musician',
    avatarEmoji: '🎹',
    createdAt: new Date().toISOString(),
    totalXP: 0,
    currentStreak: 0,
    longestStreak: 0,
  };

  await saveUserProfile(newProfile);
  return newProfile;
}

// Save user profile
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
}

// Update display name
export async function updateDisplayName(name: string): Promise<void> {
  const profile = await getUserProfile();
  profile.displayName = name.trim().slice(0, 20);
  await saveUserProfile(profile);
}

// Update avatar
export async function updateAvatar(emoji: string): Promise<void> {
  const profile = await getUserProfile();
  profile.avatarEmoji = emoji;
  await saveUserProfile(profile);
}

// Get local leaderboard data
export async function getLeaderboardData(): Promise<LeaderboardData> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LOCAL_LEADERBOARD);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }

  return {
    daily: generateMockLeaderboard(10),
    weekly: generateMockLeaderboard(10),
    allTime: generateMockLeaderboard(10),
    speed: generateMockLeaderboard(10, 'speed'),
    survival: generateMockLeaderboard(10, 'survival'),
  };
}

// Generate mock leaderboard for demo purposes
function generateMockLeaderboard(count: number, type?: string): LeaderboardEntry[] {
  const names = [
    'MusicMaster', 'EarTrainer', 'PitchPro', 'ChordWizard', 'NoteNinja',
    'RhythmKing', 'MelodyMaker', 'HarmonyHero', 'TuneGenius', 'SoundSage',
    'BeatBoss', 'ScaleStar', 'KeyKing', 'ToneChamp', 'AudioAce',
  ];

  const entries: LeaderboardEntry[] = [];

  for (let i = 0; i < count; i++) {
    const baseScore = type === 'speed' ? 45 : type === 'survival' ? 25 : 1000;
    const variance = type === 'speed' ? 30 : type === 'survival' ? 20 : 500;

    entries.push({
      rank: i + 1,
      userId: `mock_${i}`,
      displayName: names[i % names.length],
      avatarEmoji: AVATAR_EMOJIS[i % AVATAR_EMOJIS.length],
      score: Math.floor(baseScore + Math.random() * variance * (count - i) / count),
      date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return entries.sort((a, b) => b.score - a.score).map((e, i) => ({ ...e, rank: i + 1 }));
}

// Submit score to leaderboard
export async function submitScore(
  category: keyof LeaderboardData,
  score: number
): Promise<{ rank: number; isPersonalBest: boolean }> {
  const profile = await getUserProfile();
  const leaderboard = await getLeaderboardData();

  const entry: LeaderboardEntry = {
    rank: 0,
    userId: profile.id,
    displayName: profile.displayName,
    avatarEmoji: profile.avatarEmoji,
    score,
    date: new Date().toISOString(),
  };

  // Add to leaderboard
  const categoryBoard = leaderboard[category];
  const existingIndex = categoryBoard.findIndex(e => e.userId === profile.id);
  const isPersonalBest = existingIndex === -1 || categoryBoard[existingIndex].score < score;

  if (isPersonalBest) {
    if (existingIndex !== -1) {
      categoryBoard.splice(existingIndex, 1);
    }
    categoryBoard.push(entry);
    categoryBoard.sort((a, b) => b.score - a.score);

    // Keep top 100
    leaderboard[category] = categoryBoard.slice(0, 100).map((e, i) => ({ ...e, rank: i + 1 }));

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LOCAL_LEADERBOARD, JSON.stringify(leaderboard));
    } catch (error) {
      console.error('Error saving leaderboard:', error);
    }
  }

  const rank = leaderboard[category].findIndex(e => e.userId === profile.id) + 1;

  return { rank: rank || leaderboard[category].length + 1, isPersonalBest };
}

// Friends management
export async function getFriends(): Promise<Friend[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FRIENDS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading friends:', error);
  }
  return [];
}

export async function addFriend(friendCode: string): Promise<{ success: boolean; error?: string }> {
  // In a real app, this would validate the friend code against a server
  // For now, we simulate adding a friend
  const friends = await getFriends();

  if (friends.length >= 50) {
    return { success: false, error: 'Friend limit reached (50)' };
  }

  // Simulate a found friend
  const mockFriend: Friend = {
    userId: `friend_${friendCode}`,
    displayName: `Player${friendCode.slice(-4)}`,
    avatarEmoji: AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)],
    addedAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    totalXP: Math.floor(Math.random() * 5000),
    currentStreak: Math.floor(Math.random() * 30),
  };

  friends.push(mockFriend);

  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friends));
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to save friend' };
  }
}

export async function removeFriend(userId: string): Promise<void> {
  const friends = await getFriends();
  const filtered = friends.filter(f => f.userId !== userId);

  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing friend:', error);
  }
}

// Challenge system
export async function getChallenges(): Promise<Challenge[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CHALLENGES);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading challenges:', error);
  }
  return [];
}

export async function createChallenge(
  friendId: string,
  type: Challenge['type'],
  score: number
): Promise<Challenge> {
  const profile = await getUserProfile();
  const friends = await getFriends();
  const friend = friends.find(f => f.userId === friendId);

  if (!friend) {
    throw new Error('Friend not found');
  }

  const challenge: Challenge = {
    id: `challenge_${Date.now()}`,
    type,
    challenger: {
      userId: profile.id,
      displayName: profile.displayName,
      avatarEmoji: profile.avatarEmoji,
      score,
    },
    challenged: {
      userId: friend.userId,
      displayName: friend.displayName,
      avatarEmoji: friend.avatarEmoji,
    },
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  };

  const challenges = await getChallenges();
  challenges.push(challenge);

  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
  } catch (error) {
    console.error('Error saving challenge:', error);
  }

  return challenge;
}

export async function respondToChallenge(
  challengeId: string,
  action: 'accept' | 'decline',
  score?: number
): Promise<void> {
  const challenges = await getChallenges();
  const challenge = challenges.find(c => c.id === challengeId);

  if (!challenge) return;

  if (action === 'decline') {
    challenge.status = 'declined';
  } else if (action === 'accept' && score !== undefined) {
    challenge.status = 'completed';
    challenge.challenged.score = score;
    challenge.completedAt = new Date().toISOString();
    challenge.winner = score > challenge.challenger.score
      ? challenge.challenged.userId
      : challenge.challenger.userId;
  }

  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
  } catch (error) {
    console.error('Error updating challenge:', error);
  }
}

// Get user's friend code (for sharing)
export async function getFriendCode(): Promise<string> {
  const profile = await getUserProfile();
  // In a real app, this would be a shorter, shareable code
  return profile.id.slice(-8).toUpperCase();
}

// Sync profile stats with user stats
export async function syncProfileWithStats(stats: {
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
}): Promise<void> {
  const profile = await getUserProfile();
  profile.totalXP = stats.totalXP;
  profile.currentStreak = stats.currentStreak;
  profile.longestStreak = stats.longestStreak;
  await saveUserProfile(profile);
}
