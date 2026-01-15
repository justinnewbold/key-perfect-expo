import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import GlassCard from './GlassCard';
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
  purchaseSubscription,
  getActiveSubscription,
  isTrialAvailable,
  startFreeTrial,
  ActiveSubscription,
} from '../services/subscription';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: (tier: string) => void;
}

export default function SubscriptionModal({ visible, onClose, onSubscribe }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(SUBSCRIPTION_PLANS[2]); // Default to annual
  const [trialAvailable, setTrialAvailable] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);

  useEffect(() => {
    loadData();
  }, [visible]);

  const loadData = async () => {
    const [trial, subscription] = await Promise.all([
      isTrialAvailable(),
      getActiveSubscription(),
    ]);
    setTrialAvailable(trial);
    setActiveSubscription(subscription);
  };

  const handlePurchase = async () => {
    if (selectedPlan.id === 'free') {
      onClose();
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Subscribe to ${selectedPlan.name} for ${selectedPlan.price}/${selectedPlan.billingPeriod}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: async () => {
            try {
              const result = await purchaseSubscription(selectedPlan.id);

              if (result.success) {
                Alert.alert(
                  'Welcome to Pro! 🎉',
                  'You now have access to all premium features!',
                  [
                    {
                      text: 'Start Exploring',
                      onPress: () => {
                        onSubscribe(selectedPlan.id);
                        onClose();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Purchase Failed', result.error || 'Please try again');
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };

  const handleStartTrial = async () => {
    Alert.alert(
      'Start 7-Day Free Trial',
      'Try all Pro features free for 7 days. Cancel anytime.',
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Start Trial',
          onPress: async () => {
            const result = await startFreeTrial();
            if (result.success) {
              Alert.alert(
                'Trial Started! 🎉',
                'Enjoy 7 days of Pro features. We\'ll remind you before it ends.',
                [
                  {
                    text: 'Explore',
                    onPress: () => {
                      onSubscribe('trial');
                      onClose();
                    },
                  },
                ]
              );
            } else {
              Alert.alert('Error', result.error || 'Could not start trial');
            }
          },
        },
      ]
    );
  };

  const proPlans = SUBSCRIPTION_PLANS.filter(p => p.id !== 'free');

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
              <Text style={styles.headerTitle}>Upgrade to Pro</Text>
              <Text style={styles.headerSubtitle}>Unlock your full potential</Text>
            </View>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {/* Trial Banner */}
            {trialAvailable && !activeSubscription && (
              <TouchableOpacity style={styles.trialBanner} onPress={handleStartTrial}>
                <View style={styles.trialContent}>
                  <Text style={styles.trialTitle}>🎁 7-Day Free Trial</Text>
                  <Text style={styles.trialSubtitle}>Try everything, risk-free</Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color={COLORS.warning} />
              </TouchableOpacity>
            )}

            {/* Plans */}
            <View style={styles.plansContainer}>
              {proPlans.map((plan) => {
                const isSelected = selectedPlan.id === plan.id;

                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      isSelected && styles.planCardSelected,
                      plan.popular && styles.planCardPopular,
                    ]}
                    onPress={() => setSelectedPlan(plan)}
                  >
                    {plan.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>MOST POPULAR</Text>
                      </View>
                    )}

                    <View style={styles.planHeader}>
                      <View>
                        <Text style={styles.planBadge}>{plan.badge}</Text>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <View style={styles.priceRow}>
                          <Text style={styles.planPrice}>{plan.price}</Text>
                          <Text style={styles.planPeriod}>/{plan.billingPeriod}</Text>
                        </View>
                        {plan.savings && (
                          <View style={styles.savingsBadge}>
                            <Text style={styles.savingsText}>{plan.savings}</Text>
                          </View>
                        )}
                      </View>

                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
                        </View>
                      )}
                    </View>

                    <View style={styles.featuresContainer}>
                      {plan.features.map((feature, idx) => (
                        <View key={idx} style={styles.featureRow}>
                          <Ionicons name="checkmark" size={16} color={COLORS.success} />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Feature Highlights */}
            <View style={styles.highlightsContainer}>
              <Text style={styles.highlightsTitle}>Why Go Pro?</Text>
              <View style={styles.highlightGrid}>
                <View style={styles.highlightCard}>
                  <Text style={styles.highlightIcon}>🎵</Text>
                  <Text style={styles.highlightTitle}>All Instruments</Text>
                  <Text style={styles.highlightText}>Access 45+ premium instruments</Text>
                </View>
                <View style={styles.highlightCard}>
                  <Text style={styles.highlightIcon}>📊</Text>
                  <Text style={styles.highlightTitle}>Advanced Stats</Text>
                  <Text style={styles.highlightText}>Deep insights into your progress</Text>
                </View>
                <View style={styles.highlightCard}>
                  <Text style={styles.highlightIcon}>🚀</Text>
                  <Text style={styles.highlightTitle}>Custom Practice</Text>
                  <Text style={styles.highlightText}>Create personalized sessions</Text>
                </View>
                <View style={styles.highlightCard}>
                  <Text style={styles.highlightIcon}>✨</Text>
                  <Text style={styles.highlightTitle}>Ad-Free</Text>
                  <Text style={styles.highlightText}>Uninterrupted learning</Text>
                </View>
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity style={styles.ctaButton} onPress={handlePurchase}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.xpGradientEnd]}
                style={styles.ctaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.ctaText}>Subscribe to {selectedPlan.name}</Text>
                <Text style={styles.ctaSubtext}>{selectedPlan.price}/{selectedPlan.billingPeriod}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Fine Print */}
            <Text style={styles.finePrint}>
              Subscriptions auto-renew unless cancelled. Cancel anytime in your account settings.
              By subscribing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </ScrollView>
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
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.warning + '20',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.warning + '40',
  },
  trialContent: {
    flex: 1,
  },
  trialTitle: {
    color: COLORS.warning,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  trialSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  plansContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  planCard: {
    backgroundColor: COLORS.cardBackground + '80',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
  },
  planCardSelected: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '10',
  },
  planCardPopular: {
    borderColor: COLORS.warning,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: SPACING.md,
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderBottomLeftRadius: BORDER_RADIUS.md,
    borderBottomRightRadius: BORDER_RADIUS.md,
  },
  popularText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  planBadge: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  planName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  planPeriod: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  savingsBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  savingsText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: 'bold',
  },
  selectedBadge: {
    marginTop: 8,
  },
  featuresContainer: {
    gap: SPACING.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  highlightsContainer: {
    marginBottom: SPACING.xl,
  },
  highlightsTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  highlightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  highlightCard: {
    width: '48%',
    backgroundColor: COLORS.cardBackground + '60',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  highlightIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  highlightTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  highlightText: {
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  ctaButton: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  ctaGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  ctaText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ctaSubtext: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  finePrint: {
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: SPACING.xl,
  },
});
