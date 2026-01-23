import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  EVENTS: 'keyPerfect_events',
  EVENT_HISTORY: 'keyPerfect_eventHistory',
  EVENT_PARTICIPANTS: 'keyPerfect_eventParticipants',
};

export type EventType = 'daily_rush' | 'weekend_championship' | 'theme_week' | 'premium_tournament';
export type EventStatus = 'upcoming' | 'active' | 'ended';

export interface Event {
  id: string;
  type: EventType;
  title: string;
  description: string;
  startTime: number; // timestamp
  endTime: number; // timestamp
  status: EventStatus;
  mode: string; // game mode (speed, survival, etc)
  rewards: {
    type: 'xp' | 'badge' | 'pack' | 'cash';
    amount: number;
    description: string;
  }[];
  entryFee: number; // 0 for free
  isPremium: boolean;
  theme?: string; // e.g., 'Jazz Week', 'Classical Challenge'
  participantCount: number;
  leaderboard: EventLeaderboardEntry[];
  maxParticipants?: number;
}

export interface EventLeaderboardEntry {
  userId: string;
  displayName: string;
  avatarEmoji: string;
  score: number;
  rank: number;
  submittedAt: number;
}

export interface EventParticipation {
  eventId: string;
  userId: string;
  score: number;
  rank: number;
  rewardsClaimed: boolean;
}

export interface EventSchedule {
  type: EventType;
  title: string;
  description: string;
  dayOfWeek?: number; // 0-6 (Sunday-Saturday) for weekly events
  hour: number; // 0-23
  minute: number; // 0-59
  duration: number; // hours
  mode: string;
  rewards: Event['rewards'];
  entryFee: number;
  isPremium: boolean;
  theme?: string;
}

// Event schedule configuration
const EVENT_SCHEDULES: EventSchedule[] = [
  // DAILY EVENTS (Different times for variety)
  {
    type: 'daily_rush',
    title: 'Morning Rush',
    description: 'Start your day with a 30-minute speed challenge!',
    hour: 7, // 7 AM
    minute: 0,
    duration: 0.5,
    mode: 'speed',
    rewards: [
      { type: 'xp', amount: 300, description: '1.5x XP multiplier' },
      { type: 'badge', amount: 1, description: 'Early Bird badge' },
    ],
    entryFee: 0,
    isPremium: false,
  },
  {
    type: 'daily_rush',
    title: 'Lunch Break Challenge',
    description: 'Quick 30-minute practice during lunch!',
    hour: 12, // 12 PM
    minute: 0,
    duration: 0.5,
    mode: 'intervals',
    rewards: [
      { type: 'xp', amount: 300, description: '1.5x XP multiplier' },
      { type: 'badge', amount: 1, description: 'Lunch Warrior badge' },
    ],
    entryFee: 0,
    isPremium: false,
  },
  {
    type: 'daily_rush',
    title: 'Daily Happy Hour',
    description: '1-hour rush for 2x XP and special rewards!',
    hour: 18, // 6 PM
    minute: 0,
    duration: 1,
    mode: 'speed',
    rewards: [
      { type: 'xp', amount: 500, description: '2x XP multiplier' },
      { type: 'badge', amount: 1, description: 'Happy Hour Champion badge' },
    ],
    entryFee: 0,
    isPremium: false,
  },
  {
    type: 'daily_rush',
    title: 'Night Owl Session',
    description: 'Late night practice for XP boost!',
    hour: 22, // 10 PM
    minute: 0,
    duration: 1,
    mode: 'survival',
    rewards: [
      { type: 'xp', amount: 400, description: '1.75x XP multiplier' },
      { type: 'badge', amount: 1, description: 'Night Owl badge' },
    ],
    entryFee: 0,
    isPremium: false,
  },

  // WEEKEND EVENTS
  {
    type: 'weekend_championship',
    title: 'Saturday Showdown',
    description: '24-hour weekend tournament!',
    dayOfWeek: 6, // Saturday
    hour: 10,
    minute: 0,
    duration: 24,
    mode: 'speed',
    rewards: [
      { type: 'xp', amount: 1500, description: 'Huge XP boost' },
      { type: 'badge', amount: 1, description: 'Saturday Champion badge' },
    ],
    entryFee: 0,
    isPremium: false,
  },
  {
    type: 'weekend_championship',
    title: 'Sunday Marathon',
    description: '48-hour endurance challenge!',
    dayOfWeek: 0, // Sunday
    hour: 0,
    minute: 0,
    duration: 48,
    mode: 'survival',
    rewards: [
      { type: 'xp', amount: 2500, description: 'Massive XP boost' },
      { type: 'pack', amount: 1, description: 'Premium Instrument Pack' },
      { type: 'badge', amount: 1, description: 'Marathon Champion badge' },
    ],
    entryFee: 0,
    isPremium: false,
  },

  // WEEKLY THEME EVENTS (Rotate themes)
  {
    type: 'theme_week',
    title: 'Jazz Week Challenge',
    description: 'Master jazz progressions and improvisations!',
    dayOfWeek: 1, // Monday
    hour: 0,
    minute: 0,
    duration: 168, // 7 days
    mode: 'progressions',
    theme: 'jazz',
    rewards: [
      { type: 'xp', amount: 3000, description: 'Weekly XP bonus' },
      { type: 'badge', amount: 1, description: 'Jazz Master badge' },
      { type: 'pack', amount: 1, description: 'Jazz Legends Pack' },
    ],
    entryFee: 0,
    isPremium: false,
  },
  {
    type: 'theme_week',
    title: 'Classical Week',
    description: 'Perfect your classical music theory!',
    dayOfWeek: 2, // Tuesday (different week)
    hour: 0,
    minute: 0,
    duration: 168,
    mode: 'scales',
    theme: 'classical',
    rewards: [
      { type: 'xp', amount: 3000, description: 'Weekly XP bonus' },
      { type: 'badge', amount: 1, description: 'Classical Virtuoso badge' },
      { type: 'pack', amount: 1, description: 'Classical Masters Pack' },
    ],
    entryFee: 0,
    isPremium: false,
  },
  {
    type: 'theme_week',
    title: 'Rock & Roll Week',
    description: 'Learn power chords and rock progressions!',
    dayOfWeek: 3, // Wednesday
    hour: 0,
    minute: 0,
    duration: 168,
    mode: 'chords',
    theme: 'rock',
    rewards: [
      { type: 'xp', amount: 3000, description: 'Weekly XP bonus' },
      { type: 'badge', amount: 1, description: 'Rock Legend badge' },
      { type: 'pack', amount: 1, description: 'Rock Icons Pack' },
    ],
    entryFee: 0,
    isPremium: false,
  },

  // SPECIAL EVENTS
  {
    type: 'weekend_championship',
    title: 'Friday Night Frenzy',
    description: 'Kickoff the weekend with intense competition!',
    dayOfWeek: 5, // Friday
    hour: 19,
    minute: 0,
    duration: 3,
    mode: 'intervals',
    rewards: [
      { type: 'xp', amount: 800, description: 'Friday XP Bonus' },
      { type: 'badge', amount: 1, description: 'Friday Frenzy badge' },
    ],
    entryFee: 0,
    isPremium: false,
  },
  {
    type: 'weekend_championship',
    title: 'Midweek Grind',
    description: 'Wednesday warrior challenge!',
    dayOfWeek: 3, // Wednesday
    hour: 18,
    minute: 0,
    duration: 2,
    mode: 'speed',
    rewards: [
      { type: 'xp', amount: 600, description: 'Midweek XP Bonus' },
      { type: 'badge', amount: 1, description: 'Midweek Warrior badge' },
    ],
    entryFee: 0,
    isPremium: false,
  },

  // PREMIUM TOURNAMENTS
  {
    type: 'premium_tournament',
    title: 'Pro Circuit Monthly',
    description: '$100 prize pool! Top 10 split the winnings.',
    dayOfWeek: 0, // First day of month
    hour: 0,
    minute: 0,
    duration: 168, // 7 days
    mode: 'intervals',
    rewards: [
      { type: 'cash', amount: 100, description: 'Prize pool split among top 10' },
      { type: 'badge', amount: 1, description: 'Pro Circuit Champion' },
      { type: 'pack', amount: 1, description: 'Exclusive Pro Pack' },
    ],
    entryFee: 4.99,
    isPremium: true,
  },
  {
    type: 'premium_tournament',
    title: 'Elite Masters Cup',
    description: '$250 grand prize! Winner takes all.',
    dayOfWeek: 6, // First Saturday of quarter
    hour: 0,
    minute: 0,
    duration: 168 * 2, // 14 days
    mode: 'survival',
    rewards: [
      { type: 'cash', amount: 250, description: 'Winner takes all!' },
      { type: 'badge', amount: 1, description: 'Elite Masters Champion' },
      { type: 'pack', amount: 3, description: '3x Exclusive Elite Packs' },
    ],
    entryFee: 9.99,
    isPremium: true,
  },
];

/**
 * Generate upcoming events based on schedule
 */
export async function generateUpcomingEvents(): Promise<Event[]> {
  const events: Event[] = [];
  const now = Date.now();

  for (const schedule of EVENT_SCHEDULES) {
    const nextOccurrence = getNextEventOccurrence(schedule, now);
    if (nextOccurrence) {
      const event: Event = {
        id: `event_${schedule.type}_${nextOccurrence}`,
        type: schedule.type,
        title: schedule.title,
        description: schedule.description,
        startTime: nextOccurrence,
        endTime: nextOccurrence + schedule.duration * 60 * 60 * 1000,
        status: getEventStatus(nextOccurrence, nextOccurrence + schedule.duration * 60 * 60 * 1000, now),
        mode: schedule.mode,
        rewards: schedule.rewards,
        entryFee: schedule.entryFee,
        isPremium: schedule.isPremium,
        theme: schedule.theme,
        participantCount: Math.floor(Math.random() * 200) + 50, // Mock
        leaderboard: [],
      };
      events.push(event);
    }
  }

  return events.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Get next occurrence of scheduled event
 */
function getNextEventOccurrence(schedule: EventSchedule, fromTime: number): number | null {
  const now = new Date(fromTime);

  if (schedule.type === 'daily_rush') {
    // Daily at specified hour
    const next = new Date(now);
    next.setHours(schedule.hour, schedule.minute, 0, 0);

    if (next.getTime() <= now.getTime()) {
      // Already passed today, schedule for tomorrow
      next.setDate(next.getDate() + 1);
    }

    return next.getTime();
  }

  if (schedule.type === 'weekend_championship' && schedule.dayOfWeek !== undefined) {
    // Weekly on specific day
    const next = new Date(now);
    const currentDay = next.getDay();
    const daysUntilEvent = (schedule.dayOfWeek - currentDay + 7) % 7;

    next.setDate(next.getDate() + daysUntilEvent);
    next.setHours(schedule.hour, schedule.minute, 0, 0);

    if (next.getTime() <= now.getTime()) {
      // Already passed this week, schedule for next week
      next.setDate(next.getDate() + 7);
    }

    return next.getTime();
  }

  if (schedule.type === 'theme_week' && schedule.dayOfWeek !== undefined) {
    // Theme weeks (e.g., every Monday)
    const next = new Date(now);
    const currentDay = next.getDay();
    const daysUntilEvent = (schedule.dayOfWeek - currentDay + 7) % 7;

    next.setDate(next.getDate() + daysUntilEvent);
    next.setHours(schedule.hour, schedule.minute, 0, 0);

    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 7);
    }

    return next.getTime();
  }

  if (schedule.type === 'premium_tournament') {
    // First day of next month
    const next = new Date(now);
    next.setMonth(next.getMonth() + 1);
    next.setDate(1);
    next.setHours(schedule.hour, schedule.minute, 0, 0);

    if (next.getTime() <= now.getTime()) {
      next.setMonth(next.getMonth() + 1);
    }

    return next.getTime();
  }

  return null;
}

/**
 * Get event status based on current time
 */
function getEventStatus(startTime: number, endTime: number, currentTime: number): EventStatus {
  if (currentTime < startTime) return 'upcoming';
  if (currentTime >= startTime && currentTime < endTime) return 'active';
  return 'ended';
}

/**
 * Get all events (active and upcoming)
 */
export async function getAllEvents(): Promise<Event[]> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
    if (cached) {
      const { events, timestamp } = JSON.parse(cached);
      // Cache valid for 1 hour
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        return events;
      }
    }

    const events = await generateUpcomingEvents();

    // Cache events
    await AsyncStorage.setItem(
      STORAGE_KEYS.EVENTS,
      JSON.stringify({ events, timestamp: Date.now() })
    );

    return events;
  } catch (error) {
    console.error('Error loading events:', error);
    return [];
  }
}

/**
 * Get active events
 */
export async function getActiveEvents(): Promise<Event[]> {
  const events = await getAllEvents();
  return events.filter(e => e.status === 'active');
}

/**
 * Get upcoming events
 */
export async function getUpcomingEvents(): Promise<Event[]> {
  const events = await getAllEvents();
  const now = Date.now();
  return events.filter(e => e.status === 'upcoming' && e.startTime - now < 7 * 24 * 60 * 60 * 1000);
}

/**
 * Get event by ID
 */
export async function getEventById(eventId: string): Promise<Event | null> {
  const events = await getAllEvents();
  return events.find(e => e.id === eventId) || null;
}

/**
 * Join event
 */
export async function joinEvent(eventId: string, userId: string): Promise<boolean> {
  try {
    const event = await getEventById(eventId);
    if (!event) return false;

    if (event.status !== 'active' && event.status !== 'upcoming') {
      return false;
    }

    if (event.maxParticipants && event.participantCount >= event.maxParticipants) {
      return false;
    }

    // In a real app, this would handle payment for premium events
    if (event.isPremium && event.entryFee > 0) {
      console.log(`Mock payment: $${event.entryFee} for ${event.title}`);
    }

    // Add user to participants
    event.participantCount++;

    return true;
  } catch (error) {
    console.error('Error joining event:', error);
    return false;
  }
}

/**
 * Submit score to event
 */
export async function submitEventScore(
  eventId: string,
  userId: string,
  displayName: string,
  avatarEmoji: string,
  score: number
): Promise<boolean> {
  try {
    const event = await getEventById(eventId);
    if (!event || event.status !== 'active') return false;

    // Check if user already has a score
    const existingEntry = event.leaderboard.find(e => e.userId === userId);

    if (existingEntry) {
      // Update if new score is higher
      if (score > existingEntry.score) {
        existingEntry.score = score;
        existingEntry.submittedAt = Date.now();
      }
    } else {
      // Add new entry
      event.leaderboard.push({
        userId,
        displayName,
        avatarEmoji,
        score,
        rank: 0,
        submittedAt: Date.now(),
      });
    }

    // Sort and update ranks
    event.leaderboard.sort((a, b) => b.score - a.score);
    event.leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // In a real app, save to backend
    console.log(`Event score submitted: ${score} for event ${eventId}`);

    return true;
  } catch (error) {
    console.error('Error submitting event score:', error);
    return false;
  }
}

/**
 * Get user's event participation
 */
export async function getUserEventParticipation(userId: string, eventId: string): Promise<EventParticipation | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.EVENT_PARTICIPANTS);
    if (data) {
      const participations: EventParticipation[] = JSON.parse(data);
      return participations.find(p => p.userId === userId && p.eventId === eventId) || null;
    }
  } catch (error) {
    console.error('Error loading event participation:', error);
  }
  return null;
}

/**
 * Get event countdown
 */
export function getEventCountdown(event: Event): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isActive: boolean;
} {
  const now = Date.now();
  const targetTime = event.status === 'upcoming' ? event.startTime : event.endTime;
  const diff = Math.max(0, targetTime - now);

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((diff % (60 * 1000)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    isActive: event.status === 'active',
  };
}

/**
 * Get event history for user
 */
export async function getUserEventHistory(userId: string): Promise<EventParticipation[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.EVENT_HISTORY);
    if (data) {
      const history: EventParticipation[] = JSON.parse(data);
      return history.filter(p => p.userId === userId);
    }
  } catch (error) {
    console.error('Error loading event history:', error);
  }
  return [];
}

/**
 * Claim event rewards
 */
export async function claimEventRewards(eventId: string, userId: string): Promise<boolean> {
  try {
    const participation = await getUserEventParticipation(userId, eventId);
    if (!participation || participation.rewardsClaimed) {
      return false;
    }

    const event = await getEventById(eventId);
    if (!event || event.status !== 'ended') {
      return false;
    }

    // Check if user is in reward range (e.g., top 10)
    if (participation.rank > 10) {
      return false;
    }

    participation.rewardsClaimed = true;

    // In a real app, grant rewards to user
    console.log(`Rewards claimed for event ${eventId}: rank ${participation.rank}`);

    return true;
  } catch (error) {
    console.error('Error claiming rewards:', error);
    return false;
  }
}

/**
 * Get upcoming events for notification scheduling
 */
export async function getUpcomingEventsForNotifications(withinHours: number = 24): Promise<Event[]> {
  const events = await getAllEvents();
  const now = Date.now();
  const cutoff = now + withinHours * 60 * 60 * 1000;

  return events.filter(e => e.status === 'upcoming' && e.startTime <= cutoff);
}

/**
 * Check if user should be reminded about an event
 */
export function shouldRemindUser(event: Event, reminderMinutes: number = 15): boolean {
  const now = Date.now();
  const reminderTime = event.startTime - reminderMinutes * 60 * 1000;
  const reminderWindow = 5 * 60 * 1000; // 5-minute window

  return now >= reminderTime && now < reminderTime + reminderWindow;
}

/**
 * Get event statistics
 */
export async function getEventStatistics(): Promise<{
  totalEvents: number;
  activeEvents: number;
  totalParticipants: number;
  avgParticipantsPerEvent: number;
}> {
  const events = await getAllEvents();
  const activeEvents = events.filter(e => e.status === 'active');
  const totalParticipants = events.reduce((sum, e) => sum + e.participantCount, 0);

  return {
    totalEvents: events.length,
    activeEvents: activeEvents.length,
    totalParticipants,
    avgParticipantsPerEvent: events.length > 0 ? totalParticipants / events.length : 0,
  };
}
