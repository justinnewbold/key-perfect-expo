import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'keyPerfect_userProfile',
  LOCAL_LEADERBOARD: 'keyPerfect_localLeaderboard',
  FRIENDS: 'keyPerfect_friends',
  CHALLENGES: 'keyPerfect_challenges',
  TOURNAMENT: 'keyPerfect_tournament',
  TOURNAMENT_HISTORY: 'keyPerfect_tournamentHistory',
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

// ===== TOURNAMENT SYSTEM =====

export interface TournamentPrize {
  rank: number;
  badge: string;
  title: string;
  xpBonus: number;
}

export interface TournamentEntry extends LeaderboardEntry {
  weekScore: number; // Total score for the week
}

export interface Tournament {
  id: string;
  weekNumber: number; // Week number of the year
  year: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'ended';
  leaderboard: TournamentEntry[];
  prizes: TournamentPrize[];
}

export interface TournamentHistory {
  tournaments: Tournament[];
  userBestRank: number;
  userTotalWins: number;
  userTotalPrizes: TournamentPrize[];
}

// Tournament prizes (top 10)
export const TOURNAMENT_PRIZES: TournamentPrize[] = [
  { rank: 1, badge: '👑', title: 'Champion', xpBonus: 1000 },
  { rank: 2, badge: '🥈', title: 'Runner-up', xpBonus: 750 },
  { rank: 3, badge: '🥉', title: 'Third Place', xpBonus: 500 },
  { rank: 4, badge: '🏅', title: 'Top 5', xpBonus: 300 },
  { rank: 5, badge: '🏅', title: 'Top 5', xpBonus: 300 },
  { rank: 6, badge: '🎖️', title: 'Top 10', xpBonus: 200 },
  { rank: 7, badge: '🎖️', title: 'Top 10', xpBonus: 200 },
  { rank: 8, badge: '🎖️', title: 'Top 10', xpBonus: 200 },
  { rank: 9, badge: '🎖️', title: 'Top 10', xpBonus: 200 },
  { rank: 10, badge: '🎖️', title: 'Top 10', xpBonus: 200 },
];

// Get week number from date
function getWeekNumber(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week: weekNo, year: d.getUTCFullYear() };
}

// Get Monday of current week
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// Get Sunday of current week
function getSundayOfWeek(date: Date): Date {
  const monday = getMondayOfWeek(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
}

// Get or create current tournament
export async function getCurrentTournament(): Promise<Tournament> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TOURNAMENT);
    if (data) {
      const tournament: Tournament = JSON.parse(data);

      // Check if tournament is still active (ends on Sunday)
      const now = new Date();
      const { week, year } = getWeekNumber(now);

      if (tournament.weekNumber === week && tournament.year === year) {
        return tournament;
      } else {
        // Tournament ended, archive it and create new one
        await archiveTournament(tournament);
      }
    }
  } catch (error) {
    console.error('Error loading tournament:', error);
  }

  // Create new tournament
  return await createNewTournament();
}

// Create new tournament
async function createNewTournament(): Promise<Tournament> {
  const now = new Date();
  const { week, year } = getWeekNumber(now);
  const monday = getMondayOfWeek(now);
  const sunday = getSundayOfWeek(now);

  const newTournament: Tournament = {
    id: `tournament_${year}_w${week}`,
    weekNumber: week,
    year,
    startDate: monday.toISOString(),
    endDate: sunday.toISOString(),
    status: 'active',
    leaderboard: generateMockTournamentLeaderboard(20),
    prizes: TOURNAMENT_PRIZES,
  };

  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOURNAMENT, JSON.stringify(newTournament));
  } catch (error) {
    console.error('Error saving tournament:', error);
  }

  return newTournament;
}

// Generate mock tournament leaderboard
function generateMockTournamentLeaderboard(count: number): TournamentEntry[] {
  const names = [
    'TournamentKing', 'WeeklyChamp', 'CompetitiveAce', 'RankClimber', 'ScoreHunter',
    'LeaderboardPro', 'WeeklyWarrior', 'TourneyBeast', 'ChampionSeeker', 'TopTierPlayer',
    'EliteCompetitor', 'RankingLegend', 'WeeklyHero', 'PointMaster', 'TournamentStar',
  ];

  const entries: TournamentEntry[] = [];

  for (let i = 0; i < count; i++) {
    const baseScore = 5000;
    const variance = 3000;

    entries.push({
      rank: i + 1,
      userId: `mock_tournament_${i}`,
      displayName: names[i % names.length] + (i >= names.length ? i : ''),
      avatarEmoji: AVATAR_EMOJIS[i % AVATAR_EMOJIS.length],
      score: Math.floor(baseScore + Math.random() * variance * (count - i) / count),
      date: new Date().toISOString(),
      weekScore: Math.floor(baseScore + Math.random() * variance * (count - i) / count),
    });
  }

  return entries.sort((a, b) => b.weekScore - a.weekScore).map((e, i) => ({ ...e, rank: i + 1 }));
}

// Submit score to tournament
export async function submitTournamentScore(score: number): Promise<{ rank: number; improvement: number }> {
  const tournament = await getCurrentTournament();
  const profile = await getUserProfile();

  const existingIndex = tournament.leaderboard.findIndex(e => e.userId === profile.id);
  const previousRank = existingIndex !== -1 ? tournament.leaderboard[existingIndex].rank : tournament.leaderboard.length + 1;

  if (existingIndex !== -1) {
    // Add to existing score
    tournament.leaderboard[existingIndex].weekScore += score;
    tournament.leaderboard[existingIndex].score = tournament.leaderboard[existingIndex].weekScore;
    tournament.leaderboard[existingIndex].date = new Date().toISOString();
  } else {
    // Create new entry
    const newEntry: TournamentEntry = {
      rank: 0,
      userId: profile.id,
      displayName: profile.displayName,
      avatarEmoji: profile.avatarEmoji,
      score: score,
      date: new Date().toISOString(),
      weekScore: score,
    };
    tournament.leaderboard.push(newEntry);
  }

  // Re-sort and update ranks
  tournament.leaderboard.sort((a, b) => b.weekScore - a.weekScore);
  tournament.leaderboard = tournament.leaderboard.map((e, i) => ({ ...e, rank: i + 1 }));

  // Keep top 100
  tournament.leaderboard = tournament.leaderboard.slice(0, 100);

  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOURNAMENT, JSON.stringify(tournament));
  } catch (error) {
    console.error('Error saving tournament:', error);
  }

  const newRank = tournament.leaderboard.findIndex(e => e.userId === profile.id) + 1;
  const improvement = previousRank - newRank;

  return { rank: newRank, improvement };
}

// Archive finished tournament
async function archiveTournament(tournament: Tournament): Promise<void> {
  tournament.status = 'ended';

  try {
    const historyData = await AsyncStorage.getItem(STORAGE_KEYS.TOURNAMENT_HISTORY);
    const history: TournamentHistory = historyData
      ? JSON.parse(historyData)
      : { tournaments: [], userBestRank: 999, userTotalWins: 0, userTotalPrizes: [] };

    history.tournaments.unshift(tournament);

    // Keep only last 10 tournaments
    history.tournaments = history.tournaments.slice(0, 10);

    // Update user stats
    const profile = await getUserProfile();
    const userEntry = tournament.leaderboard.find(e => e.userId === profile.id);

    if (userEntry) {
      if (userEntry.rank < history.userBestRank) {
        history.userBestRank = userEntry.rank;
      }
      if (userEntry.rank === 1) {
        history.userTotalWins += 1;
      }

      // Award prizes
      const prize = TOURNAMENT_PRIZES.find(p => p.rank === userEntry.rank);
      if (prize) {
        history.userTotalPrizes.push(prize);
      }
    }

    await AsyncStorage.setItem(STORAGE_KEYS.TOURNAMENT_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Error archiving tournament:', error);
  }
}

// Get tournament history
export async function getTournamentHistory(): Promise<TournamentHistory> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TOURNAMENT_HISTORY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading tournament history:', error);
  }

  return {
    tournaments: [],
    userBestRank: 999,
    userTotalWins: 0,
    userTotalPrizes: [],
  };
}

// Get time until tournament ends
export function getTimeUntilTournamentEnd(tournament: Tournament): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isEnding: boolean;
} {
  const now = new Date();
  const end = new Date(tournament.endDate);
  end.setHours(23, 59, 59, 999); // End of Sunday

  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isEnding: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isEnding: days === 0 && hours < 6 };
}

// Check if user is in prize range
export function getUserPrize(rank: number): TournamentPrize | null {
  return TOURNAMENT_PRIZES.find(p => p.rank === rank) || null;
}
