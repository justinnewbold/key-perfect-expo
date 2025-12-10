import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { safeHaptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../utils/haptics';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useApp } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { 
  GAME_MODES, 
  ALL_NOTES, 
  MAJOR_CHORDS, 
  INTERVALS, 
  XP_PER_CORRECT,
  DAILY_CHALLENGE_BONUS,
} from '../types';
import { shuffleArray, getWrongOptions } from '../utils/audioUtils';

const { width } = Dimensions.get('window');

type ActiveMode = 'speed' | 'survival' | 'daily' | 'intervals' | null;

interface SpeedGameState {
  score: number;
  currentItem: string;
  options: string[];
  timeLeft: number;
}

interface SurvivalGameState {
  score: number;
  lives: number;
  currentItem: string;
  options: string[];
  level: number;
}

interface IntervalGameState {
  score: number;
  attempts: number;
  currentInterval: typeof INTERVALS[0];
  options: typeof INTERVALS;
}

export default function GameModesScreen() {
  const navigation = useNavigation<any>();
  const { recordAnswer, addXP, updateStats, stats, settings } = useApp();

  const [activeMode, setActiveMode] = useState<ActiveMode>(null);
  
  // Speed Mode
  const [speedState, setSpeedState] = useState<SpeedGameState | null>(null);
  const [speedAnswerState, setSpeedAnswerState] = useState<'default' | 'correct' | 'incorrect'>('default');
  const speedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Survival Mode
  const [survivalState, setSurvivalState] = useState<SurvivalGameState | null>(null);
  const [survivalAnswerState, setSurvivalAnswerState] = useState<'default' | 'correct' | 'incorrect'>('default');

  // Intervals Mode
  const [intervalState, setIntervalState] = useState<IntervalGameState | null>(null);
  const [intervalAnswerState, setIntervalAnswerState] = useState<'default' | 'correct' | 'incorrect'>('default');

  // Daily Challenge
  const [dailyCompleted, setDailyCompleted] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (speedTimerRef.current) clearInterval(speedTimerRef.current);
    };
  }, []);

  // Speed Mode Timer
  useEffect(() => {
    if (activeMode === 'speed' && speedState && speedState.timeLeft > 0) {
      speedTimerRef.current = setInterval(() => {
        setSpeedState(prev => {
          if (!prev) return prev;
          if (prev.timeLeft <= 1) {
            if (speedTimerRef.current) clearInterval(speedTimerRef.current);
            return { ...prev, timeLeft: 0 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);

      return () => {
        if (speedTimerRef.current) clearInterval(speedTimerRef.current);
      };
    }
  }, [activeMode, speedState?.timeLeft]);

  // Start Speed Mode
  const startSpeedMode = () => {
    const items = ALL_NOTES;
    const currentItem = items[Math.floor(Math.random() * items.length)];
    const options = shuffleArray([currentItem, ...getWrongOptions(currentItem, items, 3)]);

    setSpeedState({
      score: 0,
      currentItem,
      options,
      timeLeft: 30,
    });
    setSpeedAnswerState('default');
    setActiveMode('speed');
  };

  // Speed Mode Answer
  const handleSpeedAnswer = async (answer: string) => {
    if (!speedState || speedAnswerState !== 'default' || speedState.timeLeft === 0) return;

    const isCorrect = answer === speedState.currentItem;
    setSpeedAnswerState(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      safeHaptics.notification(NotificationFeedbackType.Success);
      await addXP(XP_PER_CORRECT);
    } else {
      safeHaptics.notification(NotificationFeedbackType.Error);
    }

    await recordAnswer(isCorrect, speedState.currentItem, 'note');

    setTimeout(() => {
      const items = ALL_NOTES;
      const currentItem = items[Math.floor(Math.random() * items.length)];
      const options = shuffleArray([currentItem, ...getWrongOptions(currentItem, items, 3)]);

      setSpeedState(prev => prev ? {
        ...prev,
        score: prev.score + (isCorrect ? 1 : 0),
        currentItem,
        options,
      } : prev);
      setSpeedAnswerState('default');
    }, 300);
  };

  // End Speed Mode
  const endSpeedMode = async () => {
    if (speedState && speedState.score > stats.speedModeHighScore) {
      await updateStats({ speedModeHighScore: speedState.score });
    }
    setActiveMode(null);
    setSpeedState(null);
  };

  // Start Survival Mode
  const startSurvivalMode = () => {
    const items = ALL_NOTES;
    const currentItem = items[Math.floor(Math.random() * items.length)];
    const options = shuffleArray([currentItem, ...getWrongOptions(currentItem, items, 3)]);

    setSurvivalState({
      score: 0,
      lives: 3,
      currentItem,
      options,
      level: 1,
    });
    setSurvivalAnswerState('default');
    setActiveMode('survival');
  };

  // Survival Mode Answer
  const handleSurvivalAnswer = async (answer: string) => {
    if (!survivalState || survivalAnswerState !== 'default' || survivalState.lives === 0) return;

    const isCorrect = answer === survivalState.currentItem;
    setSurvivalAnswerState(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      safeHaptics.notification(NotificationFeedbackType.Success);
      await addXP(XP_PER_CORRECT);
    } else {
      safeHaptics.notification(NotificationFeedbackType.Error);
    }

    await recordAnswer(isCorrect, survivalState.currentItem, 'note');

    setTimeout(() => {
      const newLives = survivalState.lives - (isCorrect ? 0 : 1);
      const newScore = survivalState.score + (isCorrect ? 1 : 0);
      const newLevel = Math.floor(newScore / 5) + 1;

      if (newLives === 0) {
        // Game over
        if (newScore > stats.survivalModeHighScore) {
          updateStats({ survivalModeHighScore: newScore });
        }
        setSurvivalState(prev => prev ? { ...prev, lives: 0, score: newScore } : prev);
        return;
      }

      // Use more difficult items at higher levels
      const items = newLevel >= 3 ? [...ALL_NOTES, ...MAJOR_CHORDS.slice(0, 4)] : ALL_NOTES;
      const currentItem = items[Math.floor(Math.random() * items.length)];
      const numOptions = Math.min(3 + Math.floor(newLevel / 2), 5);
      const options = shuffleArray([currentItem, ...getWrongOptions(currentItem, items, numOptions)]);

      setSurvivalState({
        ...survivalState,
        score: newScore,
        lives: newLives,
        currentItem,
        options,
        level: newLevel,
      });
      setSurvivalAnswerState('default');
    }, 500);
  };

  // Start Intervals Mode
  const startIntervalsMode = () => {
    const shuffledIntervals = shuffleArray([...INTERVALS]);
    const currentInterval = shuffledIntervals[0];
    const options = shuffleArray(shuffledIntervals.slice(0, 4));

    setIntervalState({
      score: 0,
      attempts: 0,
      currentInterval,
      options,
    });
    setIntervalAnswerState('default');
    setActiveMode('intervals');
  };

  // Intervals Mode Answer
  const handleIntervalAnswer = async (interval: typeof INTERVALS[0]) => {
    if (!intervalState || intervalAnswerState !== 'default') return;

    const isCorrect = interval.name === intervalState.currentInterval.name;
    setIntervalAnswerState(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      safeHaptics.notification(NotificationFeedbackType.Success);
      await addXP(XP_PER_CORRECT);
    } else {
      safeHaptics.notification(NotificationFeedbackType.Error);
    }

    await recordAnswer(isCorrect, intervalState.currentInterval.name, 'interval');

    setTimeout(() => {
      const shuffledIntervals = shuffleArray([...INTERVALS]);
      const currentInterval = shuffledIntervals[0];
      const options = shuffleArray(shuffledIntervals.slice(0, 4));

      setIntervalState({
        ...intervalState,
        score: intervalState.score + (isCorrect ? 1 : 0),
        attempts: intervalState.attempts + 1,
        currentInterval,
        options,
      });
      setIntervalAnswerState('default');
    }, 500);
  };

  // Complete Daily Challenge
  const completeDailyChallenge = async () => {
    await addXP(DAILY_CHALLENGE_BONUS);
    await updateStats({ 
      dailyChallengesCompleted: stats.dailyChallengesCompleted + 1 
    });
    setDailyCompleted(true);
  };

  // Play Sound
  const playSound = () => {
    safeHaptics.impact(ImpactFeedbackStyle.Light);
    // TODO: Implement actual audio playback
  };

  // Render Mode Selection
  if (!activeMode) {
    return (
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Game Modes</Text>
          </View>

          <View style={styles.modesGrid}>
            {GAME_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={[styles.modeCard, { borderColor: mode.color + '40' }]}
                onPress={() => {
                  if (mode.id === 'speed') startSpeedMode();
                  else if (mode.id === 'survival') startSurvivalMode();
                  else if (mode.id === 'intervals') startIntervalsMode();
                  else if (mode.id === 'daily') setActiveMode('daily');
                }}
              >
                <View style={[styles.modeIcon, { backgroundColor: mode.color + '30' }]}>
                  <Ionicons name={mode.icon as any} size={32} color={mode.color} />
                </View>
                <Text style={styles.modeName}>{mode.name}</Text>
                <Text style={styles.modeDesc}>{mode.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* High Scores */}
          <GlassCard style={styles.highScoresCard}>
            <Text style={styles.highScoresTitle}>🏆 High Scores</Text>
            <View style={styles.highScoresRow}>
              <View style={styles.highScoreItem}>
                <Text style={styles.highScoreValue}>{stats.speedModeHighScore}</Text>
                <Text style={styles.highScoreLabel}>Speed</Text>
              </View>
              <View style={styles.highScoreItem}>
                <Text style={styles.highScoreValue}>{stats.survivalModeHighScore}</Text>
                <Text style={styles.highScoreLabel}>Survival</Text>
              </View>
              <View style={styles.highScoreItem}>
                <Text style={styles.highScoreValue}>{stats.dailyChallengesCompleted}</Text>
                <Text style={styles.highScoreLabel}>Daily</Text>
              </View>
            </View>
          </GlassCard>

          <View style={{ height: 100 }} />
        </ScrollView>
      </LinearGradient>
    );
  }

  // Render Speed Mode
  if (activeMode === 'speed' && speedState) {
    if (speedState.timeLeft === 0) {
      return (
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
          <View style={styles.resultContainer}>
            <Text style={styles.resultEmoji}>⏱️</Text>
            <Text style={styles.resultTitle}>Time's Up!</Text>
            <Text style={styles.resultScore}>Score: {speedState.score}</Text>
            {speedState.score > stats.speedModeHighScore && (
              <Text style={styles.newHighScore}>🎉 New High Score!</Text>
            )}
            <Button
              title="Play Again"
              onPress={startSpeedMode}
              variant="primary"
              size="lg"
              style={{ marginTop: SPACING.lg }}
            />
            <Button
              title="Back to Modes"
              onPress={endSpeedMode}
              variant="secondary"
              size="lg"
              style={{ marginTop: SPACING.sm }}
            />
          </View>
        </LinearGradient>
      );
    }

    return (
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
        <View style={styles.gameContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={endSpeedMode}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Speed Mode</Text>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>{speedState.timeLeft}s</Text>
            </View>
          </View>

          <Text style={styles.scoreText}>Score: {speedState.score}</Text>

          <TouchableOpacity style={styles.playButton} onPress={playSound}>
            <LinearGradient
              colors={[COLORS.speedMode, COLORS.speedMode + 'CC']}
              style={styles.playButtonGradient}
            >
              <Ionicons name="play" size={48} color={COLORS.textPrimary} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.answersGrid}>
            {speedState.options.map((option) => {
              let buttonStyle = styles.answerButton;
              if (speedAnswerState === 'correct' && option === speedState.currentItem) {
                buttonStyle = { ...buttonStyle, ...styles.answerCorrect };
              } else if (speedAnswerState === 'incorrect' && option === speedState.currentItem) {
                buttonStyle = { ...buttonStyle, ...styles.answerCorrect };
              }
              
              return (
                <TouchableOpacity
                  key={option}
                  style={buttonStyle}
                  onPress={() => handleSpeedAnswer(option)}
                  disabled={speedAnswerState !== 'default'}
                >
                  <Text style={styles.answerText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Render Survival Mode
  if (activeMode === 'survival' && survivalState) {
    if (survivalState.lives === 0) {
      return (
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
          <View style={styles.resultContainer}>
            <Text style={styles.resultEmoji}>💀</Text>
            <Text style={styles.resultTitle}>Game Over</Text>
            <Text style={styles.resultScore}>Score: {survivalState.score}</Text>
            <Text style={styles.resultLevel}>Level Reached: {survivalState.level}</Text>
            {survivalState.score > stats.survivalModeHighScore && (
              <Text style={styles.newHighScore}>🎉 New High Score!</Text>
            )}
            <Button
              title="Play Again"
              onPress={startSurvivalMode}
              variant="primary"
              size="lg"
              style={{ marginTop: SPACING.lg }}
            />
            <Button
              title="Back to Modes"
              onPress={() => setActiveMode(null)}
              variant="secondary"
              size="lg"
              style={{ marginTop: SPACING.sm }}
            />
          </View>
        </LinearGradient>
      );
    }

    return (
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
        <View style={styles.gameContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setActiveMode(null)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Survival</Text>
            <View style={styles.livesBadge}>
              {[...Array(survivalState.lives)].map((_, i) => (
                <Ionicons key={i} name="heart" size={20} color={COLORS.error} />
              ))}
            </View>
          </View>

          <View style={styles.survivalStats}>
            <Text style={styles.scoreText}>Score: {survivalState.score}</Text>
            <Text style={styles.levelText}>Level {survivalState.level}</Text>
          </View>

          <TouchableOpacity style={styles.playButton} onPress={playSound}>
            <LinearGradient
              colors={[COLORS.survivalMode, COLORS.survivalMode + 'CC']}
              style={styles.playButtonGradient}
            >
              <Ionicons name="play" size={48} color={COLORS.textPrimary} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.answersGrid}>
            {survivalState.options.map((option) => {
              let buttonStyle = styles.answerButton;
              if (survivalAnswerState === 'correct' && option === survivalState.currentItem) {
                buttonStyle = { ...buttonStyle, ...styles.answerCorrect };
              } else if (survivalAnswerState === 'incorrect' && option === survivalState.currentItem) {
                buttonStyle = { ...buttonStyle, ...styles.answerCorrect };
              }
              
              return (
                <TouchableOpacity
                  key={option}
                  style={buttonStyle}
                  onPress={() => handleSurvivalAnswer(option)}
                  disabled={survivalAnswerState !== 'default'}
                >
                  <Text style={styles.answerText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Render Intervals Mode
  if (activeMode === 'intervals' && intervalState) {
    const accuracy = intervalState.attempts > 0 
      ? Math.round((intervalState.score / intervalState.attempts) * 100) 
      : 0;

    return (
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
        <View style={styles.gameContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setActiveMode(null)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Intervals</Text>
            <Text style={styles.accuracyBadge}>{accuracy}%</Text>
          </View>

          <Text style={styles.scoreText}>
            Score: {intervalState.score} / {intervalState.attempts}
          </Text>

          <TouchableOpacity style={styles.playButton} onPress={playSound}>
            <LinearGradient
              colors={[COLORS.intervals, COLORS.intervals + 'CC']}
              style={styles.playButtonGradient}
            >
              <Ionicons name="play" size={48} color={COLORS.textPrimary} />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.instruction}>Identify the interval</Text>

          <View style={styles.intervalOptions}>
            {intervalState.options.map((interval) => {
              let buttonStyle = styles.intervalButton;
              if (intervalAnswerState === 'correct' && interval.name === intervalState.currentInterval.name) {
                buttonStyle = { ...buttonStyle, ...styles.answerCorrect };
              } else if (intervalAnswerState === 'incorrect' && interval.name === intervalState.currentInterval.name) {
                buttonStyle = { ...buttonStyle, ...styles.answerCorrect };
              }
              
              return (
                <TouchableOpacity
                  key={interval.name}
                  style={buttonStyle}
                  onPress={() => handleIntervalAnswer(interval)}
                  disabled={intervalAnswerState !== 'default'}
                >
                  <Text style={styles.intervalName}>{interval.name}</Text>
                  <Text style={styles.intervalHint}>{interval.songExample}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Render Daily Challenge
  if (activeMode === 'daily') {
    if (dailyCompleted) {
      return (
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
          <View style={styles.resultContainer}>
            <Text style={styles.resultEmoji}>🎉</Text>
            <Text style={styles.resultTitle}>Daily Complete!</Text>
            <Text style={styles.resultScore}>+{DAILY_CHALLENGE_BONUS} XP</Text>
            <Button
              title="Back to Modes"
              onPress={() => {
                setActiveMode(null);
                setDailyCompleted(false);
              }}
              variant="primary"
              size="lg"
              style={{ marginTop: SPACING.lg }}
            />
          </View>
        </LinearGradient>
      );
    }

    return (
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
        <View style={styles.gameContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setActiveMode(null)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Daily Challenge</Text>
            <View style={{ width: 24 }} />
          </View>

          <GlassCard style={styles.dailyCard}>
            <Ionicons name="calendar" size={48} color={COLORS.dailyChallenge} />
            <Text style={styles.dailyTitle}>Today's Challenge</Text>
            <Text style={styles.dailyDesc}>
              Complete 10 note identifications to earn bonus XP!
            </Text>
            <Text style={styles.dailyReward}>Reward: +{DAILY_CHALLENGE_BONUS} XP</Text>
          </GlassCard>

          <Button
            title="Complete Challenge"
            onPress={completeDailyChallenge}
            variant="primary"
            size="lg"
            style={{ marginTop: SPACING.lg }}
          />
        </View>
      </LinearGradient>
    );
  }

  return null;
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
  modesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  modeCard: {
    width: (width - SPACING.md * 2 - SPACING.sm) / 2,
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  modeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modeName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modeDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  highScoresCard: {
    marginTop: SPACING.lg,
  },
  highScoresTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  highScoresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  highScoreItem: {
    alignItems: 'center',
  },
  highScoreValue: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  highScoreLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  timerBadge: {
    backgroundColor: COLORS.speedMode,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  timerText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  livesBadge: {
    flexDirection: 'row',
    gap: 4,
  },
  accuracyBadge: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  scoreText: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  survivalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  levelText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  playButton: {
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  playButtonGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  instruction: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  answersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  answerButton: {
    width: (width - SPACING.md * 2 - SPACING.sm) / 2,
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.md,
    alignItems: 'center',
  },
  answerText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  answerCorrect: {
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.success,
  },
  intervalOptions: {
    gap: SPACING.sm,
  },
  intervalButton: {
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.md,
  },
  intervalName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  intervalHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  resultEmoji: {
    fontSize: 72,
    marginBottom: SPACING.md,
  },
  resultTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  resultScore: {
    color: COLORS.textSecondary,
    fontSize: 20,
  },
  resultLevel: {
    color: COLORS.textMuted,
    fontSize: 16,
    marginTop: SPACING.xs,
  },
  newHighScore: {
    color: COLORS.warning,
    fontSize: 18,
    fontWeight: '600',
    marginTop: SPACING.md,
  },
  dailyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  dailyTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: SPACING.md,
  },
  dailyDesc: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  dailyReward: {
    color: COLORS.warning,
    fontSize: 18,
    fontWeight: '600',
    marginTop: SPACING.md,
  },
});
