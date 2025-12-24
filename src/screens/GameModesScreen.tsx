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
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useApp } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import {
  GAME_MODES,
  ALL_NOTES,
  MAJOR_CHORDS,
  MINOR_CHORDS,
  INTERVALS,
  SCALES,
  PROGRESSIONS,
  CHORD_INTERVALS,
  ChordType,
  XP_PER_CORRECT,
  DAILY_CHALLENGE_BONUS,
} from '../types';
import { shuffleArray, getWrongOptions } from '../utils/audioUtils';
import { safeHaptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../utils/haptics';
import { isDailyChallengeCompletedToday, markDailyChallengeCompleted } from '../utils/storage';

const { width } = Dimensions.get('window');

type ActiveMode = 'speed' | 'survival' | 'daily' | 'intervals' | 'scales' | 'progressions' | 'inversions' | 'reverse' | null;

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

interface DailyGameState {
  score: number;
  attempts: number;
  requiredCorrect: number;
  currentItem: string;
  options: string[];
}

interface ScalesGameState {
  score: number;
  attempts: number;
  currentScale: typeof SCALES[0];
  options: typeof SCALES;
}

interface ProgressionsGameState {
  score: number;
  attempts: number;
  currentProgression: typeof PROGRESSIONS[0];
  options: typeof PROGRESSIONS;
}

interface InversionsGameState {
  score: number;
  attempts: number;
  currentChord: string;
  currentInversion: 'root' | 'first' | 'second';
  options: ('root' | 'first' | 'second')[];
}

interface ReverseGameState {
  score: number;
  attempts: number;
  targetItem: string;
  hasPlayed: boolean;
  isCorrect: boolean | null;
}

export default function GameModesScreen() {
  const navigation = useNavigation<any>();
  const { recordAnswer, addXP, updateStats, stats, settings, playNote, playChord } = useApp();

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
  const [dailyAlreadyDone, setDailyAlreadyDone] = useState(false);
  const [dailyState, setDailyState] = useState<DailyGameState | null>(null);
  const [dailyAnswerState, setDailyAnswerState] = useState<'default' | 'correct' | 'incorrect'>('default');

  // Scales Mode
  const [scalesState, setScalesState] = useState<ScalesGameState | null>(null);
  const [scalesAnswerState, setScalesAnswerState] = useState<'default' | 'correct' | 'incorrect'>('default');

  // Progressions Mode
  const [progressionsState, setProgressionsState] = useState<ProgressionsGameState | null>(null);
  const [progressionsAnswerState, setProgressionsAnswerState] = useState<'default' | 'correct' | 'incorrect'>('default');

  // Inversions Mode
  const [inversionsState, setInversionsState] = useState<InversionsGameState | null>(null);
  const [inversionsAnswerState, setInversionsAnswerState] = useState<'default' | 'correct' | 'incorrect'>('default');

  // Reverse Mode
  const [reverseState, setReverseState] = useState<ReverseGameState | null>(null);
  const [reverseAnswerState, setReverseAnswerState] = useState<'default' | 'correct' | 'incorrect'>('default');

  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Check if daily challenge is already completed today
  useEffect(() => {
    const checkDailyChallenge = async () => {
      const completed = await isDailyChallengeCompletedToday();
      setDailyAlreadyDone(completed);
    };
    checkDailyChallenge();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (speedTimerRef.current) clearInterval(speedTimerRef.current);
    };
  }, []);

  // Speed Mode Timer - only depend on activeMode to avoid creating multiple intervals
  useEffect(() => {
    if (activeMode === 'speed') {
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
  }, [activeMode]);

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
      safeHaptics.notificationAsync(NotificationFeedbackType.Success);
      await addXP(XP_PER_CORRECT);
    } else {
      safeHaptics.notificationAsync(NotificationFeedbackType.Error);
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
      safeHaptics.notificationAsync(NotificationFeedbackType.Success);
      await addXP(XP_PER_CORRECT);
    } else {
      safeHaptics.notificationAsync(NotificationFeedbackType.Error);
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
      safeHaptics.notificationAsync(NotificationFeedbackType.Success);
      await addXP(XP_PER_CORRECT);
    } else {
      safeHaptics.notificationAsync(NotificationFeedbackType.Error);
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

  // Start Daily Challenge
  const startDailyChallenge = () => {
    const items = ALL_NOTES;
    const currentItem = items[Math.floor(Math.random() * items.length)];
    const options = shuffleArray([currentItem, ...getWrongOptions(currentItem, items, 3)]);

    setDailyState({
      score: 0,
      attempts: 0,
      requiredCorrect: 10,
      currentItem,
      options,
    });
    setDailyAnswerState('default');
    setActiveMode('daily');
  };

  // Daily Challenge Answer
  const handleDailyAnswer = async (answer: string) => {
    if (!dailyState || dailyAnswerState !== 'default') return;

    const isCorrect = answer === dailyState.currentItem;
    setDailyAnswerState(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      safeHaptics.notificationAsync(NotificationFeedbackType.Success);
      await addXP(XP_PER_CORRECT);
    } else {
      safeHaptics.notificationAsync(NotificationFeedbackType.Error);
    }

    await recordAnswer(isCorrect, dailyState.currentItem, 'note');

    const newScore = dailyState.score + (isCorrect ? 1 : 0);
    const newAttempts = dailyState.attempts + 1;

    // Check if challenge is complete (10 correct answers)
    if (newScore >= dailyState.requiredCorrect) {
      setTimeout(async () => {
        await addXP(DAILY_CHALLENGE_BONUS);
        await updateStats({
          dailyChallengesCompleted: stats.dailyChallengesCompleted + 1
        });
        await markDailyChallengeCompleted();
        setDailyCompleted(true);
        setDailyAlreadyDone(true);
        setDailyState(null);
      }, 500);
      return;
    }

    setTimeout(() => {
      const items = ALL_NOTES;
      const currentItem = items[Math.floor(Math.random() * items.length)];
      const options = shuffleArray([currentItem, ...getWrongOptions(currentItem, items, 3)]);

      setDailyState({
        ...dailyState,
        score: newScore,
        attempts: newAttempts,
        currentItem,
        options,
      });
      setDailyAnswerState('default');
    }, 300);
  };

  // Play Daily Sound
  const playDailySound = async () => {
    if (dailyState) {
      safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
      await playNote(dailyState.currentItem);
    }
  };

  // Start Scales Mode
  const startScalesMode = () => {
    const shuffledScales = shuffleArray([...SCALES]);
    const currentScale = shuffledScales[0];
    const options = shuffleArray(shuffledScales.slice(0, 4));

    setScalesState({
      score: 0,
      attempts: 0,
      currentScale,
      options,
    });
    setScalesAnswerState('default');
    setActiveMode('scales');
  };

  // Scales Mode Answer
  const handleScalesAnswer = async (scale: typeof SCALES[0]) => {
    if (!scalesState || scalesAnswerState !== 'default') return;

    const isCorrect = scale.name === scalesState.currentScale.name;
    setScalesAnswerState(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      safeHaptics.notificationAsync(NotificationFeedbackType.Success);
      await addXP(XP_PER_CORRECT);
    } else {
      safeHaptics.notificationAsync(NotificationFeedbackType.Error);
    }

    await recordAnswer(isCorrect, scalesState.currentScale.name, 'scale');

    setTimeout(() => {
      const shuffledScales = shuffleArray([...SCALES]);
      const currentScale = shuffledScales[0];
      const options = shuffleArray(shuffledScales.slice(0, 4));

      setScalesState({
        ...scalesState,
        score: scalesState.score + (isCorrect ? 1 : 0),
        attempts: scalesState.attempts + 1,
        currentScale,
        options,
      });
      setScalesAnswerState('default');
    }, 500);
  };

  // Play Scale Sound
  const playScaleSound = async () => {
    if (scalesState) {
      safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
      // Play each note in the scale sequentially
      const rootNote = 'C';
      const rootIndex = ALL_NOTES.indexOf(rootNote);

      for (const interval of scalesState.currentScale.intervals) {
        const noteIndex = (rootIndex + interval) % 12;
        const octave = 4 + Math.floor((rootIndex + interval) / 12);
        await playNote(ALL_NOTES[noteIndex], octave, 0.25);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };

  // Start Progressions Mode
  const startProgressionsMode = () => {
    const shuffledProgressions = shuffleArray([...PROGRESSIONS]);
    const currentProgression = shuffledProgressions[0];
    const options = shuffleArray(shuffledProgressions.slice(0, 4));

    setProgressionsState({
      score: 0,
      attempts: 0,
      currentProgression,
      options,
    });
    setProgressionsAnswerState('default');
    setActiveMode('progressions');
  };

  // Play Progression Sound
  const playProgressionSound = async () => {
    if (progressionsState) {
      safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
      // Map roman numerals to chords in C major
      const numeralToChord: Record<string, { root: string; type: ChordType }> = {
        'I': { root: 'C', type: 'major' },
        'ii': { root: 'D', type: 'minor' },
        'iii': { root: 'E', type: 'minor' },
        'IV': { root: 'F', type: 'major' },
        'V': { root: 'G', type: 'major' },
        'vi': { root: 'A', type: 'minor' },
        'vii': { root: 'B', type: 'diminished' },
      };

      const numerals = progressionsState.currentProgression.numerals.split('-');
      for (const numeral of numerals) {
        const chord = numeralToChord[numeral];
        if (chord) {
          await playChord(chord.root, chord.type);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
  };

  // Progressions Mode Answer
  const handleProgressionsAnswer = async (progression: typeof PROGRESSIONS[0]) => {
    if (!progressionsState || progressionsAnswerState !== 'default') return;

    const isCorrect = progression.name === progressionsState.currentProgression.name;
    setProgressionsAnswerState(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      safeHaptics.notificationAsync(NotificationFeedbackType.Success);
      await addXP(XP_PER_CORRECT * 2); // Higher XP for progressions
    } else {
      safeHaptics.notificationAsync(NotificationFeedbackType.Error);
    }

    await recordAnswer(isCorrect, progressionsState.currentProgression.name, 'chord');

    setTimeout(() => {
      const shuffledProgressions = shuffleArray([...PROGRESSIONS]);
      const currentProgression = shuffledProgressions[0];
      const options = shuffleArray(shuffledProgressions.slice(0, 4));

      setProgressionsState({
        ...progressionsState,
        score: progressionsState.score + (isCorrect ? 1 : 0),
        attempts: progressionsState.attempts + 1,
        currentProgression,
        options,
      });
      setProgressionsAnswerState('default');
    }, 500);
  };

  // Start Inversions Mode
  const startInversionsMode = () => {
    const chords = [...MAJOR_CHORDS, ...MINOR_CHORDS.slice(0, 4)];
    const currentChord = chords[Math.floor(Math.random() * chords.length)];
    const inversions: ('root' | 'first' | 'second')[] = ['root', 'first', 'second'];
    const currentInversion = inversions[Math.floor(Math.random() * inversions.length)];

    setInversionsState({
      score: 0,
      attempts: 0,
      currentChord,
      currentInversion,
      options: shuffleArray([...inversions]),
    });
    setInversionsAnswerState('default');
    setActiveMode('inversions');
  };

  // Play Inversion Sound
  const playInversionSound = async () => {
    if (inversionsState) {
      safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
      const parts = inversionsState.currentChord.split(' ');
      const root = parts[0];
      const typeStr = parts.slice(1).join(' ').toLowerCase();
      const type: ChordType = typeStr.includes('minor') ? 'minor' : 'major';

      const intervals = CHORD_INTERVALS[type];
      const rootIndex = ALL_NOTES.indexOf(root);
      let octave = 4;

      // Adjust intervals based on inversion
      let playIntervals: number[] = [...intervals];
      if (inversionsState.currentInversion === 'first') {
        // First inversion: move root up an octave
        playIntervals = [playIntervals[1], playIntervals[2], playIntervals[0] + 12];
      } else if (inversionsState.currentInversion === 'second') {
        // Second inversion: move root and third up an octave
        playIntervals = [playIntervals[2], playIntervals[0] + 12, playIntervals[1] + 12];
      }

      // Play the chord with inversion
      for (const interval of playIntervals) {
        const noteIndex = (rootIndex + interval) % 12;
        const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
        await playNote(ALL_NOTES[noteIndex], noteOctave, 0.5);
      }
    }
  };

  // Inversions Mode Answer
  const handleInversionsAnswer = async (inversion: 'root' | 'first' | 'second') => {
    if (!inversionsState || inversionsAnswerState !== 'default') return;

    const isCorrect = inversion === inversionsState.currentInversion;
    setInversionsAnswerState(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      safeHaptics.notificationAsync(NotificationFeedbackType.Success);
      await addXP(XP_PER_CORRECT * 1.5);
    } else {
      safeHaptics.notificationAsync(NotificationFeedbackType.Error);
    }

    await recordAnswer(isCorrect, `${inversionsState.currentChord} ${inversionsState.currentInversion}`, 'chord');

    setTimeout(() => {
      const chords = [...MAJOR_CHORDS, ...MINOR_CHORDS.slice(0, 4)];
      const currentChord = chords[Math.floor(Math.random() * chords.length)];
      const inversions: ('root' | 'first' | 'second')[] = ['root', 'first', 'second'];
      const currentInversion = inversions[Math.floor(Math.random() * inversions.length)];

      setInversionsState({
        ...inversionsState,
        score: inversionsState.score + (isCorrect ? 1 : 0),
        attempts: inversionsState.attempts + 1,
        currentChord,
        currentInversion,
        options: shuffleArray([...inversions]),
      });
      setInversionsAnswerState('default');
    }, 500);
  };

  // Start Reverse Mode
  const startReverseMode = () => {
    const allItems = [...ALL_NOTES, ...MAJOR_CHORDS.slice(0, 4)];
    const targetItem = allItems[Math.floor(Math.random() * allItems.length)];

    setReverseState({
      score: 0,
      attempts: 0,
      targetItem,
      hasPlayed: false,
      isCorrect: null,
    });
    setReverseAnswerState('default');
    setActiveMode('reverse');
  };

  // Play the target in Reverse Mode
  const playReverseTarget = async () => {
    if (reverseState) {
      safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
      const item = reverseState.targetItem;

      if (item.includes(' ')) {
        // It's a chord
        const parts = item.split(' ');
        const root = parts[0];
        const type = parts.slice(1).join(' ').toLowerCase();
        await playChord(root, type);
      } else {
        await playNote(item);
      }

      setReverseState(prev => prev ? { ...prev, hasPlayed: true } : prev);
    }
  };

  // Handle Reverse Mode confirmation
  const handleReverseConfirm = async () => {
    if (!reverseState || reverseAnswerState !== 'default') return;

    // Compare what user played with target
    const isCorrect = reverseState.hasPlayed;
    setReverseAnswerState(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      safeHaptics.notificationAsync(NotificationFeedbackType.Success);
      await addXP(XP_PER_CORRECT);
    } else {
      safeHaptics.notificationAsync(NotificationFeedbackType.Error);
    }

    const type = reverseState.targetItem.includes(' ') ? 'chord' : 'note';
    await recordAnswer(isCorrect, reverseState.targetItem, type);

    setTimeout(() => {
      const allItems = [...ALL_NOTES, ...MAJOR_CHORDS.slice(0, 4)];
      const targetItem = allItems[Math.floor(Math.random() * allItems.length)];

      setReverseState({
        ...reverseState,
        score: reverseState.score + (isCorrect ? 1 : 0),
        attempts: reverseState.attempts + 1,
        targetItem,
        hasPlayed: false,
        isCorrect: null,
      });
      setReverseAnswerState('default');
    }, 500);
  };

  // Play Sound for current mode
  const playSound = async () => {
    safeHaptics.impactAsync(ImpactFeedbackStyle.Light);

    if (activeMode === 'speed' && speedState) {
      await playNote(speedState.currentItem);
    } else if (activeMode === 'survival' && survivalState) {
      // Survival mode can have notes or chords at higher levels
      const item = survivalState.currentItem;
      if (item.includes(' ')) {
        // It's a chord like "C Major"
        const parts = item.split(' ');
        const root = parts[0];
        const type = parts.slice(1).join(' ').toLowerCase();
        await playChord(root, type);
      } else {
        await playNote(item);
      }
    } else if (activeMode === 'intervals' && intervalState) {
      // Play the interval (root note and then the interval note)
      const rootNote = 'C';
      await playNote(rootNote);
      // Play second note after a short delay
      setTimeout(async () => {
        const semitones = intervalState.currentInterval.semitones;
        const noteIndex = (ALL_NOTES.indexOf(rootNote) + semitones) % 12;
        await playNote(ALL_NOTES[noteIndex]);
      }, 500);
    }
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
                  else if (mode.id === 'daily') startDailyChallenge();
                  else if (mode.id === 'scales') startScalesMode();
                  else if (mode.id === 'progressions') startProgressionsMode();
                  else if (mode.id === 'inversions') startInversionsMode();
                  else if (mode.id === 'reverse') startReverseMode();
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

  // Render Scales Mode
  if (activeMode === 'scales' && scalesState) {
    const accuracy = scalesState.attempts > 0
      ? Math.round((scalesState.score / scalesState.attempts) * 100)
      : 0;

    return (
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
        <View style={styles.gameContent}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setActiveMode(null)}
              accessibilityLabel="Close scales mode"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Scales</Text>
            <Text style={styles.accuracyBadge}>{accuracy}%</Text>
          </View>

          <Text style={styles.scoreText}>
            Score: {scalesState.score} / {scalesState.attempts}
          </Text>

          <TouchableOpacity
            style={styles.playButton}
            onPress={playScaleSound}
            accessibilityLabel="Play scale"
            accessibilityHint="Plays the scale notes in sequence"
          >
            <LinearGradient
              colors={[COLORS.scales, COLORS.scales + 'CC']}
              style={styles.playButtonGradient}
            >
              <Ionicons name="play" size={48} color={COLORS.textPrimary} />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.instruction}>Identify the scale</Text>

          <View style={styles.intervalOptions}>
            {scalesState.options.map((scale) => {
              let buttonStyle = styles.intervalButton;
              if (scalesAnswerState === 'correct' && scale.name === scalesState.currentScale.name) {
                buttonStyle = { ...buttonStyle, ...styles.answerCorrect };
              } else if (scalesAnswerState === 'incorrect' && scale.name === scalesState.currentScale.name) {
                buttonStyle = { ...buttonStyle, ...styles.answerCorrect };
              }

              return (
                <TouchableOpacity
                  key={scale.name}
                  style={buttonStyle}
                  onPress={() => handleScalesAnswer(scale)}
                  disabled={scalesAnswerState !== 'default'}
                  accessibilityLabel={`${scale.name} scale`}
                  accessibilityRole="button"
                >
                  <Text style={styles.intervalName}>{scale.name}</Text>
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
    // Show "already completed today" message
    if (dailyAlreadyDone && !dailyState && !dailyCompleted) {
      return (
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
          <View style={styles.resultContainer}>
            <Text style={styles.resultEmoji}>✅</Text>
            <Text style={styles.resultTitle}>Already Completed!</Text>
            <Text style={styles.resultScore}>Come back tomorrow for a new challenge</Text>
            <Text style={styles.resultLevel}>You've already earned today's bonus XP</Text>
            <Button
              title="Back to Modes"
              onPress={() => setActiveMode(null)}
              variant="primary"
              size="lg"
              style={{ marginTop: SPACING.lg }}
            />
          </View>
        </LinearGradient>
      );
    }

    if (dailyCompleted) {
      return (
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
          <View style={styles.resultContainer}>
            <Text style={styles.resultEmoji}>🎉</Text>
            <Text style={styles.resultTitle}>Daily Complete!</Text>
            <Text style={styles.resultScore}>+{DAILY_CHALLENGE_BONUS} XP Bonus!</Text>
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

    if (dailyState) {
      return (
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
          <View style={styles.gameContent}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => {
                setActiveMode(null);
                setDailyState(null);
              }}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.title}>Daily Challenge</Text>
              <View style={styles.timerBadge}>
                <Text style={styles.timerText}>{dailyState.score}/10</Text>
              </View>
            </View>

            <Text style={styles.scoreText}>
              Progress: {dailyState.score} correct out of {dailyState.attempts} attempts
            </Text>

            <TouchableOpacity style={styles.playButton} onPress={playDailySound}>
              <LinearGradient
                colors={[COLORS.dailyChallenge, COLORS.dailyChallenge + 'CC']}
                style={styles.playButtonGradient}
              >
                <Ionicons name="play" size={48} color={COLORS.textPrimary} />
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.instruction}>Identify the note to complete your daily challenge!</Text>

            <View style={styles.answersGrid}>
              {dailyState.options.map((option) => {
                let buttonStyle = styles.answerButton;
                if (dailyAnswerState === 'correct' && option === dailyState.currentItem) {
                  buttonStyle = { ...buttonStyle, ...styles.answerCorrect };
                } else if (dailyAnswerState === 'incorrect' && option === dailyState.currentItem) {
                  buttonStyle = { ...buttonStyle, ...styles.answerCorrect };
                }

                return (
                  <TouchableOpacity
                    key={option}
                    style={buttonStyle}
                    onPress={() => handleDailyAnswer(option)}
                    disabled={dailyAnswerState !== 'default'}
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
  }

  // Render Progressions Mode
  if (activeMode === 'progressions' && progressionsState) {
    const accuracy = progressionsState.attempts > 0
      ? Math.round((progressionsState.score / progressionsState.attempts) * 100)
      : 0;

    return (
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
        <View style={styles.gameContent}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setActiveMode(null)}
              accessibilityLabel="Close progressions mode"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Progressions</Text>
            <Text style={styles.accuracyBadge}>{accuracy}%</Text>
          </View>

          <Text style={styles.scoreText}>
            Score: {progressionsState.score} / {progressionsState.attempts}
          </Text>

          <TouchableOpacity
            style={styles.playButton}
            onPress={playProgressionSound}
            accessibilityLabel="Play chord progression"
            accessibilityHint="Plays the chord progression to identify"
          >
            <LinearGradient
              colors={[COLORS.progressions, COLORS.progressions + 'CC']}
              style={styles.playButtonGradient}
            >
              <Ionicons name="play" size={48} color={COLORS.textPrimary} />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.instruction}>Identify the chord progression</Text>

          <View style={styles.intervalOptions}>
            {progressionsState.options.map((progression) => {
              let buttonStyle = styles.intervalButton;
              if (progressionsAnswerState === 'correct' && progression.name === progressionsState.currentProgression.name) {
                buttonStyle = { ...buttonStyle, ...styles.answerCorrect };
              } else if (progressionsAnswerState === 'incorrect' && progression.name === progressionsState.currentProgression.name) {
                buttonStyle = { ...buttonStyle, ...styles.answerCorrect };
              }

              return (
                <TouchableOpacity
                  key={progression.name}
                  style={buttonStyle}
                  onPress={() => handleProgressionsAnswer(progression)}
                  disabled={progressionsAnswerState !== 'default'}
                  accessibilityLabel={`${progression.name} progression`}
                  accessibilityRole="button"
                >
                  <Text style={styles.intervalName}>{progression.numerals}</Text>
                  <Text style={styles.intervalHint}>{progression.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Render Inversions Mode
  if (activeMode === 'inversions' && inversionsState) {
    const accuracy = inversionsState.attempts > 0
      ? Math.round((inversionsState.score / inversionsState.attempts) * 100)
      : 0;

    const inversionLabels = {
      root: 'Root Position',
      first: '1st Inversion',
      second: '2nd Inversion',
    };

    return (
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
        <View style={styles.gameContent}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setActiveMode(null)}
              accessibilityLabel="Close inversions mode"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Inversions</Text>
            <Text style={styles.accuracyBadge}>{accuracy}%</Text>
          </View>

          <Text style={styles.scoreText}>
            Score: {inversionsState.score} / {inversionsState.attempts}
          </Text>

          <Text style={styles.chordLabel}>{inversionsState.currentChord}</Text>

          <TouchableOpacity
            style={styles.playButton}
            onPress={playInversionSound}
            accessibilityLabel="Play chord inversion"
            accessibilityHint="Plays the chord inversion to identify"
          >
            <LinearGradient
              colors={[COLORS.inversions, COLORS.inversions + 'CC']}
              style={styles.playButtonGradient}
            >
              <Ionicons name="play" size={48} color={COLORS.textPrimary} />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.instruction}>Which inversion is this?</Text>

          <View style={styles.intervalOptions}>
            {inversionsState.options.map((inversion) => {
              let buttonStyle = styles.intervalButton;
              if (inversionsAnswerState === 'correct' && inversion === inversionsState.currentInversion) {
                buttonStyle = { ...buttonStyle, ...styles.answerCorrect };
              } else if (inversionsAnswerState === 'incorrect' && inversion === inversionsState.currentInversion) {
                buttonStyle = { ...buttonStyle, ...styles.answerCorrect };
              }

              return (
                <TouchableOpacity
                  key={inversion}
                  style={buttonStyle}
                  onPress={() => handleInversionsAnswer(inversion)}
                  disabled={inversionsAnswerState !== 'default'}
                  accessibilityLabel={inversionLabels[inversion]}
                  accessibilityRole="button"
                >
                  <Text style={styles.intervalName}>{inversionLabels[inversion]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Render Reverse Mode
  if (activeMode === 'reverse' && reverseState) {
    const accuracy = reverseState.attempts > 0
      ? Math.round((reverseState.score / reverseState.attempts) * 100)
      : 0;

    return (
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
        <View style={styles.gameContent}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setActiveMode(null)}
              accessibilityLabel="Close reverse mode"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Reverse Mode</Text>
            <Text style={styles.accuracyBadge}>{accuracy}%</Text>
          </View>

          <Text style={styles.scoreText}>
            Score: {reverseState.score} / {reverseState.attempts}
          </Text>

          <GlassCard style={styles.targetCard}>
            <Text style={styles.targetLabel}>Play this sound:</Text>
            <Text style={styles.targetItem}>{reverseState.targetItem}</Text>
          </GlassCard>

          <TouchableOpacity
            style={styles.playButton}
            onPress={playReverseTarget}
            accessibilityLabel="Play target sound"
            accessibilityHint="Plays the target sound you need to match"
          >
            <LinearGradient
              colors={[COLORS.reverseMode, COLORS.reverseMode + 'CC']}
              style={styles.playButtonGradient}
            >
              <Ionicons name="musical-notes" size={48} color={COLORS.textPrimary} />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.instruction}>
            {reverseState.hasPlayed
              ? 'Sound played! Press confirm to continue.'
              : 'Press above to hear the sound, then confirm.'}
          </Text>

          <Button
            title={reverseState.hasPlayed ? 'Confirm & Next' : 'Play First'}
            onPress={handleReverseConfirm}
            variant={reverseState.hasPlayed ? 'success' : 'secondary'}
            size="lg"
            disabled={!reverseState.hasPlayed || reverseAnswerState !== 'default'}
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
  chordLabel: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  targetCard: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  targetLabel: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: SPACING.xs,
  },
  targetItem: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: 'bold',
  },
});
