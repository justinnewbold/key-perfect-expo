import AsyncStorage from '@react-native-async-storage/async-storage';

// Note: In production, use Spotify Web API, Apple Music API, or YouTube Music API
// This is a mock implementation for demonstration

export type MusicPlatform = 'spotify' | 'apple_music' | 'youtube_music';

export interface MusicAccount {
  platform: MusicPlatform;
  userId: string;
  username: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  connected: boolean;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  artworkUrl?: string;
  spotifyId?: string;
  appleMusicId?: string;
  youtubeId?: string;
}

export interface SongAnalysis {
  songId: string;
  key: string; // e.g., "C Major", "A Minor"
  tempo: number; // BPM
  timeSignature: string; // e.g., "4/4", "3/4"
  sections: SongSection[];
  chordProgression: Chord[];
  melodyNotes: Note[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

export interface SongSection {
  start: number; // seconds
  end: number;
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'solo' | 'outro';
  confidence: number; // 0-1
}

export interface Chord {
  time: number; // seconds
  chord: string; // e.g., "Cmaj7", "Am", "G7"
  duration: number;
}

export interface Note {
  time: number;
  pitch: string; // e.g., "C4", "A3"
  duration: number;
  velocity: number; // 0-127
}

export interface SongChallenge {
  id: string;
  songId: string;
  songTitle: string;
  artist: string;
  type: 'melody' | 'chords' | 'rhythm' | 'harmony';
  section: { start: number; end: number };
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  creatorId: string;
  plays: number;
  averageScore: number;
}

export interface UserSongProgress {
  userId: string;
  songId: string;
  masteryLevel: number; // 0-100
  sectionsCompleted: string[];
  lastPracticed: number;
  totalPracticeTime: number; // seconds
}

const STORAGE_KEYS = {
  MUSIC_ACCOUNTS: 'keyPerfect_musicAccounts',
  SONG_LIBRARY: 'keyPerfect_songLibrary',
  SONG_ANALYSIS: 'keyPerfect_songAnalysis',
  SONG_PROGRESS: 'keyPerfect_songProgress',
  SONG_CHALLENGES: 'keyPerfect_songChallenges',
};

/**
 * Connect music account
 */
export async function connectMusicAccount(
  platform: MusicPlatform,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // In production: OAuth flow to Spotify/Apple Music
    // const auth = await authenticateWith(platform);

    const account: MusicAccount = {
      platform,
      userId,
      username: `user_${userId}`,
      accessToken: `mock_token_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
      expiresAt: Date.now() + (3600 * 1000), // 1 hour
      connected: true,
    };

    const accounts = await getMusicAccounts(userId);
    accounts.push(account);

    await AsyncStorage.setItem(
      `${STORAGE_KEYS.MUSIC_ACCOUNTS}_${userId}`,
      JSON.stringify(accounts)
    );

    return { success: true };
  } catch (error) {
    console.error('Error connecting music account:', error);
    return { success: false, error: 'Connection failed' };
  }
}

/**
 * Get connected music accounts
 */
export async function getMusicAccounts(userId: string): Promise<MusicAccount[]> {
  try {
    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.MUSIC_ACCOUNTS}_${userId}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading music accounts:', error);
  }
  return [];
}

/**
 * Search songs from user's library
 */
export async function searchUserSongs(
  userId: string,
  query: string
): Promise<Song[]> {
  try {
    // In production: Call Spotify/Apple Music API
    // const results = await platform.search(query, { type: 'track' });

    // Mock popular songs
    const mockSongs: Song[] = [
      {
        id: 'song_1',
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        album: 'A Night at the Opera',
        duration: 354,
        artworkUrl: 'https://placeholder.com/album1.jpg',
      },
      {
        id: 'song_2',
        title: 'Stairway to Heaven',
        artist: 'Led Zeppelin',
        album: 'Led Zeppelin IV',
        duration: 482,
        artworkUrl: 'https://placeholder.com/album2.jpg',
      },
      {
        id: 'song_3',
        title: 'Hotel California',
        artist: 'Eagles',
        album: 'Hotel California',
        duration: 391,
        artworkUrl: 'https://placeholder.com/album3.jpg',
      },
      {
        id: 'song_4',
        title: 'Sweet Child O\' Mine',
        artist: 'Guns N\' Roses',
        album: 'Appetite for Destruction',
        duration: 356,
        artworkUrl: 'https://placeholder.com/album4.jpg',
      },
      {
        id: 'song_5',
        title: 'Wonderwall',
        artist: 'Oasis',
        album: '(What\'s the Story) Morning Glory?',
        duration: 258,
        artworkUrl: 'https://placeholder.com/album5.jpg',
      },
    ];

    return mockSongs.filter(song =>
      song.title.toLowerCase().includes(query.toLowerCase()) ||
      song.artist.toLowerCase().includes(query.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching songs:', error);
    return [];
  }
}

/**
 * Analyze song structure
 */
export async function analyzeSong(songId: string): Promise<SongAnalysis> {
  try {
    // Check cache first
    const cached = await AsyncStorage.getItem(`${STORAGE_KEYS.SONG_ANALYSIS}_${songId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // In production: Use Spotify Audio Analysis API or ML model
    // const analysis = await spotifyApi.getAudioAnalysis(songId);

    // Mock analysis
    const analysis: SongAnalysis = {
      songId,
      key: 'C Major',
      tempo: 120,
      timeSignature: '4/4',
      sections: [
        { start: 0, end: 15, type: 'intro', confidence: 0.95 },
        { start: 15, end: 45, type: 'verse', confidence: 0.92 },
        { start: 45, end: 75, type: 'chorus', confidence: 0.98 },
        { start: 75, end: 105, type: 'verse', confidence: 0.93 },
        { start: 105, end: 135, type: 'chorus', confidence: 0.97 },
        { start: 135, end: 165, type: 'bridge', confidence: 0.89 },
        { start: 165, end: 195, type: 'chorus', confidence: 0.96 },
        { start: 195, end: 210, type: 'outro', confidence: 0.94 },
      ],
      chordProgression: [
        { time: 0, chord: 'C', duration: 4 },
        { time: 4, chord: 'Am', duration: 4 },
        { time: 8, chord: 'F', duration: 4 },
        { time: 12, chord: 'G', duration: 4 },
      ],
      melodyNotes: [
        { time: 0, pitch: 'C4', duration: 0.5, velocity: 80 },
        { time: 0.5, pitch: 'D4', duration: 0.5, velocity: 75 },
        { time: 1, pitch: 'E4', duration: 1, velocity: 85 },
      ],
      difficulty: 'medium',
    };

    // Cache analysis
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.SONG_ANALYSIS}_${songId}`,
      JSON.stringify(analysis)
    );

    return analysis;
  } catch (error) {
    console.error('Error analyzing song:', error);
    throw error;
  }
}

/**
 * Get practice modes for song
 */
export async function getSongPracticeModes(songId: string): Promise<{
  melody: boolean;
  chords: boolean;
  rhythm: boolean;
  harmony: boolean;
}> {
  const analysis = await analyzeSong(songId);

  return {
    melody: analysis.melodyNotes.length > 0,
    chords: analysis.chordProgression.length > 0,
    rhythm: true, // Always available
    harmony: analysis.melodyNotes.length > 10, // Needs sufficient notes
  };
}

/**
 * Create song challenge
 */
export async function createSongChallenge(
  userId: string,
  songId: string,
  type: SongChallenge['type'],
  section: { start: number; end: number }
): Promise<SongChallenge> {
  const song = (await searchUserSongs(userId, ''))[0]; // Mock
  const analysis = await analyzeSong(songId);

  const challenge: SongChallenge = {
    id: `challenge_${Date.now()}`,
    songId,
    songTitle: song.title,
    artist: song.artist,
    type,
    section,
    difficulty: analysis.difficulty,
    creatorId: userId,
    plays: 0,
    averageScore: 0,
  };

  const challenges = await getSongChallenges();
  challenges.push(challenge);

  await AsyncStorage.setItem(
    STORAGE_KEYS.SONG_CHALLENGES,
    JSON.stringify(challenges)
  );

  return challenge;
}

/**
 * Get song challenges
 */
export async function getSongChallenges(): Promise<SongChallenge[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SONG_CHALLENGES);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading song challenges:', error);
  }
  return [];
}

/**
 * Get user's song progress
 */
export async function getUserSongProgress(
  userId: string,
  songId: string
): Promise<UserSongProgress> {
  try {
    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.SONG_PROGRESS}_${userId}_${songId}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading song progress:', error);
  }

  return {
    userId,
    songId,
    masteryLevel: 0,
    sectionsCompleted: [],
    lastPracticed: Date.now(),
    totalPracticeTime: 0,
  };
}

/**
 * Update song progress
 */
export async function updateSongProgress(
  userId: string,
  songId: string,
  updates: Partial<UserSongProgress>
): Promise<void> {
  const progress = await getUserSongProgress(userId, songId);

  const updated = {
    ...progress,
    ...updates,
    lastPracticed: Date.now(),
  };

  await AsyncStorage.setItem(
    `${STORAGE_KEYS.SONG_PROGRESS}_${userId}_${songId}`,
    JSON.stringify(updated)
  );
}

/**
 * Get recommended songs based on skill level
 */
export async function getRecommendedSongs(userId: string): Promise<Song[]> {
  // In production: Use ML to recommend songs matching user's skill level
  const mockRecommendations = await searchUserSongs(userId, '');
  return mockRecommendations.slice(0, 10);
}

/**
 * Get artist practice profile
 */
export async function getArtistProfile(artistName: string): Promise<{
  artist: string;
  techniques: string[];
  commonIntervals: string[];
  commonChords: string[];
  difficulty: string;
  recommendedSongs: Song[];
}> {
  // Mock artist profile
  return {
    artist: artistName,
    techniques: ['vibrato', 'melisma', 'falsetto'],
    commonIntervals: ['Perfect 5th', 'Major 3rd', 'Octave'],
    commonChords: ['Cmaj7', 'Am7', 'Fmaj7', 'G7'],
    difficulty: 'intermediate',
    recommendedSongs: await searchUserSongs('mock_user', artistName),
  };
}

/**
 * Get trending song challenges
 */
export async function getTrendingSongChallenges(): Promise<SongChallenge[]> {
  const challenges = await getSongChallenges();

  return challenges
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10);
}

/**
 * Export song to practice session
 */
export async function exportSongToPracticeSession(
  songId: string,
  section: SongSection
): Promise<{
  questions: any[];
  duration: number;
  difficulty: string;
}> {
  const analysis = await analyzeSong(songId);

  const chordQuestions = analysis.chordProgression
    .filter(chord => chord.time >= section.start && chord.time <= section.end)
    .map(chord => ({
      type: 'chord',
      chord: chord.chord,
      time: chord.time,
    }));

  const melodyQuestions = analysis.melodyNotes
    .filter(note => note.time >= section.start && note.time <= section.end)
    .map(note => ({
      type: 'note',
      pitch: note.pitch,
      time: note.time,
    }));

  return {
    questions: [...chordQuestions, ...melodyQuestions],
    duration: section.end - section.start,
    difficulty: analysis.difficulty,
  };
}
