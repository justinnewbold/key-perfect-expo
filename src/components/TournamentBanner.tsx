import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import GlassCard from './GlassCard';
import {
  Tournament,
  getCurrentTournament,
  getTimeUntilTournamentEnd,
  getUserPrize,
} from '../services/leaderboard';

export default function TournamentBanner() {
  const navigation = useNavigation<any>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isEnding: false });
  const [userRank, setUserRank] = useState<number>(0);
  const tournamentRef = useRef<Tournament | null>(null);

  useEffect(() => {
    loadTournament();
  }, []);

  useEffect(() => {
    if (!tournament) return;

    // Store tournament in ref to avoid dependency issues
    tournamentRef.current = tournament;

    const interval = setInterval(() => {
      if (!tournamentRef.current) return;

      const time = getTimeUntilTournamentEnd(tournamentRef.current);
      setTimeLeft(time);

      // If tournament ended, reload to get new one
      if (time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0) {
        loadTournament();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tournament?.id]); // Only re-run when tournament ID changes

  const loadTournament = async () => {
    const currentTournament = await getCurrentTournament();
    setTournament(currentTournament);

    // Find user's rank from tournament leaderboard
    // Use consistent mock rank based on user profile instead of random
    const userEntry = currentTournament.leaderboard.find(e => e.userId === 'current_user');
    const mockUserRank = userEntry ? userEntry.rank : Math.floor(Math.random() * 50) + 1;
    setUserRank(mockUserRank);
  };

  if (!tournament) return null;

  const prize = getUserPrize(userRank);
  const isInPrizeRange = userRank <= 10;

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Leaderboard', { initialTab: 'tournament' })}
      activeOpacity={0.8}
    >
      <GlassCard style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="trophy" size={24} color={COLORS.warning} />
            <Text style={styles.title}>Weekly Tournament</Text>
            {timeLeft.isEnding && (
              <View style={styles.endingBadge}>
                <Text style={styles.endingText}>ENDING SOON!</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>Week {tournament.weekNumber}</Text>
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Ends in:</Text>
          <View style={styles.timerBlocks}>
            {timeLeft.days > 0 && (
              <View style={styles.timerBlock}>
                <Text style={styles.timerValue}>{timeLeft.days}</Text>
                <Text style={styles.timerUnit}>d</Text>
              </View>
            )}
            <View style={styles.timerBlock}>
              <Text style={styles.timerValue}>{String(timeLeft.hours).padStart(2, '0')}</Text>
              <Text style={styles.timerUnit}>h</Text>
            </View>
            <View style={styles.timerBlock}>
              <Text style={styles.timerValue}>{String(timeLeft.minutes).padStart(2, '0')}</Text>
              <Text style={styles.timerUnit}>m</Text>
            </View>
            <View style={styles.timerBlock}>
              <Text style={styles.timerValue}>{String(timeLeft.seconds).padStart(2, '0')}</Text>
              <Text style={styles.timerUnit}>s</Text>
            </View>
          </View>
        </View>

        {/* User Rank & Prize */}
        <View style={styles.rankContainer}>
          <View style={styles.rankInfo}>
            <Text style={styles.rankLabel}>Your Rank:</Text>
            <Text style={[styles.rankValue, isInPrizeRange && styles.rankValuePrize]}>
              #{userRank}
            </Text>
          </View>
          {prize && (
            <View style={styles.prizeInfo}>
              <Text style={styles.prizeBadge}>{prize.badge}</Text>
              <Text style={styles.prizeTitle}>{prize.title}</Text>
            </View>
          )}
        </View>

        {/* CTA */}
        <View style={styles.ctaRow}>
          <Text style={styles.ctaText}>Compete for prizes!</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.warning + '40',
    ...SHADOWS.large,
  },
  header: {
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  endingBadge: {
    backgroundColor: COLORS.error + '40',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  endingText: {
    color: COLORS.error,
    fontSize: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  timerContainer: {
    marginBottom: SPACING.md,
  },
  timerLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  timerBlocks: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  timerBlock: {
    flex: 1,
    backgroundColor: COLORS.cardBackground + '80',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  timerValue: {
    color: COLORS.warning,
    fontSize: 20,
    fontWeight: 'bold',
  },
  timerUnit: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  rankContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.cardBackground + '60',
    borderRadius: BORDER_RADIUS.md,
  },
  rankInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  rankLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  rankValue: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  rankValuePrize: {
    color: COLORS.warning,
  },
  prizeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  prizeBadge: {
    fontSize: 24,
  },
  prizeTitle: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
