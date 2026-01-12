import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { useApp } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import { GAME_MODES } from '../types';

const { width } = Dimensions.get('window');

export default function GameModesScreen() {
  const navigation = useNavigation<any>();
  const { stats } = useApp();

  const getHighScore = (modeId: string) => {
    switch (modeId) {
      case 'speed':
        return stats.speedModeHighScore;
      case 'survival':
        return stats.survivalModeHighScore;
      case 'daily':
        return stats.dailyChallengesCompleted;
      default:
        return null;
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Game Modes</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Intro */}
        <GlassCard style={styles.introCard}>
          <Ionicons name="game-controller" size={32} color={COLORS.xpGradientStart} />
          <View style={styles.introText}>
            <Text style={styles.introTitle}>Challenge Yourself</Text>
            <Text style={styles.introSubtitle}>
              Different ways to train your ear
            </Text>
          </View>
        </GlassCard>

        {/* Game Modes */}
        <View style={styles.modesGrid}>
          {GAME_MODES.map((mode) => {
            const highScore = getHighScore(mode.id);
            
            return (
              <TouchableOpacity
                key={mode.id}
                style={[styles.modeCard, { borderColor: mode.color + '40' }]}
                onPress={() => navigation.navigate('GameMode', { mode: mode.id })}
              >
                <View style={[styles.modeIconContainer, { backgroundColor: mode.color + '30' }]}>
                  <Ionicons name={mode.icon as any} size={32} color={mode.color} />
                </View>
                
                <Text style={styles.modeName}>{mode.name}</Text>
                <Text style={styles.modeDesc}>{mode.description}</Text>
                
                {highScore !== null && highScore > 0 && (
                  <View style={styles.highScoreContainer}>
                    <Ionicons name="trophy" size={14} color={COLORS.warning} />
                    <Text style={styles.highScoreText}>
                      {mode.id === 'daily' ? `${highScore} completed` : `Best: ${highScore}`}
                    </Text>
                  </View>
                )}

                <View style={[styles.playBadge, { backgroundColor: mode.color }]}>
                  <Ionicons name="play" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mode Info */}
        <GlassCard style={styles.infoCard}>
          <Text style={styles.infoTitle}>🎯 Mode Guide</Text>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="timer" size={20} color={COLORS.speedMode} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Speed Mode</Text>
              <Text style={styles.infoText}>
                Race against the clock! Answer as many questions as possible in 30 seconds.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="heart" size={20} color={COLORS.survivalMode} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Survival</Text>
              <Text style={styles.infoText}>
                Start with 3 lives. Difficulty increases as you progress. How far can you go?
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar" size={20} color={COLORS.dailyChallenge} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Daily Challenge</Text>
              <Text style={styles.infoText}>
                A new challenge every day! Complete it for bonus XP rewards.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="git-compare" size={20} color={COLORS.intervals} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Intervals</Text>
              <Text style={styles.infoText}>
                Learn to identify all 12 intervals from minor 2nd to octave.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="trending-up" size={20} color={COLORS.progressions} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Progressions</Text>
              <Text style={styles.infoText}>
                Recognize common chord progressions used in popular music.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="activity" size={20} color={COLORS.scales} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Scales</Text>
              <Text style={styles.infoText}>
                Identify 14 different scales including modes and pentatonics.
              </Text>
            </View>
          </View>
        </GlassCard>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
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
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  introText: {
    flex: 1,
  },
  introTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  introSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  modesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  modeCard: {
    width: (width - SPACING.md * 2 - SPACING.sm) / 2,
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
    position: 'relative',
    ...SHADOWS.small,
  },
  modeIconContainer: {
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
    lineHeight: 16,
  },
  highScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
  },
  highScoreText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  playBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    marginTop: SPACING.md,
  },
  infoTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoText: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
