import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../utils/theme';

// Screens
import HomeScreen from '../screens/HomeScreen';
import LevelsScreen from '../screens/LevelsScreen';
import LevelGameScreen from '../screens/LevelGameScreen';
import PracticeScreen from '../screens/PracticeScreen';
import LearnScreen from '../screens/LearnScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import GameModesListScreen from '../screens/GameModesListScreen';
import GameModeScreen from '../screens/GameModeScreen';
import WeakAreasPracticeScreen from '../screens/WeakAreasPracticeScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import SingBackScreen from '../screens/SingBackScreen';
import MistakeReviewScreen from '../screens/MistakeReviewScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// iOS native screen options
const iosScreenOptions = {
  headerShown: false,
  animation: 'default' as const,
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  animationMatchesGesture: true,
  contentStyle: { backgroundColor: 'transparent' },
};

// Home Stack with native iOS transitions
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={iosScreenOptions}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen
        name="Levels"
        component={LevelsScreen}
        options={{
          headerShown: true,
          headerLargeTitle: true,
          headerTransparent: true,
          headerBlurEffect: 'prominent',
          headerLargeTitleStyle: { color: COLORS.textPrimary },
          headerTitleStyle: { color: COLORS.textPrimary },
          headerTintColor: COLORS.textPrimary,
          title: 'Levels',
        }}
      />
      <Stack.Screen
        name="LevelGame"
        component={LevelGameScreen}
        options={{
          gestureEnabled: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="GameModes" component={GameModesListScreen} />
      <Stack.Screen
        name="GameMode"
        component={GameModeScreen}
        options={{
          gestureEnabled: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="WeakAreas" component={WeakAreasPracticeScreen} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: true,
          headerLargeTitle: true,
          headerTransparent: true,
          headerBlurEffect: 'prominent',
          headerLargeTitleStyle: { color: COLORS.textPrimary },
          headerTitleStyle: { color: COLORS.textPrimary },
          headerTintColor: COLORS.textPrimary,
          title: 'Settings',
        }}
      />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="SingBack" component={SingBackScreen} />
      <Stack.Screen
        name="MistakeReview"
        component={MistakeReviewScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}

// Practice Stack
function PracticeStack() {
  return (
    <Stack.Navigator screenOptions={iosScreenOptions}>
      <Stack.Screen name="PracticeMain" component={PracticeScreen} />
    </Stack.Navigator>
  );
}

// Learn Stack
function LearnStack() {
  return (
    <Stack.Navigator screenOptions={iosScreenOptions}>
      <Stack.Screen name="LearnMain" component={LearnScreen} />
    </Stack.Navigator>
  );
}

// Stats Stack
function StatsStack() {
  return (
    <Stack.Navigator screenOptions={iosScreenOptions}>
      <Stack.Screen name="StatsMain" component={StatsScreen} />
    </Stack.Navigator>
  );
}

// Tab icon component with iOS-style visual feedback
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Ionicons
        name={name as any}
        size={24}
        color={focused ? COLORS.textPrimary : COLORS.textMuted}
      />
    </View>
  );
}

// Custom tab bar background with blur for iOS
function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={80}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
    );
  }
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(102, 126, 234, 0.95)' }]} />;
}

// Main Navigation
export default function Navigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: true,
          tabBarActiveTintColor: COLORS.textPrimary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarLabelStyle: styles.tabLabel,
          tabBarBackground: TabBarBackground,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon name={focused ? "home" : "home-outline"} focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Practice"
          component={PracticeStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon name={focused ? "musical-notes" : "musical-notes-outline"} focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Learn"
          component={LearnStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon name={focused ? "book" : "book-outline"} focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon name={focused ? "stats-chart" : "stats-chart-outline"} focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(102, 126, 234, 0.95)',
    borderTopWidth: 0,
    height: 85,
    paddingTop: 10,
    paddingBottom: 25,
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
