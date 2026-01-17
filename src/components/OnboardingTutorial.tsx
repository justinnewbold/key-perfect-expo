import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import {
  OnboardingStep,
  OnboardingProgress,
  ONBOARDING_STEPS,
  getOnboardingProgress,
  completeCurrentStep,
  skipOnboarding,
  getCurrentStep,
} from '../services/onboarding';

const { width, height } = Dimensions.get('window');

interface OnboardingTutorialProps {
  visible: boolean;
  onComplete: () => void;
}

export default function OnboardingTutorial({ visible, onComplete }: OnboardingTutorialProps) {
  const [progress, setProgress] = useState<OnboardingProgress>({
    completed: false,
    currentStep: 0,
    stepsCompleted: [],
    skipped: false,
  });
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);

  useEffect(() => {
    loadProgress();
  }, [visible]);

  const loadProgress = async () => {
    const prog = await getOnboardingProgress();
    const step = await getCurrentStep();
    setProgress(prog);
    setCurrentStep(step);
  };

  const handleNext = async () => {
    const newProgress = await completeCurrentStep();
    setProgress(newProgress);

    if (newProgress.completed) {
      onComplete();
    } else {
      const nextStep = await getCurrentStep();
      setCurrentStep(nextStep);
    }
  };

  const handleSkip = async () => {
    await skipOnboarding();
    onComplete();
  };

  if (!currentStep) return null;

  const progressPercentage = ((progress.currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const isLastStep = progress.currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          style={styles.container}
        >
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {progress.currentStep + 1} / {ONBOARDING_STEPS.length}
            </Text>
          </View>

          {/* Skip Button */}
          {!isLastStep && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[COLORS.primary + '40', COLORS.xpGradientEnd + '40']}
                style={styles.iconGradient}
              >
                <Text style={styles.icon}>{currentStep.icon}</Text>
              </LinearGradient>
            </View>

            {/* Title & Description */}
            <Text style={styles.title}>{currentStep.title}</Text>
            <Text style={styles.description}>{currentStep.description}</Text>

            {/* Demo Action */}
            {currentStep.action === 'play_demo_note' && (
              <View style={styles.demoContainer}>
                <TouchableOpacity style={styles.demoButton}>
                  <Ionicons name="play" size={32} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.demoText}>Tap to hear a note</Text>

                {/* Demo Options */}
                <View style={styles.demoOptions}>
                  {['C', 'D', 'E', 'F', 'G'].map((note) => (
                    <TouchableOpacity
                      key={note}
                      style={[
                        styles.demoOption,
                        note === 'C' && styles.demoOptionCorrect,
                      ]}
                    >
                      <Text style={styles.demoOptionText}>{note}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.demoHint}>💡 Hint: It's the first note!</Text>
              </View>
            )}

            {/* Features List */}
            {currentStep.id === 'game_modes' && (
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>⚡</Text>
                  <Text style={styles.featureText}>Speed Mode - Race against time</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>❤️</Text>
                  <Text style={styles.featureText}>Survival Mode - 3 lives challenge</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🎯</Text>
                  <Text style={styles.featureText}>Campaign - Progressive learning</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🎵</Text>
                  <Text style={styles.featureText}>+5 more modes to explore!</Text>
                </View>
              </View>
            )}
          </View>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            {/* Dots Indicator */}
            <View style={styles.dotsContainer}>
              {ONBOARDING_STEPS.map((step, index) => (
                <View
                  key={step.id}
                  style={[
                    styles.dot,
                    index === progress.currentStep && styles.dotActive,
                    index < progress.currentStep && styles.dotCompleted,
                  ]}
                />
              ))}
            </View>

            {/* Next Button */}
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.xpGradientEnd]}
                style={styles.nextGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.nextText}>
                  {isLastStep ? 'Start Learning!' : 'Next'}
                </Text>
                <Ionicons
                  name={isLastStep ? 'checkmark' : 'arrow-forward'}
                  size={20}
                  color={COLORS.textPrimary}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    padding: SPACING.xl,
    paddingTop: 80,
  },
  progressContainer: {
    marginBottom: SPACING.xl,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
  skipButton: {
    position: 'absolute',
    top: 40,
    right: SPACING.lg,
    zIndex: 10,
  },
  skipText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.lg,
  },
  demoContainer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
    width: '100%',
  },
  demoButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.large,
  },
  demoText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: SPACING.lg,
  },
  demoOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  demoOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
  },
  demoOptionCorrect: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '20',
  },
  demoOptionText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  demoHint: {
    color: COLORS.warning,
    fontSize: 12,
  },
  featuresList: {
    marginTop: SPACING.xl,
    width: '100%',
    gap: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.cardBackground + '60',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  bottomActions: {
    paddingTop: SPACING.xl,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.glass,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  dotCompleted: {
    backgroundColor: COLORS.success,
  },
  nextButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.lg,
  },
  nextText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
