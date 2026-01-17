import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import GlassCard from './GlassCard';
import {
  DuetSession,
  createDuetSession,
  joinDuetSession,
  getActiveDuetSessions,
  getDuetSession,
} from '../services/social';
import { getUserProfile } from '../services/leaderboard';

interface DuetModeLobbyProps {
  visible: boolean;
  onClose: () => void;
  onStartGame: (session: DuetSession) => void;
}

export default function DuetModeLobby({ visible, onClose, onStartGame }: DuetModeLobbyProps) {
  const [activeSessions, setActiveSessions] = useState<DuetSession[]>([]);
  const [mySession, setMySession] = useState<DuetSession | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSessions();
    }
  }, [visible]);

  const loadSessions = async () => {
    setRefreshing(true);
    const sessions = await getActiveDuetSessions();
    setActiveSessions(sessions);
    setRefreshing(false);
  };

  const handleCreateSession = async () => {
    const profile = await getUserProfile();

    Alert.alert(
      'Create Duet Session',
      'Choose a game mode:',
      [
        {
          text: 'Speed Mode',
          onPress: async () => {
            const session = await createDuetSession(
              profile.id,
              profile.displayName,
              profile.avatarEmoji,
              'speed',
              'medium'
            );
            setMySession(session);
            Alert.alert(
              'Session Created! 🎵',
              'Waiting for a friend to join...',
              [{ text: 'OK' }]
            );
          },
        },
        {
          text: 'Campaign',
          onPress: async () => {
            const session = await createDuetSession(
              profile.id,
              profile.displayName,
              profile.avatarEmoji,
              'campaign',
              'medium'
            );
            setMySession(session);
            Alert.alert(
              'Session Created! 🎵',
              'Waiting for a friend to join...',
              [{ text: 'OK' }]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleJoinSession = async (session: DuetSession) => {
    const profile = await getUserProfile();

    Alert.alert(
      'Join Duet Session',
      `Play ${session.gameMode} mode with ${session.players[0].userName}?`,
      [
        {
          text: 'Join',
          onPress: async () => {
            const joined = await joinDuetSession(
              session.id,
              profile.id,
              profile.displayName,
              profile.avatarEmoji
            );

            if (joined) {
              Alert.alert(
                'Joined! 🎉',
                'Both players ready. Starting in 3...',
                [
                  {
                    text: 'Ready',
                    onPress: () => {
                      onStartGame(joined);
                      onClose();
                    },
                  },
                ]
              );
            } else {
              Alert.alert('Error', 'Could not join session');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleStartMySession = async () => {
    if (!mySession) return;

    // Check if someone joined
    const updated = await getDuetSession(mySession.id);
    if (updated && updated.players.length === 2) {
      Alert.alert(
        'Opponent Found! 🎉',
        `${updated.players[1].userName} joined!`,
        [
          {
            text: 'Start Game',
            onPress: () => {
              onStartGame(updated);
              onClose();
            },
          },
        ]
      );
    } else {
      Alert.alert('Still Waiting', 'No one has joined yet. Keep this session open or share the code!');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>🎵 Duet Mode</Text>
              <Text style={styles.headerSubtitle}>Play together in real-time!</Text>
            </View>
          </View>

          {/* My Session */}
          {mySession && (
            <GlassCard style={styles.mySessionCard}>
              <View style={styles.mySessionHeader}>
                <Text style={styles.mySessionTitle}>Your Session</Text>
                <TouchableOpacity onPress={handleStartMySession}>
                  <Ionicons name="refresh" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.sessionInfo}>
                <View style={styles.playersRow}>
                  <Text style={styles.playerAvatar}>{mySession.players[0].avatar}</Text>
                  <Text style={styles.playerName}>{mySession.players[0].userName}</Text>
                  <Text style={styles.readyStatus}>✓ Ready</Text>
                </View>
                {mySession.players.length < 2 ? (
                  <View style={styles.waitingRow}>
                    <Text style={styles.waitingText}>Waiting for opponent...</Text>
                    <Text style={styles.waitingDots}>⏳</Text>
                  </View>
                ) : (
                  <View style={styles.playersRow}>
                    <Text style={styles.playerAvatar}>{mySession.players[1].avatar}</Text>
                    <Text style={styles.playerName}>{mySession.players[1].userName}</Text>
                    <Text style={styles.readyStatus}>✓ Joined</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.startButton} onPress={handleStartMySession}>
                <Text style={styles.startButtonText}>
                  {mySession.players.length === 2 ? 'Start Game' : 'Check Status'}
                </Text>
              </TouchableOpacity>
            </GlassCard>
          )}

          {/* Create Session Button */}
          {!mySession && (
            <TouchableOpacity style={styles.createButton} onPress={handleCreateSession}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.xpGradientEnd]}
                style={styles.createGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="add-circle" size={24} color={COLORS.textPrimary} />
                <Text style={styles.createButtonText}>Create New Session</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Active Sessions */}
          <View style={styles.sessionsContainer}>
            <View style={styles.sessionsHeader}>
              <Text style={styles.sessionsTitle}>Active Sessions</Text>
              <TouchableOpacity onPress={loadSessions} disabled={refreshing}>
                <Ionicons
                  name="refresh"
                  size={20}
                  color={refreshing ? COLORS.textMuted : COLORS.primary}
                />
              </TouchableOpacity>
            </View>

            {activeSessions.length === 0 ? (
              <GlassCard style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎮</Text>
                <Text style={styles.emptyText}>No active sessions</Text>
                <Text style={styles.emptySubtext}>Create one to get started!</Text>
              </GlassCard>
            ) : (
              activeSessions
                .filter(s => !mySession || s.id !== mySession.id)
                .map((session) => (
                  <GlassCard key={session.id} style={styles.sessionCard}>
                    <View style={styles.sessionCardHeader}>
                      <View>
                        <Text style={styles.sessionGameMode}>{session.gameMode} Mode</Text>
                        <Text style={styles.sessionHost}>
                          Host: {session.players[0].userName} {session.players[0].avatar}
                        </Text>
                      </View>
                      <View style={styles.sessionStatus}>
                        <Text style={styles.sessionStatusText}>
                          {session.players.length}/2
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.joinButton}
                      onPress={() => handleJoinSession(session)}
                    >
                      <Text style={styles.joinButtonText}>Join Session</Text>
                      <Ionicons name="arrow-forward" size={16} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                  </GlassCard>
                ))
            )}
          </View>

          {/* Info Box */}
          <GlassCard style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={COLORS.info} />
            <Text style={styles.infoText}>
              In Duet Mode, you and a friend play simultaneously. Highest score wins!
            </Text>
          </GlassCard>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  container: {
    flex: 1,
    padding: SPACING.lg,
    paddingTop: 60,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.md,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  mySessionCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
  },
  mySessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  mySessionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sessionInfo: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.glass,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  playerAvatar: {
    fontSize: 24,
  },
  playerName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  readyStatus: {
    color: COLORS.success,
    fontSize: 12,
  },
  waitingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.warning + '20',
    borderRadius: BORDER_RADIUS.md,
  },
  waitingText: {
    color: COLORS.warning,
    fontSize: 12,
  },
  waitingDots: {
    fontSize: 16,
  },
  startButton: {
    backgroundColor: COLORS.success,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  startButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  createButton: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  createButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sessionsContainer: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  sessionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sessionsTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sessionCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  sessionGameMode: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sessionHost: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  sessionStatus: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  sessionStatusText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: 'bold',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary + '40',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  joinButtonText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.info + '20',
  },
  infoText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
});
