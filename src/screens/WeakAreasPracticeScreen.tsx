import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { ScrollView } from '../utils/scrollComponents';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useApp } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { XP_PER_CORRECT } from '../types';
import { shuffleArray, getWrongOptions } from '../utils/audioUtils';
import { safeHaptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../utils/haptics';
import {
  SRSItem,
  SRSRecommendation,
  getRecommendedPractice,
  updateSRSAfterPractice,
  getSessionSummary,
} from '../utils/srs';

interface PracticeState {
  currentIndex: number;
  currentItem: SRSItem;
  options: string[];
  correctCount: number;
  totalCount: number;
  sessionItems: SRSItem[];
  startItems: SRSItem[];
}

export default function WeakAreasPracticeScreen() {
  const navigation = useNavigation<any>();
  const { stats, recordAnswer, addXP, playNote, playChord } = useApp();

  const [recommendation, setRecommendation] = useState<SRSRecommendation | null>(null);
  const [practiceState, setPracticeState] = useState<PracticeState | null>(null);
  const [answerState, setAnswerState] = useState<'default' | 'correct' | 'incorrect'>('default');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const isMountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Load recommendations on mount
  useEffect(() => {
    const rec = getRecommendedPractice(stats, 10);
    setRecommendation(rec);
  }, [stats]);

  // Start practice session
  const startPractice = useCallback(() => {
    if (!recommendation || recommendation.items.length === 0) return;

    const items = [...recommendation.items];
    const firstItem = items[0];
    const options = generateOptions(firstItem);

    setPracticeState({
      currentIndex: 0,
      currentItem: firstItem,
      options,
      correctCount: 0,
      totalCount: 0,
      sessionItems: items,
      startItems: [...items], // Clone for comparison
    });
    setAnswerState('default');
    setSelectedAnswer(null);
  }, [recommendation]);

  // Generate answer options for an item
  const generateOptions = (item: SRSItem): string[] => {
    const allItems = recommendation?.items.map(i => i.item) || [];
    const wrongOptions = getWrongOptions(item.item, allItems, 3);
    return shuffleArray([item.item, ...wrongOptions]);
  };

  // Play sound for current item
  const playSound = useCallback(async () => {
    if (!practiceState) return;

    safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
    const item = practiceState.currentItem;

    try {
      if (item.type === 'note') {
        await playNote(item.item);
      } else if (item.type === 'chord') {
        const parts = item.item.split(' ');
        const root = parts[0];
        const type = parts.slice(1).join(' ').toLowerCase();
        await playChord(root, type);
      } else if (item.type === 'interval') {
        // Play interval: root note then the interval note
        await playNote('C');
        // The interval logic would need the semitones
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [practiceState, playNote, playChord]);

  // Handle answer
  const handleAnswer = useCallback(async (answer: string) => {
    if (!practiceState || answerState !== 'default') return;

    setSelectedAnswer(answer);
    const isCorrect = answer === practiceState.currentItem.item;
    setAnswerState(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      safeHaptics.notificationAsync(NotificationFeedbackType.Success);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
      await addXP(XP_PER_CORRECT);
    } else {
      safeHaptics.notificationAsync(NotificationFeedbackType.Error);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }

    // Record answer
    const itemType = practiceState.currentItem.type === 'note' ? 'note' :
      practiceState.currentItem.type === 'chord' ? 'chord' :
      practiceState.currentItem.type === 'interval' ? 'interval' : 'scale';
    await recordAnswer(isCorrect, practiceState.currentItem.item, itemType);

    // Update SRS data for the current item
    const updatedItem = updateSRSAfterPractice(practiceState.currentItem, isCorrect);
    const updatedSessionItems = [...practiceState.sessionItems];
    updatedSessionItems[practiceState.currentIndex] = updatedItem;

    // Move to next question or finish
    timeoutRef.current = setTimeout(() => {
      // Prevent setState after unmount
      if (!isMountedRef.current) return;

      const nextIndex = practiceState.currentIndex + 1;

      if (nextIndex >= practiceState.sessionItems.length) {
        // Session complete
        setPracticeState({
          ...practiceState,
          sessionItems: updatedSessionItems,
          correctCount: practiceState.correctCount + (isCorrect ? 1 : 0),
          totalCount: practiceState.totalCount + 1,
        });
        setSessionComplete(true);
      } else {
        // Next question
        const nextItem = updatedSessionItems[nextIndex];
        const options = generateOptions(nextItem);

        setPracticeState({
          ...practiceState,
          currentIndex: nextIndex,
          currentItem: nextItem,
          options,
          sessionItems: updatedSessionItems,
          correctCount: practiceState.correctCount + (isCorrect ? 1 : 0),
          totalCount: practiceState.totalCount + 1,
        });
        setAnswerState('default');
        setSelectedAnswer(null);
      }
      timeoutRef.current = null;
    }, 800);
  }, [practiceState, answerState, addXP, recordAnswer]);

  // Render loading/empty state
  if (!recommendation) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Analyzing your progress...</Text>
        </View>
      </View>
    );
  }

  // Render no weak areas
  if (recommendation.items.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Weak Areas</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.centerContent}>
          <Ionicons name="trophy" size={80} color={COLORS.warning} />
          <Text style={styles.successTitle}>You're doing great!</Text>
          <Text style={styles.successSubtitle}>
            No weak areas detected. Keep practicing to maintain your skills!
          </Text>
          <Button
            title="Back to Home"
            onPress={() => navigation.goBack()}
            variant="primary"
            size="lg"
            style={{ marginTop: SPACING.lg }}
          />
        </View>
      </View>
    );
  }

  // Render session complete
  if (sessionComplete && practiceState) {
    const summary = getSessionSummary(practiceState.startItems, practiceState.sessionItems);
    const accuracy = Math.round((practiceState.correctCount / practiceState.totalCount) * 100);

    return (
      <View style={styles.container}>
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <View style={styles.centerContent}>
          <Ionicons
            name={accuracy >= 70 ? 'checkmark-circle' : 'refresh-circle'}
            size={80}
            color={accuracy >= 70 ? COLORS.success : COLORS.warning}
          />
          <Text style={styles.successTitle}>Session Complete!</Text>
          <Text style={styles.successSubtitle}>
            {practiceState.correctCount}/{practiceState.totalCount} correct ({accuracy}%)
          </Text>

          <GlassCard style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="trending-up" size={24} color={COLORS.success} />
                <Text style={styles.summaryValue}>{summary.improved}</Text>
                <Text style={styles.summaryLabel}>Improved</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="remove" size={24} color={COLORS.textMuted} />
                <Text style={styles.summaryValue}>{summary.maintained}</Text>
                <Text style={styles.summaryLabel}>Maintained</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="trending-down" size={24} color={COLORS.error} />
                <Text style={styles.summaryValue}>{summary.declined}</Text>
                <Text style={styles.summaryLabel}>Needs Work</Text>
              </View>
            </View>
          </GlassCard>

          <Button
            title="Practice Again"
            onPress={() => {
              setSessionComplete(false);
              setPracticeState(null);
              const rec = getRecommendedPractice(stats, 10);
              setRecommendation(rec);
            }}
            variant="primary"
            size="lg"
            style={{ marginTop: SPACING.lg }}
          />
          <Button
            title="Back to Home"
            onPress={() => navigation.goBack()}
            variant="secondary"
            size="lg"
            style={{ marginTop: SPACING.sm }}
          />
        </View>
      </View>
    );
  }

  // Render overview (before starting)
  if (!practiceState) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          bounces={true}
          overScrollMode="always"
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Weak Areas</Text>
            <View style={{ width: 24 }} />
          </View>

          <GlassCard style={styles.messageCard}>
            <Ionicons name="bulb" size={24} color={COLORS.warning} />
            <Text style={styles.messageText}>{recommendation.message}</Text>
          </GlassCard>

          {recommendation.focusAreas.length > 0 && (
            <View style={styles.focusSection}>
              <Text style={styles.sectionTitle}>Focus Areas</Text>
              <View style={styles.focusTags}>
                {recommendation.focusAreas.map(area => (
                  <View key={area} style={styles.focusTag}>
                    <Text style={styles.focusTagText}>{area}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Items to Practice ({recommendation.items.length})</Text>

          {recommendation.items.map((item, index) => (
            <GlassCard key={`${item.item}-${index}`} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.item}</Text>
                <View style={[
                  styles.priorityBadge,
                  item.priority >= 7 ? styles.priorityHigh :
                  item.priority >= 4 ? styles.priorityMedium : styles.priorityLow
                ]}>
                  <Text style={styles.priorityText}>P{item.priority}</Text>
                </View>
              </View>
              <View style={styles.itemStats}>
                <Text style={styles.itemType}>{item.type}</Text>
                <Text style={styles.itemAccuracy}>
                  {Math.round(item.accuracy * 100)}% accuracy
                </Text>
                <Text style={styles.itemAttempts}>
                  {item.totalAttempts} attempts
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${item.accuracy * 100}%` },
                    item.accuracy >= 0.7 ? styles.progressGood :
                    item.accuracy >= 0.5 ? styles.progressMedium : styles.progressBad
                  ]}
                />
              </View>
            </GlassCard>
          ))}

          <Button
            title="Start Practice Session"
            onPress={startPractice}
            variant="primary"
            size="lg"
            style={{ marginTop: SPACING.md, marginBottom: SPACING.xxl }}
          />
        </ScrollView>
      </View>
    );
  }

  // Render practice session
  const progress = (practiceState.currentIndex / practiceState.sessionItems.length) * 100;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <View style={styles.gameContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setPracticeState(null);
              setSessionComplete(false);
            }}
            accessibilityLabel="Exit practice"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Weak Areas Practice</Text>
          <Text style={styles.progressText}>
            {practiceState.currentIndex + 1}/{practiceState.sessionItems.length}
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.currentType}>{practiceState.currentItem.type.toUpperCase()}</Text>
          <Text style={styles.currentAccuracy}>
            Current: {Math.round(practiceState.currentItem.accuracy * 100)}% accuracy
          </Text>
        </View>

        <Animated.View style={[styles.playSection, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={playSound}
            accessibilityLabel="Play sound"
            accessibilityRole="button"
            accessibilityHint="Tap to hear the sound you need to identify"
          >
            <Ionicons name="play" size={48} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.playHint}>Tap to play</Text>
        </Animated.View>

        <Animated.View
          style={[styles.optionsContainer, { transform: [{ translateX: shakeAnim }] }]}
        >
          {practiceState.options.map((option) => {
            let buttonStyle = styles.optionButton;
            const isSelected = selectedAnswer === option;
            const isCorrect = option === practiceState.currentItem.item;
            const showResult = answerState !== 'default';

            if (showResult) {
              if (isCorrect) {
                buttonStyle = { ...buttonStyle, ...styles.optionCorrect };
              } else if (isSelected && !isCorrect) {
                buttonStyle = { ...buttonStyle, ...styles.optionIncorrect };
              }
            }

            return (
              <TouchableOpacity
                key={option}
                style={buttonStyle}
                onPress={() => handleAnswer(option)}
                disabled={answerState !== 'default'}
                accessibilityLabel={option}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        <View style={styles.scoreDisplay}>
          <Text style={styles.scoreText}>
            {practiceState.correctCount} correct
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingTop: 60,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  successTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: SPACING.md,
  },
  successSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  messageText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  focusSection: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  focusTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  focusTag: {
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  focusTagText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  itemCard: {
    marginBottom: SPACING.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  itemName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  priorityHigh: {
    backgroundColor: COLORS.errorLight,
  },
  priorityMedium: {
    backgroundColor: COLORS.warningLight,
  },
  priorityLow: {
    backgroundColor: COLORS.successLight,
  },
  priorityText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemStats: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  itemType: {
    color: COLORS.textMuted,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  itemAccuracy: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  itemAttempts: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.xpGradientStart,
    borderRadius: 2,
  },
  progressGood: {
    backgroundColor: COLORS.success,
  },
  progressMedium: {
    backgroundColor: COLORS.warning,
  },
  progressBad: {
    backgroundColor: COLORS.error,
  },
  gameContent: {
    flex: 1,
  },
  progressBarContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  progressText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  itemInfo: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  currentType: {
    color: COLORS.textMuted,
    fontSize: 12,
    letterSpacing: 2,
  },
  currentAccuracy: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
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
  optionsContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.md,
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
  scoreDisplay: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  scoreText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  summaryCard: {
    marginTop: SPACING.lg,
    width: '100%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: SPACING.xs,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});
