import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'keyPerfect_practiceSession';
const SAVE_INTERVAL = 5; // Save every 5 answers

export interface PracticeSessionData {
  mode: 'notes' | 'chords' | 'mixed';
  selectedItems: string[];
  difficulty: number;
  score: number;
  attempts: number;
  streak: number;
  startTime: string;
  lastUpdateTime: string;
}

export interface UsePracticeSessionResult {
  savedSession: PracticeSessionData | null;
  hasUnfinishedSession: boolean;
  saveSession: (data: PracticeSessionData) => Promise<void>;
  clearSession: () => Promise<void>;
  resumeSession: () => PracticeSessionData | null;
  checkForSession: () => Promise<void>;
}

export function usePracticeSession(): UsePracticeSessionResult {
  const [savedSession, setSavedSession] = useState<PracticeSessionData | null>(null);
  const [hasUnfinishedSession, setHasUnfinishedSession] = useState(false);
  const answerCountRef = useRef(0);
  const pendingSessionRef = useRef<PracticeSessionData | null>(null);

  // Check for existing session on mount
  const checkForSession = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(SESSION_KEY);
      if (data) {
        const session: PracticeSessionData = JSON.parse(data);
        // Check if session is less than 24 hours old
        const lastUpdate = new Date(session.lastUpdateTime);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < 24 && session.attempts > 0) {
          setSavedSession(session);
          setHasUnfinishedSession(true);
        } else {
          // Session expired, clear it
          await AsyncStorage.removeItem(SESSION_KEY);
        }
      }
    } catch (error) {
      console.error('Error checking for session:', error);
    }
  }, []);

  useEffect(() => {
    checkForSession();
  }, [checkForSession]);

  // Save session (batched - only saves every SAVE_INTERVAL answers)
  const saveSession = useCallback(async (data: PracticeSessionData) => {
    pendingSessionRef.current = {
      ...data,
      lastUpdateTime: new Date().toISOString(),
    };

    answerCountRef.current++;

    // Save every SAVE_INTERVAL answers or immediately if score changed significantly
    if (answerCountRef.current >= SAVE_INTERVAL) {
      try {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(pendingSessionRef.current));
        answerCountRef.current = 0;
      } catch (error) {
        console.error('Error saving session:', error);
      }
    }
  }, []);

  // Force save (for when leaving practice)
  const forceSave = useCallback(async () => {
    if (pendingSessionRef.current) {
      try {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(pendingSessionRef.current));
        answerCountRef.current = 0;
      } catch (error) {
        console.error('Error force saving session:', error);
      }
    }
  }, []);

  // Clear session
  const clearSession = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      setSavedSession(null);
      setHasUnfinishedSession(false);
      pendingSessionRef.current = null;
      answerCountRef.current = 0;
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }, []);

  // Resume session
  const resumeSession = useCallback((): PracticeSessionData | null => {
    if (savedSession) {
      setHasUnfinishedSession(false);
      return savedSession;
    }
    return null;
  }, [savedSession]);

  return {
    savedSession,
    hasUnfinishedSession,
    saveSession,
    clearSession,
    resumeSession,
    checkForSession,
  };
}
