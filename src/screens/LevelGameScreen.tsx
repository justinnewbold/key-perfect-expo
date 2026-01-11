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
import { useNavigation, useRoute } from '@react-navigation/native';
import { safeHaptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../utils/haptics';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useApp } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { LEVELS, XP_PER_CORRECT, FIRST_TRY_BONUS, PERFECT_LEVEL_BONUS } from '../types';
import { shuffleArray, getRandomNote, parseChordName } from '../utils/audioUtils';

const { width } = Dimensions.get('window');

type GameState = 'playing' | 'correct' | 'incorrect' | 'complete';

export default function LevelGameScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { levelId } = route.params;
  const level = LEVELS.find(l => l.id === levelId);

  // Handle invalid levelId
  if (!level) {
    navigation.goBack();
    return null;
  }

  const { recordAnswer, addXP, completeLevel, settings, playNote, playChord } = useApp();

  const [gameState, setGameState] = useState<GameState>('playing');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [streak, setStreak] = useState(0);
  const [shakeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));

  // Track timeouts for cleanup
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, []);

  // Helper to create tracked timeouts
  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      callback();
      // Remove from refs after execution
      timeoutRefs.current = timeoutRefs.current.filter(id => id !== timeoutId);
    }, delay);
    timeoutRefs.current.push(timeoutId);
    return timeoutId;
  }, []);

  // Play sound for the given answer
  const playSoundForAnswer = useCallback(async (answer: string) => {
    try {
      if (level.type === 'single-note') {
        await playNote(answer);
      } else {
        const { root, type } = parseChordName(answer);
        await playChord(root, type);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [level.type, playNote, playChord]);

  // Generate a new question
  const generateQuestion = useCallback(async () => {
    const answer = level.keys[Math.floor(Math.random() * level.keys.length)];
    setCorrectAnswer(answer);

    // Generate wrong options
    const wrongOptions = level.keys.filter(k => k !== answer);
    const shuffledWrong = shuffleArray(wrongOptions).slice(0, Math.min(3, wrongOptions.length));
    // Ensure uniqueness in options
    const allOptions = shuffleArray([...new Set([answer, ...shuffledWrong])]);
    setOptions(allOptions);

    setGameState('playing');
    setSelectedAnswer(null);
    // Sound will only play when user taps the play button
  }, [level]);

  // Initialize first question
  useEffect(() => {
    generateQuestion();
  }, []);

  // Handle answer selection
  const handleAnswer = async (answer: string) => {
    if (gameState !== 'playing') return;

    setSelectedAnswer(answer);
    const isCorrect = answer === correctAnswer;

    if (settings.hapticFeedback) {
      safeHaptics.impactAsync(
        isCorrect ? ImpactFeedbackStyle.Light : ImpactFeedbackStyle.Heavy
      );
    }

    if (isCorrect) {
      setGameState('correct');
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      setStreak(prev => prev + 1);

      // Calculate XP
      let xp = XP_PER_CORRECT;
      if (streak === 0) xp += FIRST_TRY_BONUS;
      setXpEarned(prev => prev + xp);

      // Animate success
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();

      // Record the answer
      await recordAnswer(true, correctAnswer, level.type === 'single-note' ? 'note' : 'chord');
    } else {
      setGameState('incorrect');
      setScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
      setStreak(0);

      // Animate shake
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();

      // Record the answer
      await recordAnswer(false, correctAnswer, level.type === 'single-note' ? 'note' : 'chord');
    }

    // Check if level is complete
    const totalAnswered = score.correct + score.incorrect + 1;
    if (totalAnswered >= level.requiredTotal) {
      safeSetTimeout(() => {
        setGameState('complete');
      }, 1000);
    } else {
      // Next question after delay
      safeSetTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
        generateQuestion();
      }, 1500);
    }
  };

  // Replay current sound
  const handleReplay = async () => {
    if (settings.hapticFeedback) {
      safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
    }

    await playSoundForAnswer(correctAnswer);
  };

  // Complete level
  const handleComplete = async () => {
    const passed = score.correct >= level.requiredCorrect;
    const perfect = score.correct === level.requiredTotal;

    if (passed) {
      let totalXP = xpEarned + level.xpReward;
      if (perfect) totalXP += PERFECT_LEVEL_BONUS;
      
      await addXP(totalXP);
      await completeLevel(level.id, score.correct, level.requiredTotal);
    }

    navigation.goBack();
  };

  // Render complete screen
  if (gameState === 'complete') {
    const passed = score.correct >= level.requiredCorrect;
    const perfect = score.correct === level.requiredTotal;
    const accuracy = Math.round((score.correct / level.requiredTotal) * 100);

    return (
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.container}
      >
        <View style={styles.completeContainer}>
          <GlassCard style={styles.completeCard}>
            <View style={styles.completeHeader}>
              {passed ? (
                <>
                  <Ionicons 
                    name={perfect ? "trophy" : "checkmark-circle"} 
                    size={64} 
                    color={perfect ? COLORS.warning : COLORS.success} 
                  />
                  <Text style={styles.completeTitle}>
                    {perfect ? 'Perfect!' : 'Level Complete!'}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="close-circle" size={64} color={COLORS.error} />
                  <Text style={styles.completeTitle}>Try Again</Text>
                </>
              )}
            </View>

            <View style={styles.completeStats}>
              <View style={styles.completeStat}>
                <Text style={styles.completeStatValue}>{score.correct}/{level.requiredTotal}</Text>
                <Text style={styles.completeStatLabel}>Correct</Text>
              </View>
              <View style={styles.completeStat}>
                <Text style={styles.completeStatValue}>{accuracy}%</Text>
                <Text style={styles.completeStatLabel}>Accuracy</Text>
              </View>
              <View style={styles.completeStat}>
                <Text style={[styles.completeStatValue, { color: COLORS.warning }]}>
                  +{xpEarned + (passed ? level.xpReward : 0) + (perfect ? PERFECT_LEVEL_BONUS : 0)}
                </Text>
                <Text style={styles.completeStatLabel}>XP</Text>
              </View>
            </View>

            {/* Stars */}
            <View style={styles.starsRow}>
              {[1, 2, 3].map((star) => {
                const earned = accuracy >= (star === 1 ? 60 : star === 2 ? 80 : 100);
                return (
                  <Ionicons
                    key={star}
                    name={earned ? "star" : "star-outline"}
                    size={40}
                    color={earned ? COLORS.warning : COLORS.textMuted}
                  />
                );
              })}
            </View>

            <View style={styles.completeActions}>
              {!passed && (
                <Button
                  title="Try Again"
                  onPress={() => {
                    setScore({ correct: 0, incorrect: 0 });
                    setCurrentQuestion(0);
                    setXpEarned(0);
                    setStreak(0);
                    generateQuestion();
                  }}
                  variant="primary"
                  size="lg"
                  style={{ flex: 1 }}
                />
              )}
              <Button
                title="Back to Levels"
                onPress={handleComplete}
                variant={passed ? "primary" : "secondary"}
                size="lg"
                style={{ flex: 1 }}
              />
            </View>
          </GlassCard>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.levelTitle}>Level {level.id}</Text>
          <Text style={styles.levelName}>{level.name}</Text>
        </View>
        <View style={styles.scoreDisplay}>
          <Text style={styles.scoreText}>{score.correct}/{level.requiredTotal}</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((score.correct + score.incorrect) / level.requiredTotal) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestion + 1} of {level.requiredTotal}
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Play Button */}
        <Animated.View style={[styles.playSection, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity style={styles.playButton} onPress={handleReplay}>
            <Ionicons name="play" size={48} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.playHint}>Tap to replay</Text>
        </Animated.View>

        {/* Streak */}
        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color={COLORS.warning} />
            <Text style={styles.streakText}>{streak} streak!</Text>
          </View>
        )}

        {/* Answer Options */}
        <Animated.View 
          style={[
            styles.optionsContainer,
            { transform: [{ translateX: shakeAnim }] }
          ]}
        >
          {options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === correctAnswer;
            const showResult = gameState !== 'playing';

            let buttonStyle = styles.optionButton;
            if (showResult) {
              if (isCorrect) {
                buttonStyle = { ...buttonStyle, ...styles.optionCorrect };
              } else if (isSelected && !isCorrect) {
                buttonStyle = { ...buttonStyle, ...styles.optionIncorrect };
              }
            }

            return (
              <TouchableOpacity
                key={index}
                style={buttonStyle}
                onPress={() => handleAnswer(option)}
                disabled={gameState !== 'playing'}
              >
                <Text style={styles.optionText}>{option}</Text>
                {showResult && isCorrect && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                )}
                {showResult && isSelected && !isCorrect && (
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </View>

      {/* XP Display */}
      {xpEarned > 0 && (
        <View style={styles.xpBadge}>
          <Ionicons name="star" size={16} color={COLORS.warning} />
          <Text style={styles.xpText}>+{xpEarned} XP</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: 60,
    paddingBottom: SPACING.md,
  },
  headerCenter: {
    alignItems: 'center',
  },
  levelTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  levelName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreDisplay: {
    backgroundColor: COLORS.glass,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  scoreText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.xpGradientStart,
    borderRadius: BORDER_RADIUS.full,
  },
  progressText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  playSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  playButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.glass,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  playHint: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: SPACING.sm,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  streakText: {
    color: COLORS.warning,
    fontSize: 16,
    fontWeight: '600',
  },
  optionsContainer: {
    gap: SPACING.sm,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  optionCorrect: {
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.success,
  },
  optionIncorrect: {
    backgroundColor: COLORS.errorLight,
    borderColor: COLORS.error,
  },
  optionText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  xpBadge: {
    position: 'absolute',
    top: 120,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  xpText: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.md,
  },
  completeCard: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  completeHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  completeTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: SPACING.sm,
  },
  completeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: SPACING.lg,
  },
  completeStat: {
    alignItems: 'center',
  },
  completeStatValue: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  completeStatLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  completeActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
});
