import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { safeHaptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../utils/haptics';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useApp } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { ALL_NOTES, NATURAL_NOTES, MAJOR_CHORDS, MINOR_CHORDS, XP_PER_CORRECT } from '../types';
import { shuffleArray, getWrongOptions } from '../utils/audioUtils';

const { width } = Dimensions.get('window');

type PracticeMode = 'notes' | 'chords' | 'mixed';

interface PracticeState {
  mode: PracticeMode;
  selectedItems: string[];
  currentItem: string;
  options: string[];
  score: number;
  attempts: number;
  streak: number;
}

export default function PracticeScreen() {
  const navigation = useNavigation<any>();
  const { recordAnswer, addXP, settings, playNote, playChord } = useApp();

  const [isConfiguring, setIsConfiguring] = useState(true);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('notes');
  const [selectedNotes, setSelectedNotes] = useState<string[]>([...NATURAL_NOTES]);
  const [selectedChords, setSelectedChords] = useState<string[]>([...MAJOR_CHORDS.slice(0, 4)]);
  const [difficulty, setDifficulty] = useState(4); // number of options
  
  const [practiceState, setPracticeState] = useState<PracticeState | null>(null);
  const [answerState, setAnswerState] = useState<'default' | 'correct' | 'incorrect'>('default');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getAvailableItems = (): string[] => {
    switch (practiceMode) {
      case 'notes':
        return selectedNotes;
      case 'chords':
        return selectedChords;
      case 'mixed':
        return [...selectedNotes, ...selectedChords];
    }
  };

  const startPractice = () => {
    const items = getAvailableItems();
    if (items.length < 2) {
      alert('Please select at least 2 items to practice');
      return;
    }

    const currentItem = items[Math.floor(Math.random() * items.length)];
    const numOptions = Math.min(difficulty, items.length);
    const wrongOptions = getWrongOptions(currentItem, items, numOptions - 1);
    // Ensure unique options
    const options = shuffleArray([...new Set([currentItem, ...wrongOptions])]);

    setPracticeState({
      mode: practiceMode,
      selectedItems: items,
      currentItem,
      options,
      score: 0,
      attempts: 0,
      streak: 0,
    });

    setIsConfiguring(false);
    setAnswerState('default');
    setSelectedAnswer(null);
  };

  const playSound = async () => {
    if (!practiceState) return;
    safeHaptics.impactAsync(ImpactFeedbackStyle.Light);

    const item = practiceState.currentItem;
    // Check if it's a chord (contains space like "C Major") or a note
    if (item.includes(' ')) {
      // It's a chord
      const parts = item.split(' ');
      const root = parts[0];
      const type = parts.slice(1).join(' ').toLowerCase();
      await playChord(root, type);
    } else {
      // It's a note
      await playNote(item);
    }
  };

  const handleAnswer = async (answer: string) => {
    if (!practiceState || answerState !== 'default') return;

    setSelectedAnswer(answer);
    const isCorrect = answer === practiceState.currentItem;
    setAnswerState(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      safeHaptics.notificationAsync(NotificationFeedbackType.Success);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    } else {
      safeHaptics.notificationAsync(NotificationFeedbackType.Error);
    }

    // Record answer - detect type based on whether item contains a space (chords like "C Major")
    const isChord = practiceState.currentItem.includes(' ');
    const itemType = isChord ? 'chord' : 'note';
    await recordAnswer(isCorrect, practiceState.currentItem, itemType);

    if (isCorrect) {
      await addXP(XP_PER_CORRECT);
    }

    // Next question after delay (using ref for cleanup on unmount)
    timeoutRef.current = setTimeout(() => {
      const { selectedItems } = practiceState;
      const currentItem = selectedItems[Math.floor(Math.random() * selectedItems.length)];
      const numOptions = Math.min(difficulty, selectedItems.length);
      const wrongOptions = getWrongOptions(currentItem, selectedItems, numOptions - 1);
      // Ensure unique options
      const options = shuffleArray([...new Set([currentItem, ...wrongOptions])]);

      setPracticeState({
        ...practiceState,
        currentItem,
        options,
        score: practiceState.score + (isCorrect ? 1 : 0),
        attempts: practiceState.attempts + 1,
        streak: isCorrect ? practiceState.streak + 1 : 0,
      });

      setAnswerState('default');
      setSelectedAnswer(null);
      // Sound will only play when user taps the play button (removed autoPlay)
    }, isCorrect ? 500 : 800);
  };

  const toggleNote = (note: string) => {
    setSelectedNotes(prev => 
      prev.includes(note) 
        ? prev.filter(n => n !== note)
        : [...prev, note]
    );
  };

  const toggleChord = (chord: string) => {
    setSelectedChords(prev =>
      prev.includes(chord)
        ? prev.filter(c => c !== chord)
        : [...prev, chord]
    );
  };

  const selectAllNotes = () => setSelectedNotes([...ALL_NOTES]);
  const selectNaturalNotes = () => setSelectedNotes([...NATURAL_NOTES]);
  const clearNotes = () => setSelectedNotes([]);

  const selectAllChords = () => setSelectedChords([...MAJOR_CHORDS, ...MINOR_CHORDS]);
  const selectMajorChords = () => setSelectedChords([...MAJOR_CHORDS]);
  const selectMinorChords = () => setSelectedChords([...MINOR_CHORDS]);
  const clearChords = () => setSelectedChords([]);

  // Configuration screen
  if (isConfiguring) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          bounces={true}
          overScrollMode="always"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Practice Mode</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Mode Selection */}
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>Practice Type</Text>
            <View style={styles.modeButtons}>
              {(['notes', 'chords', 'mixed'] as PracticeMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeButton,
                    practiceMode === mode && styles.modeButtonActive,
                  ]}
                  onPress={() => setPracticeMode(mode)}
                  accessibilityLabel={`${mode.charAt(0).toUpperCase() + mode.slice(1)} practice mode`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: practiceMode === mode }}
                >
                  <Text style={[
                    styles.modeButtonText,
                    practiceMode === mode && styles.modeButtonTextActive,
                  ]}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>

          {/* Notes Selection */}
          {(practiceMode === 'notes' || practiceMode === 'mixed') && (
            <GlassCard style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Notes ({selectedNotes.length})</Text>
                <View style={styles.quickButtons}>
                  <TouchableOpacity style={styles.quickButton} onPress={selectAllNotes}>
                    <Text style={styles.quickButtonText}>All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickButton} onPress={selectNaturalNotes}>
                    <Text style={styles.quickButtonText}>Natural</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickButton} onPress={clearNotes}>
                    <Text style={styles.quickButtonText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.itemGrid}>
                {ALL_NOTES.map((note) => (
                  <TouchableOpacity
                    key={note}
                    style={[
                      styles.itemButton,
                      selectedNotes.includes(note) && styles.itemButtonActive,
                    ]}
                    onPress={() => toggleNote(note)}
                  >
                    <Text style={[
                      styles.itemButtonText,
                      selectedNotes.includes(note) && styles.itemButtonTextActive,
                    ]}>
                      {note}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>
          )}

          {/* Chords Selection */}
          {(practiceMode === 'chords' || practiceMode === 'mixed') && (
            <GlassCard style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Chords ({selectedChords.length})</Text>
                <View style={styles.quickButtons}>
                  <TouchableOpacity style={styles.quickButton} onPress={selectAllChords}>
                    <Text style={styles.quickButtonText}>All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickButton} onPress={selectMajorChords}>
                    <Text style={styles.quickButtonText}>Major</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickButton} onPress={selectMinorChords}>
                    <Text style={styles.quickButtonText}>Minor</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.itemGrid}>
                {[...MAJOR_CHORDS, ...MINOR_CHORDS].map((chord) => (
                  <TouchableOpacity
                    key={chord}
                    style={[
                      styles.chordButton,
                      selectedChords.includes(chord) && styles.itemButtonActive,
                    ]}
                    onPress={() => toggleChord(chord)}
                  >
                    <Text style={[
                      styles.itemButtonText,
                      selectedChords.includes(chord) && styles.itemButtonTextActive,
                    ]}>
                      {chord}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>
          )}

          {/* Difficulty */}
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>Difficulty</Text>
            <Text style={styles.difficultyDesc}>Number of answer options</Text>
            <View style={styles.difficultyButtons}>
              {[2, 3, 4, 5, 6].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.difficultyButton,
                    difficulty === num && styles.difficultyButtonActive,
                  ]}
                  onPress={() => setDifficulty(num)}
                >
                  <Text style={[
                    styles.difficultyButtonText,
                    difficulty === num && styles.difficultyButtonTextActive,
                  ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>

          {/* Start Button */}
          <Button
            title="Start Practice"
            onPress={startPractice}
            variant="primary"
            size="lg"
            style={{ marginTop: SPACING.md }}
          />

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  // Practice screen
  if (!practiceState) return null;

  const accuracy = practiceState.attempts > 0 
    ? Math.round((practiceState.score / practiceState.attempts) * 100) 
    : 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <View style={styles.practiceContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsConfiguring(true)}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Practice</Text>
          <TouchableOpacity onPress={() => setIsConfiguring(true)}>
            <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>{practiceState.score}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{practiceState.attempts}</Text>
            <Text style={styles.statLabel}>Attempts</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.warning }]}>
              {practiceState.streak > 0 ? `🔥${practiceState.streak}` : '0'}
            </Text>
            <Text style={styles.statLabel}>Streak</Text>
          </GlassCard>
        </View>

        {/* Play Button */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={playSound}
            accessibilityLabel="Play sound"
            accessibilityRole="button"
            accessibilityHint="Tap to hear the sound you need to identify"
          >
            <LinearGradient
              colors={[COLORS.xpGradientStart, COLORS.xpGradientEnd]}
              style={styles.playButtonGradient}
            >
              <Ionicons name="play" size={48} color={COLORS.textPrimary} />
              <Text style={styles.playText}>Play Sound</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.instruction}>
          {practiceMode === 'notes' ? 'Identify the note' : 
           practiceMode === 'chords' ? 'Identify the chord' : 
           'Identify the sound'}
        </Text>

        {/* Answer Options */}
        <View style={styles.answersGrid}>
          {practiceState.options.map((option) => {
            let buttonStyle = styles.answerButton;
            
            if (selectedAnswer === option) {
              if (answerState === 'correct') {
                buttonStyle = { ...buttonStyle, ...styles.answerCorrect };
              } else if (answerState === 'incorrect') {
                buttonStyle = { ...buttonStyle, ...styles.answerIncorrect };
              }
            } else if (answerState !== 'default' && option === practiceState.currentItem) {
              buttonStyle = { ...buttonStyle, ...styles.answerCorrect };
            }

            return (
              <TouchableOpacity
                key={option}
                style={[buttonStyle, answerState !== 'default' && styles.answerDisabled]}
                onPress={() => handleAnswer(option)}
                disabled={answerState !== 'default'}
                accessibilityLabel={`Answer: ${option}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: answerState !== 'default' }}
              >
                <Text style={styles.answerText}>{option}</Text>
              </TouchableOpacity>
            );
          })}
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
  content: {
    padding: SPACING.md,
    paddingTop: 60,
  },
  practiceContent: {
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
  section: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  quickButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  quickButton: {
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  quickButtonText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modeButton: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: COLORS.xpGradientStart,
  },
  modeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: COLORS.textPrimary,
  },
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  itemButton: {
    width: (width - SPACING.md * 4 - SPACING.xs * 5) / 6,
    aspectRatio: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chordButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  itemButtonActive: {
    backgroundColor: COLORS.xpGradientStart,
  },
  itemButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  itemButtonTextActive: {
    color: COLORS.textPrimary,
  },
  difficultyDesc: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  difficultyButton: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: COLORS.xpGradientStart,
  },
  difficultyButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  difficultyButtonTextActive: {
    color: COLORS.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  playButton: {
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  playButtonGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  playText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: SPACING.xs,
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
    ...SHADOWS.small,
  },
  answerText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  answerCorrect: {
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.success,
  },
  answerIncorrect: {
    backgroundColor: COLORS.errorLight,
    borderColor: COLORS.error,
  },
  answerDisabled: {
    opacity: 0.7,
  },
});
