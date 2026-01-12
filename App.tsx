import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AppProvider, useApp } from './src/context/AppContext';
import Navigation from './src/navigation/Navigation';
import ErrorBoundary from './src/components/ErrorBoundary';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AchievementToast from './src/components/AchievementToast';
import { COLORS } from './src/utils/theme';
import { isOnboardingCompleted, markOnboardingCompleted } from './src/utils/storage';

// Loading screen component
function LoadingScreen() {
  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.loadingContainer}
    >
      <View style={styles.loadingContent}>
        <Text style={styles.loadingTitle}>🎵 Key Perfect</Text>
        <ActivityIndicator size="large" color={COLORS.textPrimary} style={styles.spinner} />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    </LinearGradient>
  );
}

// Main app content with loading state and onboarding
function AppContent() {
  const { isLoading, newAchievements, clearNewAchievements } = useApp();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [currentAchievement, setCurrentAchievement] = useState<string | null>(null);

  useEffect(() => {
    async function checkOnboarding() {
      const completed = await isOnboardingCompleted();
      setShowOnboarding(!completed);
    }
    checkOnboarding();
  }, []);

  // Show achievement notifications one at a time
  useEffect(() => {
    if (newAchievements.length > 0 && !currentAchievement) {
      setCurrentAchievement(newAchievements[0]);
    }
  }, [newAchievements, currentAchievement]);

  const handleAchievementHide = () => {
    setCurrentAchievement(null);
    clearNewAchievements();
  };

  if (isLoading || showOnboarding === null) {
    return <LoadingScreen />;
  }

  if (showOnboarding) {
    return (
      <OnboardingScreen
        onComplete={async () => {
          await markOnboardingCompleted();
          setShowOnboarding(false);
        }}
      />
    );
  }

  return (
    <>
      <Navigation />
      <AchievementToast
        achievementId={currentAchievement}
        onHide={handleAchievementHide}
      />
    </>
  );
}

// Root app component
// On web, GestureHandlerRootView can block native scrolling, so we use a plain View instead
const RootWrapper = Platform.OS === 'web' ? View : GestureHandlerRootView;

export default function App() {
  return (
    <RootWrapper style={styles.container}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AppProvider>
            <StatusBar style="light" />
            <AppContent />
          </AppProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </RootWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 24,
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});
