import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useApp } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { usePitchDetection, notesMatch } from '../hooks/usePitchDetection';
import { safeHaptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../utils/haptics';
import { NATURAL_NOTES, ALL_NOTES, XP_PER_CORRECT } from '../types';

const { width } = Dimensions.get('window');

interface RoundResult {
  targetNote: string;
  userNote: string | null;
  isCorrect: boolean;
  centsOff: number;
}

export default function SingBackScreen() {
  const navigation = useNavigation<any>();
  const { playNote, recordAnswer, addXP, settings } = useApp();
  const pitchDetection = usePitchDetection();

  const [gameState, setGameState] = useState<'setup' | 'playing' | 'listening' | 'feedback' | 'results'>('setup');
  const [currentNote, setCurrentNote] = useState<string>('');
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds] = useState(10);
  const [countdown, setCountdown] = useState(0);
  const [useAllNotes, setUseAllNotes] = useState(false);
  const [listenTime, setListenTime] = useState(3); // seconds to listen

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const micScaleAnim = useRef(new Animated.Value(1)).current;
  const isEvaluatingRef = useRef(false); // Prevent multiple evaluatePitch calls
  const isMountedRef = useRef(true); // Track mount state for cleanup
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]); // Track timeouts for cleanup

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, []);

  // Helper to create tracked timeouts that auto-cleanup
  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        callback();
      }
      timeoutRefs.current = timeoutRefs.current.filter(id => id !== timeoutId);
    }, delay);
    timeoutRefs.current.push(timeoutId);
    return timeoutId;
  }, []);

  // Pulse animation for listening indicator
  useEffect(() => {
    if (gameState === 'listening') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(micScaleAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(micScaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      micScaleAnim.setValue(1);
    }
  }, [gameState, micScaleAnim]);

  // Handle countdown during listening
  useEffect(() => {
    if (gameState === 'listening' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'listening' && countdown === 0 && !isEvaluatingRef.current) {
      // Time's up, evaluate the pitch (only once)
      isEvaluatingRef.current = true;
      evaluatePitch();
    }
  }, [gameState, countdown]);

  // Simulate pitch updates while listening
  useEffect(() => {
    if (gameState === 'listening' && pitchDetection.isRecording) {
      const interval = setInterval(() => {
        pitchDetection.simulatePitchDetection(currentNote);
      }, 200);
      return () => clearInterval(interval);
    }
  }, [gameState, pitchDetection.isRecording, currentNote]);

  const startGame = async () => {
    // Request mic permission first
    const hasPermission = await pitchDetection.requestPermission();
    if (!hasPermission) {
      alert('Microphone permission is required for Sing Back mode');
      return;
    }

    setRoundResults([]);
    setCurrentRound(1);
    setGameState('playing');
    playNextNote();
  };

  const playNextNote = async () => {
    const notes = useAllNotes ? ALL_NOTES : NATURAL_NOTES;
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    setCurrentNote(randomNote);
    setGameState('playing');

    // Play the note
    await playNote(randomNote);
    safeHaptics.impactAsync(ImpactFeedbackStyle.Medium);

    // Wait a moment then start listening
    safeSetTimeout(() => {
      startListening();
    }, 1500);
  };

  const startListening = async () => {
    isEvaluatingRef.current = false; // Reset evaluation flag for new round
    setGameState('listening');
    setCountdown(listenTime);
    pitchDetection.clearHistory();
    await pitchDetection.startListening();
  };

  const evaluatePitch = async () => {
    await pitchDetection.stopListening();

    const avgPitch = pitchDetection.getAveragePitch();
    const userNote = avgPitch?.noteName || null;
    const targetNoteName = currentNote; // Already just the note name without octave
    const isCorrect = userNote ? notesMatch(userNote, targetNoteName) : false;
    const centsOff = avgPitch?.cents || 0;

    const result: RoundResult = {
      targetNote: currentNote,
      userNote,
      isCorrect,
      centsOff,
    };

    setRoundResults(prev => [...prev, result]);

    if (isCorrect) {
      safeHaptics.notificationAsync(NotificationFeedbackType.Success);
      await addXP(XP_PER_CORRECT);
      await recordAnswer(true, currentNote, 'note');
    } else {
      safeHaptics.notificationAsync(NotificationFeedbackType.Error);
      await recordAnswer(false, currentNote, 'note');
    }

    setGameState('feedback');

    // Continue to next round or show results
    safeSetTimeout(() => {
      if (currentRound >= totalRounds) {
        setGameState('results');
      } else {
        setCurrentRound(currentRound + 1);
        playNextNote();
      }
    }, 2000);
  };

  const replayNote = async () => {
    await playNote(currentNote);
    safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
  };

  const getAccuracy = () => {
    if (roundResults.length === 0) return 0;
    const correct = roundResults.filter(r => r.isCorrect).length;
    return Math.round((correct / roundResults.length) * 100);
  };

  const getPitchIndicatorColor = () => {
    if (!pitchDetection.currentPitch) return COLORS.textMuted;
    const cents = Math.abs(pitchDetection.currentPitch.cents);
    if (cents < 10) return COLORS.success;
    if (cents < 25) return COLORS.warning;
    return COLORS.error;
  };

  // Setup screen
  if (gameState === 'setup') {
    return (
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Sing Back</Text>
            <View style={{ width: 24 }} />
          </View>

          <GlassCard style={styles.introCard}>
            <View style={styles.micIconLarge}>
              <Ionicons name="mic" size={48} color={COLORS.xpGradientStart} />
            </View>
            <Text style={styles.introTitle}>Train Your Ear & Voice</Text>
            <Text style={styles.introText}>
              Listen to a note, then sing or hum it back. The app will detect your pitch
              and tell you how accurate you are!
            </Text>
          </GlassCard>

          <GlassCard style={styles.settingsCard}>
            <Text style={styles.settingTitle}>Note Selection</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleOption, !useAllNotes && styles.toggleOptionActive]}
                onPress={() => setUseAllNotes(false)}
                accessibilityLabel="Natural notes only"
                accessibilityRole="button"
              >
                <Text style={[styles.toggleText, !useAllNotes && styles.toggleTextActive]}>
                  Natural (C D E F G A B)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleOption, useAllNotes && styles.toggleOptionActive]}
                onPress={() => setUseAllNotes(true)}
                accessibilityLabel="All notes including sharps"
                accessibilityRole="button"
              >
                <Text style={[styles.toggleText, useAllNotes && styles.toggleTextActive]}>
                  All Notes
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.settingTitle, { marginTop: SPACING.md }]}>Listen Time</Text>
            <View style={styles.toggleRow}>
              {[3, 5, 7].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeOption, listenTime === time && styles.timeOptionActive]}
                  onPress={() => setListenTime(time)}
                  accessibilityLabel={`${time} seconds`}
                  accessibilityRole="button"
                >
                  <Text style={[styles.timeText, listenTime === time && styles.timeTextActive]}>
                    {time}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>

          <Button
            title="Start Training"
            onPress={startGame}
            variant="primary"
            size="lg"
            icon={<Ionicons name="mic" size={20} color={COLORS.textPrimary} />}
          />

          {pitchDetection.hasPermission === false && (
            <Text style={styles.permissionWarning}>
              Microphone permission required
            </Text>
          )}
        </View>
      </LinearGradient>
    );
  }

  // Results screen
  if (gameState === 'results') {
    const accuracy = getAccuracy();
    const correct = roundResults.filter(r => r.isCorrect).length;

    return (
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={{ width: 24 }} />
            <Text style={styles.title}>Results</Text>
            <View style={{ width: 24 }} />
          </View>

          <GlassCard style={styles.resultsCard}>
            <Text style={styles.resultEmoji}>
              {accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪'}
            </Text>
            <Text style={styles.resultTitle}>
              {accuracy >= 80 ? 'Excellent!' : accuracy >= 60 ? 'Good Job!' : 'Keep Practicing!'}
            </Text>
            <Text style={styles.resultAccuracy}>{accuracy}%</Text>
            <Text style={styles.resultSubtitle}>
              {correct} of {totalRounds} correct
            </Text>
          </GlassCard>

          <GlassCard style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Round Breakdown</Text>
            {roundResults.map((result, index) => (
              <View key={index} style={styles.breakdownRow}>
                <Text style={styles.breakdownNumber}>{index + 1}</Text>
                <Text style={styles.breakdownNote}>{result.targetNote}</Text>
                <Text style={styles.breakdownArrow}>→</Text>
                <Text style={[
                  styles.breakdownUserNote,
                  result.isCorrect ? styles.correctText : styles.incorrectText,
                ]}>
                  {result.userNote || '—'}
                </Text>
                <Ionicons
                  name={result.isCorrect ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={result.isCorrect ? COLORS.success : COLORS.error}
                />
              </View>
            ))}
          </GlassCard>

          <View style={styles.actionButtons}>
            <Button
              title="Try Again"
              onPress={startGame}
              variant="primary"
              size="lg"
            />
            <Button
              title="Back to Menu"
              onPress={() => navigation.goBack()}
              variant="outline"
              size="lg"
            />
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Game screen (playing, listening, feedback)
  return (
    <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
      <View style={styles.gameContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              pitchDetection.stopListening();
              navigation.goBack();
            }}
            accessibilityLabel="Exit game"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.roundText}>Round {currentRound}/{totalRounds}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentRound / totalRounds) * 100}%` },
            ]}
          />
        </View>

        {/* Main game area */}
        <View style={styles.gameArea}>
          {gameState === 'playing' && (
            <>
              <Text style={styles.instruction}>Listen to this note...</Text>
              <View style={styles.noteDisplay}>
                <Text style={styles.noteText}>{currentNote}</Text>
              </View>
              <TouchableOpacity
                style={styles.replayButton}
                onPress={replayNote}
                accessibilityLabel="Replay note"
                accessibilityRole="button"
              >
                <Ionicons name="refresh" size={24} color={COLORS.textPrimary} />
                <Text style={styles.replayText}>Replay</Text>
              </TouchableOpacity>
            </>
          )}

          {gameState === 'listening' && (
            <>
              <Text style={styles.instruction}>Now sing it back!</Text>
              <Animated.View
                style={[
                  styles.micContainer,
                  { transform: [{ scale: micScaleAnim }] },
                ]}
              >
                <View style={[styles.micCircle, { borderColor: getPitchIndicatorColor() }]}>
                  <Ionicons name="mic" size={48} color={getPitchIndicatorColor()} />
                </View>
              </Animated.View>
              <Text style={styles.countdown}>{countdown}</Text>
              {pitchDetection.currentPitch && (
                <View style={styles.pitchInfo}>
                  <Text style={styles.detectedNote}>
                    {pitchDetection.currentPitch.noteName}
                  </Text>
                  <Text style={[
                    styles.centsOff,
                    { color: getPitchIndicatorColor() },
                  ]}>
                    {pitchDetection.currentPitch.cents > 0 ? '+' : ''}
                    {pitchDetection.currentPitch.cents} cents
                  </Text>
                </View>
              )}
            </>
          )}

          {gameState === 'feedback' && (
            <>
              <View style={styles.feedbackContainer}>
                {roundResults[roundResults.length - 1]?.isCorrect ? (
                  <>
                    <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
                    <Text style={[styles.feedbackText, { color: COLORS.success }]}>
                      Correct!
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="close-circle" size={80} color={COLORS.error} />
                    <Text style={[styles.feedbackText, { color: COLORS.error }]}>
                      The note was {currentNote}
                    </Text>
                  </>
                )}
              </View>
            </>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>
              {roundResults.filter(r => r.isCorrect).length}
            </Text>
            <Text style={styles.statLabel}>Correct</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{getAccuracy()}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.error }]}>
              {roundResults.filter(r => !r.isCorrect).length}
            </Text>
            <Text style={styles.statLabel}>Missed</Text>
          </GlassCard>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
    paddingTop: 60,
  },
  gameContent: {
    flex: 1,
    padding: SPACING.md,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  roundText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  introCard: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  micIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.xpGradientStart + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  introTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  introText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  settingsCard: {
    marginBottom: SPACING.lg,
  },
  settingTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  toggleOption: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  toggleOptionActive: {
    backgroundColor: COLORS.xpGradientStart,
  },
  toggleText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: COLORS.textPrimary,
  },
  timeOption: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  timeOptionActive: {
    backgroundColor: COLORS.xpGradientStart,
  },
  timeText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  timeTextActive: {
    color: COLORS.textPrimary,
  },
  permissionWarning: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 2,
    marginBottom: SPACING.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.xpGradientStart,
    borderRadius: 2,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instruction: {
    color: COLORS.textSecondary,
    fontSize: 18,
    marginBottom: SPACING.lg,
  },
  noteDisplay: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.xpGradientStart + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.large,
  },
  noteText: {
    color: COLORS.textPrimary,
    fontSize: 48,
    fontWeight: 'bold',
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  replayText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  micContainer: {
    marginBottom: SPACING.lg,
  },
  micCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    ...SHADOWS.large,
  },
  countdown: {
    color: COLORS.textPrimary,
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  pitchInfo: {
    alignItems: 'center',
  },
  detectedNote: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  centsOff: {
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackContainer: {
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  resultsCard: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  },
  resultTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  resultAccuracy: {
    color: COLORS.xpGradientStart,
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: SPACING.sm,
  },
  resultSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  breakdownCard: {
    marginBottom: SPACING.lg,
  },
  breakdownTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  breakdownNumber: {
    color: COLORS.textMuted,
    fontSize: 12,
    width: 24,
  },
  breakdownNote: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  breakdownArrow: {
    color: COLORS.textMuted,
    marginHorizontal: SPACING.sm,
  },
  breakdownUserNote: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginRight: SPACING.sm,
  },
  correctText: {
    color: COLORS.success,
  },
  incorrectText: {
    color: COLORS.error,
  },
  actionButtons: {
    gap: SPACING.sm,
  },
});
