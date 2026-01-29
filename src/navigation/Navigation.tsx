import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../utils/theme';
import BadgeIcon from '../components/BadgeIcon';
import { useApp } from '../context/AppContext';

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

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Levels" component={LevelsScreen} />
      <Stack.Screen name="LevelGame" component={LevelGameScreen} />
      <Stack.Screen name="GameModes" component={GameModesListScreen} />
      <Stack.Screen name="GameMode" component={GameModeScreen} />
      <Stack.Screen name="WeakAreas" component={WeakAreasPracticeScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="SingBack" component={SingBackScreen} />
    </Stack.Navigator>
  );
}

// Practice Stack
function PracticeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PracticeMain" component={PracticeScreen} />
    </Stack.Navigator>
  );
}

// Learn Stack
function LearnStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LearnMain" component={LearnScreen} />
    </Stack.Navigator>
  );
}

// Stats Stack
function StatsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StatsMain" component={StatsScreen} />
    </Stack.Navigator>
  );
}

// Tab icon component
function TabIcon({ name, focused, badgeCount, showBadge }: { name: string; focused: boolean; badgeCount?: number; showBadge?: boolean }) {
  return (
    <BadgeIcon count={badgeCount} showBadge={showBadge} variant={badgeCount ? 'count' : 'dot'}>
      <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
        <Ionicons
          name={name as any}
          size={24}
          color={focused ? COLORS.textPrimary : COLORS.textMuted}
        />
      </View>
    </BadgeIcon>
  );
}

// Main Navigation
export default function Navigation() {
  const { stats } = useApp();

  // Calculate badge counts - example usage
  // In a real app, these would come from actual data
  const newAchievementsCount = 0; // Could be: stats?.unreadAchievements || 0
  const hasNewContent = false; // Could be: stats?.hasNewLessons || false

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
        }}
        screenListeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
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
              <TabIcon
                name={focused ? "musical-notes" : "musical-notes-outline"}
                focused={focused}
                showBadge={hasNewContent}
              />
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
              <TabIcon
                name={focused ? "stats-chart" : "stats-chart-outline"}
                focused={focused}
                badgeCount={newAchievementsCount}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(102, 126, 234, 0.95)',
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
