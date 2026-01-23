import AsyncStorage from '@react-native-async-storage/async-storage';

// Note: This is a mock implementation
// In production, use expo-in-app-purchases or react-native-iap with subscription support

const STORAGE_KEYS = {
  SUBSCRIPTION: 'keyPerfect_subscription',
  TRIAL: 'keyPerfect_trial',
};

export type SubscriptionTier = 'free' | 'pro_monthly' | 'pro_annual';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: string;
  priceValue: number;
  billingPeriod: 'month' | 'year' | 'free';
  features: string[];
  badge?: string;
  savings?: string;
  popular?: boolean;
}

export interface ActiveSubscription {
  tier: SubscriptionTier;
  productId: string;
  startDate: string;
  expiryDate: string;
  autoRenew: boolean;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  transactionId?: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    priceValue: 0,
    billingPeriod: 'free',
    features: [
      '1 daily challenge per day',
      'Basic instrument (Piano)',
      'Campaign mode access',
      'Basic statistics',
      'Ads supported',
    ],
  },
  {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    price: '$4.99',
    priceValue: 4.99,
    billingPeriod: 'month',
    features: [
      'Unlimited daily challenges',
      'All 12+ instrument packs included',
      'Custom practice sessions',
      'Advanced statistics dashboard',
      'Priority AI coach insights',
      'Offline mode',
      'Ad-free experience',
      'Early access to new features',
    ],
    badge: '🎵',
  },
  {
    id: 'pro_annual',
    name: 'Pro Annual',
    price: '$39.99',
    priceValue: 39.99,
    billingPeriod: 'year',
    features: [
      'Everything in Pro Monthly',
      'All future instrument packs',
      'Exclusive annual badge',
      'Priority support',
      'Lifetime achievements tracker',
      'Export progress data',
    ],
    badge: '👑',
    savings: 'Save 33%',
    popular: true,
  },
];

// Get active subscription
export async function getActiveSubscription(): Promise<ActiveSubscription | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION);
    if (data) {
      const subscription: ActiveSubscription = JSON.parse(data);

      // Check if expired
      if (new Date(subscription.expiryDate) < new Date()) {
        subscription.status = 'expired';
        await saveSubscription(subscription);
      }

      return subscription;
    }
  } catch (error) {
    console.error('Error loading subscription:', error);
  }

  return null;
}

// Save subscription
async function saveSubscription(subscription: ActiveSubscription): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(subscription));
  } catch (error) {
    console.error('Error saving subscription:', error);
  }
}

// Check if user has pro subscription
export async function hasProSubscription(): Promise<boolean> {
  const subscription = await getActiveSubscription();
  return subscription !== null &&
         subscription.status === 'active' &&
         (subscription.tier === 'pro_monthly' || subscription.tier === 'pro_annual');
}

// Get subscription tier
export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  const subscription = await getActiveSubscription();
  if (subscription && subscription.status === 'active') {
    return subscription.tier;
  }
  return 'free';
}

// Purchase subscription
export async function purchaseSubscription(planId: SubscriptionTier): Promise<{
  success: boolean;
  subscription?: ActiveSubscription;
  error?: string;
}> {
  try {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan || plan.id === 'free') {
      return { success: false, error: 'Invalid plan' };
    }

    // In a real app:
    // const result = await InAppPurchases.purchaseItemAsync(planId);
    // Verify receipt with server
    // Set up auto-renewal

    console.log('Mock: Purchasing subscription', plan.name);

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Calculate expiry date
    const now = new Date();
    const expiryDate = new Date(now);
    if (plan.billingPeriod === 'month') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (plan.billingPeriod === 'year') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    const subscription: ActiveSubscription = {
      tier: planId,
      productId: planId,
      startDate: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
      autoRenew: true,
      status: 'active',
      transactionId: `txn_${Date.now()}`,
    };

    await saveSubscription(subscription);
    console.log('Mock: Subscription activated', subscription);

    return { success: true, subscription };
  } catch (error) {
    console.error('Error purchasing subscription:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Cancel subscription
export async function cancelSubscription(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const subscription = await getActiveSubscription();
    if (!subscription) {
      return { success: false, error: 'No active subscription' };
    }

    // In a real app:
    // Direct user to platform subscription management
    // iOS: Settings > Apple ID > Subscriptions
    // Android: Play Store > Account > Subscriptions

    subscription.autoRenew = false;
    subscription.status = 'cancelled';
    await saveSubscription(subscription);

    console.log('Mock: Subscription cancelled (will expire on', subscription.expiryDate, ')');

    return { success: true };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Restore subscription
export async function restoreSubscription(): Promise<{
  success: boolean;
  subscription?: ActiveSubscription;
  error?: string;
}> {
  try {
    // In a real app:
    // const history = await InAppPurchases.getPurchaseHistoryAsync({ useIAP: true });
    // Find most recent active subscription
    // Verify with server

    console.log('Mock: Restoring subscription');

    const subscription = await getActiveSubscription();
    if (subscription && new Date(subscription.expiryDate) > new Date()) {
      return { success: true, subscription };
    }

    return { success: false, error: 'No active subscription found' };
  } catch (error) {
    console.error('Error restoring subscription:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Start free trial (7 days)
export async function startFreeTrial(): Promise<{
  success: boolean;
  subscription?: ActiveSubscription;
  error?: string;
}> {
  try {
    // Check if trial already used
    const trialUsed = await AsyncStorage.getItem(STORAGE_KEYS.TRIAL);
    if (trialUsed) {
      return { success: false, error: 'Trial already used' };
    }

    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(expiryDate.getDate() + 7); // 7-day trial

    const subscription: ActiveSubscription = {
      tier: 'pro_monthly',
      productId: 'trial',
      startDate: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
      autoRenew: false,
      status: 'trial',
    };

    await saveSubscription(subscription);
    await AsyncStorage.setItem(STORAGE_KEYS.TRIAL, 'true');

    console.log('Mock: Free trial started');

    return { success: true, subscription };
  } catch (error) {
    console.error('Error starting trial:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Check if trial available
export async function isTrialAvailable(): Promise<boolean> {
  try {
    const trialUsed = await AsyncStorage.getItem(STORAGE_KEYS.TRIAL);
    return !trialUsed;
  } catch (error) {
    console.error('Error checking trial:', error);
    return false;
  }
}

// Get days remaining
export function getDaysRemaining(subscription: ActiveSubscription): number {
  const now = new Date();
  const expiry = new Date(subscription.expiryDate);
  const diff = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Check specific features
export async function hasFeature(feature: keyof SubscriptionFeatures): Promise<boolean> {
  const tier = await getSubscriptionTier();
  return getFeatures(tier)[feature];
}

export interface SubscriptionFeatures {
  unlimitedChallenges: boolean;
  allInstruments: boolean;
  customPractice: boolean;
  advancedStats: boolean;
  priorityAI: boolean;
  offlineMode: boolean;
  adFree: boolean;
  earlyAccess: boolean;
  exportData: boolean;
}

export function getFeatures(tier: SubscriptionTier): SubscriptionFeatures {
  const isPro = tier === 'pro_monthly' || tier === 'pro_annual';
  const isAnnual = tier === 'pro_annual';

  return {
    unlimitedChallenges: isPro,
    allInstruments: isPro,
    customPractice: isPro,
    advancedStats: isPro,
    priorityAI: isPro,
    offlineMode: isPro,
    adFree: isPro,
    earlyAccess: isPro,
    exportData: isAnnual,
  };
}

// Get subscription statistics
export interface SubscriptionStats {
  tier: SubscriptionTier;
  daysRemaining: number;
  isTrial: boolean;
  autoRenew: boolean;
  totalSaved: number; // For annual subscribers
  memberSince: string;
}

export async function getSubscriptionStats(): Promise<SubscriptionStats | null> {
  const subscription = await getActiveSubscription();
  if (!subscription) return null;

  const totalSaved = subscription.tier === 'pro_annual'
    ? (4.99 * 12) - 39.99 // Monthly vs Annual savings
    : 0;

  return {
    tier: subscription.tier,
    daysRemaining: getDaysRemaining(subscription),
    isTrial: subscription.status === 'trial',
    autoRenew: subscription.autoRenew,
    totalSaved,
    memberSince: subscription.startDate,
  };
}

// Platform subscription management URLs
export function getSubscriptionManagementUrl(): string {
  // In a real app, detect platform
  return 'https://example.com/manage-subscription';
}
