import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { ALL_NOTES } from '../types';

const { width } = Dimensions.get('window');

const GUITAR_TOOLS = [
  { id: 'tuner', title: 'Guitar Tuner', icon: 'radio', color: '#FF6B6B', desc: 'Tune your guitar with precision' },
  { id: 'metronome', title: 'Metronome', icon: 'timer', color: '#4ECDC4', desc: 'Keep perfect time' },
  { id: 'fretboard', title: 'Fretboard Trainer', icon: 'grid', color: '#FFE66D', desc: 'Learn the fretboard' },
  { id: 'chords', title: 'Chord Library', icon: 'albums', color: '#95E1D3', desc: 'Common chord shapes' },
  { id: 'scales', title: 'Scale Patterns', icon: 'analytics', color: '#F38181', desc: 'Visual scale shapes' },
];

const STANDARD_TUNING = ['E', 'A', 'D', 'G', 'B', 'E'];
const FRETS = 12;

// Common chord shapes
const CHORD_SHAPES = [
  { name: 'C Major', frets: ['x', 3, 2, 0, 1, 0], fingers: ['x', 3, 2, 0, 1, 0] },
  { name: 'G Major', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  { name: 'D Major', frets: ['x', 'x', 0, 2, 3, 2], fingers: ['x', 'x', 0, 1, 3, 2] },
  { name: 'A Major', frets: ['x', 0, 2, 2, 2, 0], fingers: ['x', 0, 2, 1, 3, 0] },
  { name: 'E Major', frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  { name: 'Am', frets: ['x', 0, 2, 2, 1, 0], fingers: ['x', 0, 2, 3, 1, 0] },
  { name: 'Em', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  { name: 'Dm', frets: ['x', 'x', 0, 2, 3, 1], fingers: ['x', 'x', 0, 2, 3, 1] },
];

export default function GuitarScreen() {
  const navigation = useNavigation<any>();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  // Metronome state
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const [timeSignature, setTimeSignature] = useState(4);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Tuner state
  const [selectedString, setSelectedString] = useState(0);

  // Fretboard trainer state
  const [targetNote, setTargetNote] = useState('');
  const [score, setScore] = useState(0);

  // Stop metronome when switching away from metronome tool
  useEffect(() => {
    if (activeTool !== 'metronome' && isPlaying) {
      setIsPlaying(false);
    }
  }, [activeTool, isPlaying]);

  useEffect(() => {
    if (isPlaying && activeTool === 'metronome') {
      const interval = 60000 / bpm;
      intervalRef.current = setInterval(() => {
        setBeat(prev => (prev + 1) % timeSignature);

        // Pulse animation
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 50,
            useNativeDriver: true,
          }),
        ]).start();
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, bpm, timeSignature, activeTool]);

  const startFretboardGame = () => {
    const randomNote = ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)];
    setTargetNote(randomNote);
    setScore(0);
  };

  const handleFretPress = (string: number, fret: number) => {
    const openNote = STANDARD_TUNING[string];
    const openIndex = ALL_NOTES.indexOf(openNote);
    const noteIndex = (openIndex + fret) % 12;
    const note = ALL_NOTES[noteIndex];

    if (note === targetNote) {
      setScore(prev => prev + 1);
      const randomNote = ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)];
      setTargetNote(randomNote);
    }
  };

  const renderTuner = () => (
    <View style={styles.toolContent}>
      <Text style={styles.toolTitle}>🎸 Guitar Tuner</Text>
      <Text style={styles.toolDesc}>Tap a string to hear the reference pitch</Text>
      
      <View style={styles.tunerStrings}>
        {STANDARD_TUNING.map((note, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.tunerString,
              selectedString === index && styles.tunerStringActive,
            ]}
            onPress={() => {
              setSelectedString(index);
              // Play reference note
            }}
          >
            <Text style={styles.tunerStringNumber}>{6 - index}</Text>
            <View style={[
              styles.stringLine,
              { height: 2 + index * 0.5 }
            ]} />
            <Text style={styles.tunerStringNote}>{note}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tunerDisplay}>
        <Text style={styles.tunerNote}>{STANDARD_TUNING[selectedString]}</Text>
        <Text style={styles.tunerFreq}>
          String {6 - selectedString} - {['E2', 'A2', 'D3', 'G3', 'B3', 'E4'][selectedString]}
        </Text>
      </View>

      <Button 
        title="Play Reference Tone" 
        onPress={() => {
          // Play reference note
        }}
        variant="primary"
        size="lg"
      />
    </View>
  );

  const renderMetronome = () => (
    <View style={styles.toolContent}>
      <Text style={styles.toolTitle}>⏱️ Metronome</Text>
      
      {/* Beat visualization */}
      <View style={styles.beatContainer}>
        {Array.from({ length: timeSignature }).map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.beatDot,
              beat === index && styles.beatDotActive,
              beat === index && { transform: [{ scale: pulseAnim }] },
              index === 0 && styles.beatDotAccent,
            ]}
          />
        ))}
      </View>

      {/* BPM display */}
      <View style={styles.bpmDisplay}>
        <TouchableOpacity 
          style={styles.bpmButton}
          onPress={() => setBpm(prev => Math.max(40, prev - 5))}
        >
          <Ionicons name="remove" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.bpmValue}>
          <Text style={styles.bpmNumber}>{bpm}</Text>
          <Text style={styles.bpmLabel}>BPM</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.bpmButton}
          onPress={() => setBpm(prev => Math.min(240, prev + 5))}
        >
          <Ionicons name="add" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Time signature */}
      <View style={styles.timeSignatureRow}>
        {[3, 4, 6].map((sig) => (
          <TouchableOpacity
            key={sig}
            style={[
              styles.timeSignatureButton,
              timeSignature === sig && styles.timeSignatureActive,
            ]}
            onPress={() => setTimeSignature(sig)}
          >
            <Text style={[
              styles.timeSignatureText,
              timeSignature === sig && styles.timeSignatureTextActive,
            ]}>
              {sig}/4
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Play/Stop */}
      <TouchableOpacity
        style={[styles.playButton, isPlaying && styles.playButtonActive]}
        onPress={() => setIsPlaying(!isPlaying)}
      >
        <Ionicons 
          name={isPlaying ? "pause" : "play"} 
          size={48} 
          color={COLORS.textPrimary} 
        />
      </TouchableOpacity>

      {/* Tempo presets */}
      <View style={styles.tempoPresets}>
        {[60, 80, 100, 120, 140, 160].map((tempo) => (
          <TouchableOpacity
            key={tempo}
            style={[styles.tempoPreset, bpm === tempo && styles.tempoPresetActive]}
            onPress={() => setBpm(tempo)}
          >
            <Text style={styles.tempoPresetText}>{tempo}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFretboard = () => (
    <View style={styles.toolContent}>
      <Text style={styles.toolTitle}>🎯 Fretboard Trainer</Text>
      
      {targetNote ? (
        <>
          <View style={styles.targetContainer}>
            <Text style={styles.targetLabel}>Find this note:</Text>
            <Text style={styles.targetNote}>{targetNote}</Text>
            <Text style={styles.scoreText}>Score: {score}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.fretboard}>
              {/* Fret numbers */}
              <View style={styles.fretNumbers}>
                <View style={styles.fretNumberCell} />
                {Array.from({ length: FRETS }).map((_, fret) => (
                  <View key={fret} style={styles.fretNumberCell}>
                    <Text style={styles.fretNumber}>{fret}</Text>
                  </View>
                ))}
              </View>

              {/* Strings */}
              {STANDARD_TUNING.map((openNote, stringIndex) => (
                <View key={stringIndex} style={styles.stringRow}>
                  <View style={styles.openNote}>
                    <Text style={styles.openNoteText}>{openNote}</Text>
                  </View>
                  {Array.from({ length: FRETS }).map((_, fret) => {
                    const noteIndex = (ALL_NOTES.indexOf(openNote) + fret) % 12;
                    const note = ALL_NOTES[noteIndex];
                    return (
                      <TouchableOpacity
                        key={fret}
                        style={styles.fretCell}
                        onPress={() => handleFretPress(stringIndex, fret)}
                      >
                        <View style={[
                          styles.fretDot,
                          (fret === 3 || fret === 5 || fret === 7 || fret === 9 || fret === 12) && 
                          stringIndex === 2 && styles.fretMarker,
                        ]} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </>
      ) : (
        <View style={styles.startContainer}>
          <Text style={styles.startText}>Learn the fretboard by finding notes!</Text>
          <Button 
            title="Start Training" 
            onPress={startFretboardGame}
            variant="primary"
            size="lg"
          />
        </View>
      )}
    </View>
  );

  const renderChords = () => (
    <View style={styles.toolContent}>
      <Text style={styles.toolTitle}>🎸 Chord Library</Text>
      <Text style={styles.toolDesc}>Common chord shapes</Text>
      
      <ScrollView style={styles.chordList}>
        {CHORD_SHAPES.map((chord, index) => (
          <View key={index} style={styles.chordCard}>
            <Text style={styles.chordName}>{chord.name}</Text>
            <View style={styles.chordDiagram}>
              {/* Frets */}
              {[0, 1, 2, 3, 4].map((fret) => (
                <View key={fret} style={styles.chordFret}>
                  {chord.frets.map((f, string) => (
                    <View key={string} style={styles.chordPosition}>
                      {f === fret && f !== 'x' && f !== 0 && (
                        <View style={styles.chordDot}>
                          <Text style={styles.chordFinger}>{chord.fingers[string]}</Text>
                        </View>
                      )}
                      {fret === 0 && f === 0 && (
                        <View style={styles.openString} />
                      )}
                      {fret === 0 && f === 'x' && (
                        <Text style={styles.mutedString}>×</Text>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderToolContent = () => {
    switch (activeTool) {
      case 'tuner': return renderTuner();
      case 'metronome': return renderMetronome();
      case 'fretboard': return renderFretboard();
      case 'chords': return renderChords();
      default: return null;
    }
  };

  if (activeTool) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setActiveTool(null)}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Guitar Tools</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView
          contentContainerStyle={styles.toolContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          bounces={true}
          overScrollMode="always"
        >
          {renderToolContent()}
        </ScrollView>
      </View>
    );
  }

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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Guitar Tools</Text>
          <View style={{ width: 24 }} />
        </View>

        <GlassCard style={styles.introCard}>
          <Ionicons name="musical-notes" size={32} color={COLORS.warning} />
          <View style={styles.introText}>
            <Text style={styles.introTitle}>Tools for Guitarists</Text>
            <Text style={styles.introSubtitle}>Tuner, metronome, and more</Text>
          </View>
        </GlassCard>

        <View style={styles.toolsGrid}>
          {GUITAR_TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={[styles.toolCard, { borderColor: tool.color + '40' }]}
              onPress={() => setActiveTool(tool.id)}
            >
              <View style={[styles.toolIcon, { backgroundColor: tool.color + '30' }]}>
                <Ionicons name={tool.icon as any} size={32} color={tool.color} />
              </View>
              <Text style={styles.toolName}>{tool.title}</Text>
              <Text style={styles.toolDesc}>{tool.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    paddingHorizontal: SPACING.md,
    paddingTop: 60,
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
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  toolCard: {
    width: (width - SPACING.md * 2 - SPACING.sm) / 2,
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  toolIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  toolName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  toolDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  toolContainer: {
    padding: SPACING.md,
  },
  toolContent: {
    flex: 1,
  },
  toolTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  tunerStrings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  tunerString: {
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  tunerStringActive: {
    backgroundColor: COLORS.xpGradientStart + '30',
  },
  tunerStringNumber: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  stringLine: {
    width: 4,
    height: 80,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 2,
    marginVertical: SPACING.sm,
  },
  tunerStringNote: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  tunerDisplay: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  tunerNote: {
    color: COLORS.textPrimary,
    fontSize: 64,
    fontWeight: 'bold',
  },
  tunerFreq: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  beatContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginVertical: SPACING.xl,
  },
  beatDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
  },
  beatDotActive: {
    backgroundColor: COLORS.xpGradientStart,
  },
  beatDotAccent: {
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  bpmDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  bpmButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  bpmValue: {
    alignItems: 'center',
  },
  bpmNumber: {
    color: COLORS.textPrimary,
    fontSize: 48,
    fontWeight: 'bold',
  },
  bpmLabel: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  timeSignatureRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  timeSignatureButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackground,
  },
  timeSignatureActive: {
    backgroundColor: COLORS.xpGradientStart,
  },
  timeSignatureText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  timeSignatureTextActive: {
    color: COLORS.textPrimary,
  },
  playButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.glass,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
  },
  playButtonActive: {
    backgroundColor: COLORS.xpGradientStart + '50',
    borderColor: COLORS.xpGradientStart,
  },
  tempoPresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  tempoPreset: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackground,
  },
  tempoPresetActive: {
    backgroundColor: COLORS.xpGradientStart + '50',
  },
  tempoPresetText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  targetContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  targetLabel: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  targetNote: {
    color: COLORS.warning,
    fontSize: 64,
    fontWeight: 'bold',
  },
  scoreText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    marginTop: SPACING.sm,
  },
  fretboard: {
    backgroundColor: '#8B4513',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  fretNumbers: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  fretNumberCell: {
    width: 40,
    alignItems: 'center',
  },
  fretNumber: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  stringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  openNote: {
    width: 40,
    alignItems: 'center',
  },
  openNoteText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  fretCell: {
    width: 40,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 2,
    borderLeftColor: '#666',
  },
  fretDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  fretMarker: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  startContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  startText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  chordList: {
    flex: 1,
    marginTop: SPACING.md,
  },
  chordCard: {
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  chordName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  chordDiagram: {
    flexDirection: 'row',
  },
  chordFret: {
    flex: 1,
    height: 30,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  chordPosition: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chordDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.xpGradientStart,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chordFinger: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  openString: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
  },
  mutedString: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});
