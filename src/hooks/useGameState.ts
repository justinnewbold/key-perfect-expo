import { useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { shuffleArray, getWrongOptions } from '../utils/audioUtils';
import { safeHaptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../utils/haptics';
import { XP_PER_CORRECT } from '../types';

export type AnswerState = 'default' | 'correct' | 'incorrect';

export interface GameConfig {
  items: string[];
  numOptions?: number;
  timeLimit?: number;
  lives?: number;
  xpMultiplier?: number;
  itemType: 'note' | 'chord' | 'interval' | 'scale';
}

export interface GameState {
  score: number;
  attempts: number;
  currentItem: string;
  options: string[];
  timeLeft?: number;
  lives?: number;
  level?: number;
  isGameOver: boolean;
}

export interface UseGameStateResult {
  state: GameState | null;
  answerState: AnswerState;
  startGame: () => void;
  handleAnswer: (answer: string) => Promise<boolean>;
  endGame: () => void;
  isActive: boolean;
}

export function useGameState(config: GameConfig): UseGameStateResult {
  const { recordAnswer, addXP } = useApp();
  const [state, setState] = useState<GameState | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('default');
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { items, numOptions = 4, timeLimit, lives, xpMultiplier = 1, itemType } = config;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (isActive && timeLimit && state && state.timeLeft && state.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (!prev || !prev.timeLeft) return prev;
          if (prev.timeLeft <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            return { ...prev, timeLeft: 0, isGameOver: true };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [isActive, timeLimit, state?.timeLeft]);

  const generateNextQuestion = useCallback((): { currentItem: string; options: string[] } => {
    const currentItem = items[Math.floor(Math.random() * items.length)];
    const options = shuffleArray([currentItem, ...getWrongOptions(currentItem, items, numOptions - 1)]);
    return { currentItem, options };
  }, [items, numOptions]);

  const startGame = useCallback(() => {
    const { currentItem, options } = generateNextQuestion();

    setState({
      score: 0,
      attempts: 0,
      currentItem,
      options,
      timeLeft: timeLimit,
      lives: lives,
      level: 1,
      isGameOver: false,
    });
    setAnswerState('default');
    setIsActive(true);
  }, [generateNextQuestion, timeLimit, lives]);

  const handleAnswer = useCallback(async (answer: string): Promise<boolean> => {
    if (!state || answerState !== 'default' || state.isGameOver) return false;

    const isCorrect = answer === state.currentItem;
    setAnswerState(isCorrect ? 'correct' : 'incorrect');

    // Haptic feedback
    if (isCorrect) {
      safeHaptics.notificationAsync(NotificationFeedbackType.Success);
      try {
        await addXP(Math.floor(XP_PER_CORRECT * xpMultiplier));
      } catch (error) {
        console.error('Error adding XP:', error);
      }
    } else {
      safeHaptics.notificationAsync(NotificationFeedbackType.Error);
    }

    // Record answer
    try {
      await recordAnswer(isCorrect, state.currentItem, itemType);
    } catch (error) {
      console.error('Error recording answer:', error);
    }

    // Update state after delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const newScore = state.score + (isCorrect ? 1 : 0);
        const newAttempts = state.attempts + 1;
        const newLives = lives !== undefined ? (state.lives || lives) - (isCorrect ? 0 : 1) : undefined;
        const newLevel = Math.floor(newScore / 5) + 1;

        // Check for game over conditions
        const isGameOver = (newLives !== undefined && newLives <= 0) ||
                          (state.timeLeft !== undefined && state.timeLeft <= 0);

        if (isGameOver) {
          setState(prev => prev ? { ...prev, score: newScore, lives: newLives, isGameOver: true } : prev);
          setAnswerState('default');
          resolve(isCorrect);
          return;
        }

        // Generate next question
        const { currentItem, options } = generateNextQuestion();

        setState({
          ...state,
          score: newScore,
          attempts: newAttempts,
          currentItem,
          options,
          lives: newLives,
          level: newLevel,
          isGameOver: false,
        });
        setAnswerState('default');
        resolve(isCorrect);
      }, 300);
    });
  }, [state, answerState, recordAnswer, addXP, xpMultiplier, itemType, lives, generateNextQuestion]);

  const endGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
    setState(null);
    setAnswerState('default');
  }, []);

  return {
    state,
    answerState,
    startGame,
    handleAnswer,
    endGame,
    isActive,
  };
}

// Helper hook for modes that don't fit the standard pattern
export function useAnswerFeedback() {
  const [answerState, setAnswerState] = useState<AnswerState>('default');

  const showFeedback = useCallback((isCorrect: boolean) => {
    setAnswerState(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      safeHaptics.notificationAsync(NotificationFeedbackType.Success);
    } else {
      safeHaptics.notificationAsync(NotificationFeedbackType.Error);
    }
  }, []);

  const resetFeedback = useCallback(() => {
    setAnswerState('default');
  }, []);

  return { answerState, showFeedback, resetFeedback };
}
