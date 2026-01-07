import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useApp } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { safeHaptics } from '../utils/haptics';
import { shareScore } from '../services/sharing';
import { GameSession } from '../types';

type RouteParams = {
  MistakeReview: {
    session: GameSession;
  };
};

export default function MistakeReviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'MistakeReview'>>();
  const { playNote, playChord } = useApp();
  const session = route.params?.session;

  if (!session) {
    return (
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.container}
      >
        <View style={styles.centered}>
          <Text style={styles.errorText}>No session data available</Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="primary"
          />
        </View>
      </LinearGradient>
    );
  }

  const accuracy = session.total > 0
    ? Math.round((session.score / session.total) * 100)
    : 0;

  const handlePlaySound = async (item: string) => {
    safeHaptics.notePlayFeedback();

    // Determine if it's a note, chord, or interval
    if (item.includes('Major') || item.includes('Minor') || item.includes('Dorian') || item.includes('Phrygian')) {
      const [root, type] = item.split(' ');
      await playChord(root, type.toLowerCase());
    } else {
      await playNote(item);
    }
  };

  const handleShare = async () => {
    safeHaptics.mediumTap();
    await shareScore(session.mode, session.score, false);
  };

  const handlePracticeAgain = () => {
    safeHaptics.mediumTap();
    navigation.navigate('GameMode', { mode: session.mode });
  };

  const handleGoHome = () => {
    safeHaptics.lightTap();
    navigation.navigate('HomeMain');
  };

  const getGradeEmoji = () => {
    if (accuracy >= 90) return { emoji: 'A+', color: COLORS.success };
    if (accuracy >= 80) return { emoji: 'A', color: COLORS.success };
    if (accuracy >= 70) return { emoji: 'B', color: '#FFE66D' };
    if (accuracy >= 60) return { emoji: 'C', color: '#e17055' };
    return { emoji: 'D', color: COLORS.error };
  };

  const grade = getGradeEmoji();

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleGoHome}
            style={styles.closeButton}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Session Review</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Score Summary */}
        <GlassCard style={styles.summaryCard}>
          <View style={styles.scoreContainer}>
            <View style={[styles.gradeBadge, { backgroundColor: grade.color + '30' }]}>
              <Text style={[styles.gradeText, { color: grade.color }]}>{grade.emoji}</Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreText}>
                {session.score}/{session.total}
              </Text>
              <Text style={styles.accuracyText}>{accuracy}% accuracy</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.statValue}>{session.score}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="close-circle" size={20} color={COLORS.error} />
              <Text style={styles.statValue}>{session.mistakes.length}</Text>
              <Text style={styles.statLabel}>Mistakes</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={20} color={COLORS.info} />
              <Text style={styles.statValue}>{Math.round(session.duration)}s</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
          </View>
        </GlassCard>

        {/* Mistakes Section */}
        {session.mistakes.length > 0 && (
          <View style={styles.mistakesSection}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="warning" size={18} color="#FFE66D" /> Review Your Mistakes
            </Text>
            <Text style={styles.sectionSubtitle}>
              Tap to hear the correct answer
            </Text>

            {session.mistakes.map((mistake, index) => (
              <TouchableOpacity
                key={index}
                style={styles.mistakeCard}
                onPress={() => handlePlaySound(mistake.correctAnswer)}
                accessibilityLabel={`Mistake ${index + 1}: You answered ${mistake.userAnswer}, correct answer was ${mistake.correctAnswer}`}
                accessibilityRole="button"
                accessibilityHint="Tap to play the correct sound"
              >
                <View style={styles.mistakeHeader}>
                  <View style={styles.mistakeNumber}>
                    <Text style={styles.mistakeNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.mistakeItem}>{mistake.item}</Text>
                  <Ionicons name="play-circle" size={28} color={COLORS.xpGradientStart} />
                </View>
                <View style={styles.mistakeDetails}>
                  <View style={styles.answerRow}>
                    <Ionicons name="close-circle" size={16} color={COLORS.error} />
                    <Text style={styles.yourAnswer}>Your answer: </Text>
                    <Text style={styles.wrongAnswer}>{mistake.userAnswer}</Text>
                  </View>
                  <View style={styles.answerRow}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={styles.correctLabel}>Correct: </Text>
                    <Text style={styles.correctAnswer}>{mistake.correctAnswer}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Perfect Score Message */}
        {session.mistakes.length === 0 && (
          <GlassCard style={styles.perfectCard}>
            <Text style={styles.perfectEmoji}>
              {accuracy === 100 ? '🎉' : '👏'}
            </Text>
            <Text style={styles.perfectTitle}>
              {accuracy === 100 ? 'Perfect Score!' : 'Great Job!'}
            </Text>
            <Text style={styles.perfectSubtitle}>
              {accuracy === 100
                ? 'You got every question right!'
                : 'No mistakes to review. Keep up the good work!'}
            </Text>
          </GlassCard>
        )}

        {/* Tips Section */}
        {session.mistakes.length > 0 && (
          <GlassCard style={styles.tipsCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb" size={20} color="#FFE66D" />
              <Text style={styles.tipTitle}>Improvement Tip</Text>
            </View>
            <Text style={styles.tipText}>
              {getMistakeTip(session.mistakes)}
            </Text>
          </GlassCard>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Practice Again"
            onPress={handlePracticeAgain}
            variant="primary"
            size="lg"
            style={styles.primaryButton}
          />
          <View style={styles.secondaryActions}>
            <Button
              title="Share Score"
              onPress={handleShare}
              variant="outline"
              size="md"
              style={styles.secondaryButton}
              icon={<Ionicons name="share-outline" size={18} color={COLORS.textPrimary} />}
            />
            <Button
              title="Home"
              onPress={handleGoHome}
              variant="ghost"
              size="md"
              style={styles.secondaryButton}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

// Helper function to generate tips based on mistakes
function getMistakeTip(mistakes: GameSession['mistakes']): string {
  if (mistakes.length === 0) return '';

  // Analyze patterns in mistakes
  const mistakeTypes = mistakes.map(m => {
    if (m.correctAnswer.includes('Major') || m.correctAnswer.includes('Minor')) {
      return 'chord';
    }
    if (m.correctAnswer.includes('#') || m.correctAnswer.includes('b')) {
      return 'accidental';
    }
    return 'note';
  });

  const chordMistakes = mistakeTypes.filter(t => t === 'chord').length;
  const accidentalMistakes = mistakeTypes.filter(t => t === 'accidental').length;

  if (chordMistakes > mistakes.length / 2) {
    return 'Focus on listening to the quality of chords. Major chords sound "happy" while minor chords sound "sad" or melancholic.';
  }

  if (accidentalMistakes > mistakes.length / 2) {
    return 'Sharps and flats can be tricky! Try practicing with just accidentals in free practice mode to train your ear.';
  }

  return 'Try slowing down and really listening to the full sound before answering. Quality over speed helps build lasting pitch recognition skills.';
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  summaryCard: {
    marginBottom: SPACING.lg,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  gradeBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  gradeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreText: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  accuracyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.divider,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  mistakesSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: SPACING.md,
  },
  mistakeCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  mistakeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  mistakeNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  mistakeNumberText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  mistakeItem: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  mistakeDetails: {
    paddingLeft: 36,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  yourAnswer: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginLeft: 6,
  },
  wrongAnswer: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '500',
  },
  correctLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginLeft: 6,
  },
  correctAnswer: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '500',
  },
  perfectCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  perfectEmoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  perfectTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  perfectSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  tipsCard: {
    marginBottom: SPACING.lg,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tipTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  tipText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginTop: SPACING.md,
  },
  primaryButton: {
    marginBottom: SPACING.md,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  secondaryButton: {
    flex: 1,
  },
});
