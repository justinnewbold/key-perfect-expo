import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { ScrollView } from '../utils/scrollComponents';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import { INTERVALS, SCALES, PROGRESSIONS, ALL_NOTES } from '../types';

const { width } = Dimensions.get('window');

const LEARN_SECTIONS = [
  { 
    id: 'circle', 
    title: 'Circle of Fifths', 
    icon: 'radio-button-on',
    color: '#FF6B6B',
    description: 'Understand key relationships'
  },
  { 
    id: 'intervals', 
    title: 'Intervals', 
    icon: 'git-compare',
    color: '#4ECDC4',
    description: 'Learn all 12 intervals'
  },
  { 
    id: 'scales', 
    title: 'Scales', 
    icon: 'stats-chart',
    color: '#FFE66D',
    description: '14 scales to master'
  },
  { 
    id: 'progressions', 
    title: 'Chord Progressions', 
    icon: 'trending-up',
    color: '#95E1D3',
    description: 'Common chord patterns'
  },
  { 
    id: 'theory', 
    title: 'Music Theory', 
    icon: 'book',
    color: '#F38181',
    description: 'Fundamentals explained'
  },
  { 
    id: 'piano', 
    title: 'Piano Reference', 
    icon: 'musical-note',
    color: '#AA96DA',
    description: 'Visual keyboard guide'
  },
];

export default function LearnScreen() {
  const navigation = useNavigation<any>();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const renderIntervals = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Intervals Reference</Text>
      <Text style={styles.modalSubtitle}>Learn to identify intervals by ear</Text>
      
      <ScrollView style={styles.modalScroll}>
        {INTERVALS.map((interval, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.intervalCard}
            onPress={() => {
              // Play interval
            }}
          >
            <View style={styles.intervalHeader}>
              <View style={styles.intervalBadge}>
                <Text style={styles.intervalSemitones}>{interval.semitones}</Text>
              </View>
              <View style={styles.intervalInfo}>
                <Text style={styles.intervalName}>{interval.name}</Text>
                <Text style={styles.intervalExample}>🎵 {interval.songExample}</Text>
              </View>
            </View>
            <Ionicons name="play-circle" size={28} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderScales = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Scale Reference</Text>
      <Text style={styles.modalSubtitle}>14 scales with interval patterns</Text>
      
      <ScrollView style={styles.modalScroll}>
        {SCALES.map((scale, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.scaleCard}
            onPress={() => {
              // Play scale
            }}
          >
            <View style={styles.scaleHeader}>
              <Text style={styles.scaleName}>{scale.name}</Text>
              <Ionicons name="play-circle" size={24} color={COLORS.textSecondary} />
            </View>
            <View style={styles.scaleIntervals}>
              {scale.intervals.map((interval, i) => (
                <View key={i} style={styles.intervalDot}>
                  <Text style={styles.intervalDotText}>{interval}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderProgressions = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Chord Progressions</Text>
      <Text style={styles.modalSubtitle}>Common patterns in popular music</Text>
      
      <ScrollView style={styles.modalScroll}>
        {PROGRESSIONS.map((prog, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.progressionCard}
            onPress={() => {
              // Play progression
            }}
          >
            <View style={styles.progressionHeader}>
              <Text style={styles.progressionName}>{prog.name}</Text>
              <Ionicons name="play-circle" size={24} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.progressionNumerals}>{prog.numerals}</Text>
            <Text style={styles.progressionDesc}>{prog.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCircleOfFifths = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Circle of Fifths</Text>
      <Text style={styles.modalSubtitle}>Understanding key relationships</Text>
      
      <View style={styles.circleContainer}>
        <View style={styles.circle}>
          {ALL_NOTES.map((note, index) => {
            const angle = (index * 30 - 90) * (Math.PI / 180);
            const radius = 100;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            
            return (
              <TouchableOpacity
                key={note}
                style={[
                  styles.circleNote,
                  {
                    transform: [
                      { translateX: x },
                      { translateY: y },
                    ],
                  },
                ]}
                onPress={() => {
                  // Play note
                }}
              >
                <Text style={styles.circleNoteText}>{note}</Text>
              </TouchableOpacity>
            );
          })}
          <View style={styles.circleCenter}>
            <Text style={styles.circleCenterText}>Tap to{'\n'}hear</Text>
          </View>
        </View>
      </View>

      <View style={styles.circleInfo}>
        <Text style={styles.circleInfoTitle}>How it works:</Text>
        <Text style={styles.circleInfoText}>
          • Moving clockwise adds sharps{'\n'}
          • Moving counter-clockwise adds flats{'\n'}
          • Adjacent keys are related{'\n'}
          • Opposite keys are furthest apart
        </Text>
      </View>
    </View>
  );

  const renderTheory = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Music Theory Basics</Text>
      
      <ScrollView style={styles.modalScroll}>
        <View style={styles.theorySection}>
          <Text style={styles.theoryTitle}>🎵 Notes</Text>
          <Text style={styles.theoryText}>
            There are 12 notes in Western music: C, C#, D, D#, E, F, F#, G, G#, A, A#, B. 
            The distance between adjacent notes is called a semitone (half step).
          </Text>
        </View>

        <View style={styles.theorySection}>
          <Text style={styles.theoryTitle}>🎹 Octaves</Text>
          <Text style={styles.theoryText}>
            An octave is the interval between one pitch and another with double or half 
            its frequency. Moving up 12 semitones brings you to the same note, one octave higher.
          </Text>
        </View>

        <View style={styles.theorySection}>
          <Text style={styles.theoryTitle}>🎸 Intervals</Text>
          <Text style={styles.theoryText}>
            An interval is the distance between two notes. Intervals are named by their 
            number (2nd, 3rd, 4th, etc.) and quality (major, minor, perfect, augmented, diminished).
          </Text>
        </View>

        <View style={styles.theorySection}>
          <Text style={styles.theoryTitle}>🎶 Chords</Text>
          <Text style={styles.theoryText}>
            A chord is three or more notes played together. The most common chords are 
            major (happy) and minor (sad), built from the 1st, 3rd, and 5th scale degrees.
          </Text>
        </View>

        <View style={styles.theorySection}>
          <Text style={styles.theoryTitle}>📐 Scales</Text>
          <Text style={styles.theoryText}>
            A scale is a sequence of notes in ascending or descending order. The major 
            scale follows the pattern: W-W-H-W-W-W-H (W=whole step, H=half step).
          </Text>
        </View>

        <View style={styles.theorySection}>
          <Text style={styles.theoryTitle}>🔑 Keys</Text>
          <Text style={styles.theoryText}>
            A key defines which notes sound "at home" in a piece of music. The key signature 
            tells you which notes are sharp or flat throughout the piece.
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  const renderPiano = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Piano Reference</Text>
      <Text style={styles.modalSubtitle}>Tap keys to hear notes</Text>
      
      <View style={styles.pianoContainer}>
        <View style={styles.pianoRow}>
          {/* White keys */}
          {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((note) => (
            <TouchableOpacity
              key={note}
              style={styles.whiteKey}
              onPress={() => {
                // Play note
              }}
            >
              <Text style={styles.whiteKeyText}>{note}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.blackKeyRow}>
          {/* Black keys */}
          {['C#', 'D#', null, 'F#', 'G#', 'A#'].map((note, index) => (
            note ? (
              <TouchableOpacity
                key={note}
                style={[
                  styles.blackKey,
                  { left: 30 + index * 42 + (index > 1 ? 42 : 0) }
                ]}
                onPress={() => {
                  // Play note
                }}
              >
                <Text style={styles.blackKeyText}>{note}</Text>
              </TouchableOpacity>
            ) : null
          ))}
        </View>
      </View>

      <View style={styles.pianoInfo}>
        <Text style={styles.pianoInfoText}>
          The piano keyboard is a visual representation of the 12-note chromatic scale. 
          White keys are natural notes (C, D, E, F, G, A, B) and black keys are 
          sharps/flats (C#/Db, D#/Eb, F#/Gb, G#/Ab, A#/Bb).
        </Text>
      </View>
    </View>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'intervals': return renderIntervals();
      case 'scales': return renderScales();
      case 'progressions': return renderProgressions();
      case 'circle': return renderCircleOfFifths();
      case 'theory': return renderTheory();
      case 'piano': return renderPiano();
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        bounces={true}
        overScrollMode="always"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Learn</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Intro */}
        <GlassCard style={styles.introCard}>
          <View style={styles.introHeader}>
            <Ionicons name="school" size={32} color={COLORS.warning} />
            <View style={styles.introText}>
              <Text style={styles.introTitle}>Music Theory Resources</Text>
              <Text style={styles.introSubtitle}>
                Interactive guides to help you understand music
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Section Grid */}
        <View style={styles.sectionGrid}>
          {LEARN_SECTIONS.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[styles.sectionCard, { borderColor: section.color + '40' }]}
              onPress={() => setActiveSection(section.id)}
              accessibilityLabel={section.title}
              accessibilityRole="button"
              accessibilityHint={section.description}
            >
              <View style={[styles.sectionIcon, { backgroundColor: section.color + '30' }]}>
                <Ionicons name={section.icon as any} size={28} color={section.color} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionDesc}>{section.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tips */}
        <GlassCard style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Ear Training Tips</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Practice daily, even just 5 minutes</Text>
            <Text style={styles.tipItem}>• Focus on one concept at a time</Text>
            <Text style={styles.tipItem}>• Sing intervals and scales out loud</Text>
            <Text style={styles.tipItem}>• Use reference songs for intervals</Text>
            <Text style={styles.tipItem}>• Listen actively to music you enjoy</Text>
          </View>
        </GlassCard>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={activeSection !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveSection(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              style={styles.modalGradient}
            >
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setActiveSection(null)}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>

              {renderSectionContent()}
            </LinearGradient>
          </View>
        </View>
      </Modal>
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
    marginBottom: SPACING.md,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
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
    marginTop: 2,
  },
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  sectionCard: {
    width: (width - SPACING.md * 2 - SPACING.sm) / 2,
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  tipsCard: {
    marginTop: SPACING.md,
  },
  tipsTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  tipsList: {
    gap: SPACING.xs,
  },
  tipItem: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '90%',
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
  },
  modalGradient: {
    flex: 1,
    padding: SPACING.md,
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: SPACING.sm,
  },
  modalContent: {
    flex: 1,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.md,
  },
  modalScroll: {
    flex: 1,
  },
  intervalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  intervalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  intervalBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.xpGradientStart + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intervalSemitones: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  intervalInfo: {
    gap: 2,
  },
  intervalName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  intervalExample: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  scaleCard: {
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  scaleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  scaleName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  scaleIntervals: {
    flexDirection: 'row',
    gap: 4,
  },
  intervalDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.xpGradientStart + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intervalDotText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
  progressionCard: {
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  progressionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  progressionName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  progressionNumerals: {
    color: COLORS.xpGradientStart,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  progressionDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 280,
    marginVertical: SPACING.md,
  },
  circle: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleNote: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleNoteText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  circleCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.xpGradientStart + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleCenterText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  circleInfo: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  circleInfoTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  circleInfoText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  theorySection: {
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  theoryTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  theoryText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  pianoContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginVertical: SPACING.md,
    height: 160,
    position: 'relative',
  },
  pianoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
  },
  whiteKey: {
    width: 40,
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
  },
  whiteKeyText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
  },
  blackKeyRow: {
    position: 'absolute',
    top: SPACING.md,
    left: 0,
    right: 0,
    height: 70,
  },
  blackKey: {
    position: 'absolute',
    width: 28,
    height: 70,
    backgroundColor: '#222',
    borderRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 6,
  },
  blackKeyText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
  },
  pianoInfo: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  pianoInfoText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
});
