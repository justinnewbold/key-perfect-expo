import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import {
  getAllEvents,
  getActiveEvents,
  getUpcomingEvents,
  Event,
  getEventCountdown,
  joinEvent,
} from '../services/events';

export default function EventsCalendarScreen() {
  const navigation = useNavigation<any>();
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEvents();
    // Refresh every minute to update countdowns
    const interval = setInterval(loadEvents, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadEvents = async () => {
    setRefreshing(true);
    const [active, upcoming] = await Promise.all([getActiveEvents(), getUpcomingEvents()]);
    setActiveEvents(active);
    setUpcomingEvents(upcoming);
    setRefreshing(false);
  };

  const handleJoinEvent = async (event: Event) => {
    const userId = 'current_user'; // Mock
    const joined = await joinEvent(event.id, userId);
    if (joined) {
      // Navigate to event screen
      navigation.navigate('LiveEvent', { eventId: event.id });
    }
  };

  return (
    <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadEvents} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Live Events</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Active Events */}
        {activeEvents.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="radio-button-on" size={20} color={COLORS.success} />
              <Text style={styles.sectionTitle}>Active Now</Text>
            </View>
            {activeEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => handleJoinEvent(event)}
                isActive
              />
            ))}
          </>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color={COLORS.info} />
              <Text style={styles.sectionTitle}>Coming Soon</Text>
            </View>
            {upcomingEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => handleJoinEvent(event)}
                isActive={false}
              />
            ))}
          </>
        )}

        {activeEvents.length === 0 && upcomingEvents.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No events scheduled</Text>
            <Text style={styles.emptySubtext}>Check back soon for new events!</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

interface EventCardProps {
  event: Event;
  onPress: () => void;
  isActive: boolean;
}

function EventCard({ event, onPress, isActive }: EventCardProps) {
  const [countdown, setCountdown] = useState(getEventCountdown(event));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getEventCountdown(event));
    }, 1000);
    return () => clearInterval(interval);
  }, [event]);

  const getEventTypeColor = (): string => {
    switch (event.type) {
      case 'daily_rush':
        return COLORS.warning;
      case 'weekend_championship':
        return COLORS.primary;
      case 'theme_week':
        return COLORS.info;
      case 'premium_tournament':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getEventTypeIcon = (): string => {
    switch (event.type) {
      case 'daily_rush':
        return 'flash';
      case 'weekend_championship':
        return 'trophy';
      case 'theme_week':
        return 'musical-notes';
      case 'premium_tournament':
        return 'star';
      default:
        return 'calendar';
    }
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <GlassCard style={[styles.eventCard, isActive && styles.eventCardActive]}>
        {/* Header */}
        <View style={styles.eventHeader}>
          <View style={[styles.eventTypebadge, { backgroundColor: getEventTypeColor() + '30' }]}>
            <Ionicons name={getEventTypeIcon() as any} size={16} color={getEventTypeColor()} />
            <Text style={[styles.eventTypText, { color: getEventTypeColor() }]}>
              {event.type.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          {event.isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={12} color={COLORS.warning} />
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
          )}
        </View>

        {/* Title & Description */}
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDescription}>{event.description}</Text>

        {/* Countdown */}
        <View style={styles.countdownContainer}>
          <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.countdownText}>
            {isActive ? 'Ends in: ' : 'Starts in: '}
            {countdown.days > 0 && `${countdown.days}d `}
            {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.eventStats}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={16} color={COLORS.textSecondary} />
            <Text style={styles.statText}>{event.participantCount} joined</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="game-controller" size={16} color={COLORS.textSecondary} />
            <Text style={styles.statText}>{event.mode}</Text>
          </View>
          {event.entryFee > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="cash" size={16} color={COLORS.success} />
              <Text style={styles.statText}>${event.entryFee.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* Rewards */}
        <View style={styles.rewardsContainer}>
          <Text style={styles.rewardsLabel}>Rewards:</Text>
          <View style={styles.rewardsList}>
            {event.rewards.map((reward, index) => (
              <View key={index} style={styles.rewardBadge}>
                <Text style={styles.rewardText}>
                  {reward.type === 'xp' && `${reward.amount} XP`}
                  {reward.type === 'badge' && '🏆 Badge'}
                  {reward.type === 'pack' && '🎁 Pack'}
                  {reward.type === 'cash' && `💰 $${reward.amount}`}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={[styles.joinButton, isActive && styles.joinButtonActive]} onPress={onPress}>
          <Text style={styles.joinButtonText}>{isActive ? 'Join Now' : 'View Details'}</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </GlassCard>
    </TouchableOpacity>
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
    marginBottom: SPACING.lg,
  },
  backButton: {
    padding: SPACING.xs,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  eventCardActive: {
    borderWidth: 2,
    borderColor: COLORS.success + '80',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  eventTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  eventTypText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  premiumText: {
    color: COLORS.warning,
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  eventDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  countdownText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  eventStats: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  rewardsContainer: {
    marginBottom: SPACING.md,
  },
  rewardsLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  rewardsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  rewardBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  rewardText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '600',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary + '40',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  joinButtonActive: {
    backgroundColor: COLORS.success + '40',
  },
  joinButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
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
});
