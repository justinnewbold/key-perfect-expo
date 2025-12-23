import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AppProvider, useApp } from './src/context/AppContext';
import Navigation from './src/navigation/Navigation';
import ErrorBoundary from './src/components/ErrorBoundary';
import { COLORS } from './src/utils/theme';

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

// Main app content with loading state
function AppContent() {
  const { isLoading } = useApp();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <Navigation />;
}

// Root app component
export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AppProvider>
            <StatusBar style="light" />
            <AppContent />
          </AppProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
