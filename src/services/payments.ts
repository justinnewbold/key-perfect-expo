import AsyncStorage from '@react-native-async-storage/async-storage';
import { INSTRUMENT_PACKS, BUNDLE_PACK } from '../types/instruments';

// Note: This is a mock implementation for demonstration
// In a real app, you would use expo-in-app-purchases or react-native-iap:
// import * as InAppPurchases from 'expo-in-app-purchases';
// OR
// import * as RNIap from 'react-native-iap';

const STORAGE_KEYS = {
  PURCHASES: 'keyPerfect_purchases',
  PENDING_PURCHASES: 'keyPerfect_pendingPurchases',
  RECEIPTS: 'keyPerfect_receipts',
};

export interface Product {
  id: string;
  type: 'instrument_pack' | 'bundle' | 'subscription';
  title: string;
  description: string;
  price: string;
  priceValue: number;
  currency: string;
}

export interface Purchase {
  productId: string;
  transactionId: string;
  purchaseDate: string;
  receipt: string;
  verified: boolean;
}

export interface PurchaseHistory {
  purchases: Purchase[];
  totalSpent: number;
  lastPurchaseDate: string | null;
}

// Get all available products
export function getAvailableProducts(): Product[] {
  const products: Product[] = [];

  // Add instrument packs
  INSTRUMENT_PACKS.filter(p => p.isPremium).forEach(pack => {
    products.push({
      id: pack.id,
      type: 'instrument_pack',
      title: pack.name,
      description: pack.description,
      price: pack.price || '$0.00',
      priceValue: parseFloat((pack.price || '$0').replace('$', '')),
      currency: 'USD',
    });
  });

  // Add bundle
  products.push({
    id: BUNDLE_PACK.id,
    type: 'bundle',
    title: BUNDLE_PACK.name,
    description: BUNDLE_PACK.description,
    price: BUNDLE_PACK.price || '$0.00',
    priceValue: parseFloat((BUNDLE_PACK.price || '$0').replace('$', '')),
    currency: 'USD',
  });

  return products;
}

// Initialize payment system
export async function initializePayments(): Promise<boolean> {
  try {
    // In a real app:
    // await InAppPurchases.connectAsync();
    // const products = await InAppPurchases.getProductsAsync(productIds);
    // return true;

    console.log('Mock: Payment system initialized');
    return true;
  } catch (error) {
    console.error('Error initializing payments:', error);
    return false;
  }
}

// Get purchase history
export async function getPurchaseHistory(): Promise<PurchaseHistory> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PURCHASES);
    if (data) {
      const purchases: Purchase[] = JSON.parse(data);
      const totalSpent = purchases.reduce((sum, p) => {
        const product = getAvailableProducts().find(pr => pr.id === p.productId);
        return sum + (product?.priceValue || 0);
      }, 0);
      const lastPurchaseDate = purchases.length > 0
        ? purchases[purchases.length - 1].purchaseDate
        : null;

      return { purchases, totalSpent, lastPurchaseDate };
    }
  } catch (error) {
    console.error('Error loading purchase history:', error);
  }

  return { purchases: [], totalSpent: 0, lastPurchaseDate: null };
}

// Save purchase
async function savePurchase(purchase: Purchase): Promise<void> {
  try {
    const history = await getPurchaseHistory();
    history.purchases.push(purchase);
    await AsyncStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(history.purchases));
  } catch (error) {
    console.error('Error saving purchase:', error);
  }
}

// Purchase a product
export async function purchaseProduct(productId: string): Promise<{
  success: boolean;
  purchase?: Purchase;
  error?: string;
}> {
  try {
    const product = getAvailableProducts().find(p => p.id === productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    // In a real app:
    // const result = await InAppPurchases.purchaseItemAsync(productId);
    // if (result.responseCode === InAppPurchases.IAPResponseCode.OK) {
    //   const receipt = await verifyReceipt(result.results[0]);
    //   // Save purchase locally
    //   // Update user's owned packs
    //   return { success: true, purchase: { ... } };
    // }

    // Mock purchase flow
    console.log('Mock: Initiating purchase for', product.title);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate random success/failure (90% success rate)
    const success = Math.random() > 0.1;

    if (success) {
      const purchase: Purchase = {
        productId,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        purchaseDate: new Date().toISOString(),
        receipt: `receipt_${Date.now()}`,
        verified: true,
      };

      await savePurchase(purchase);
      console.log('Mock: Purchase successful', purchase);

      return { success: true, purchase };
    } else {
      return { success: false, error: 'Payment cancelled or failed' };
    }
  } catch (error) {
    console.error('Error during purchase:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Verify receipt with server
async function verifyReceipt(receipt: string): Promise<boolean> {
  try {
    // In a real app:
    // const response = await fetch('YOUR_SERVER/verify-receipt', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ receipt }),
    // });
    // const result = await response.json();
    // return result.valid === true;

    console.log('Mock: Verifying receipt', receipt);
    return true; // Mock always succeeds
  } catch (error) {
    console.error('Error verifying receipt:', error);
    return false;
  }
}

// Restore previous purchases
export async function restorePurchases(): Promise<{
  success: boolean;
  restoredCount: number;
  error?: string;
}> {
  try {
    // In a real app:
    // const history = await InAppPurchases.getPurchaseHistoryAsync();
    // let restoredCount = 0;
    // for (const purchase of history.results) {
    //   if (await verifyReceipt(purchase.receipt)) {
    //     // Restore the purchase
    //     restoredCount++;
    //   }
    // }
    // return { success: true, restoredCount };

    console.log('Mock: Restoring purchases');

    // In mock, return existing purchases
    const history = await getPurchaseHistory();
    return { success: true, restoredCount: history.purchases.length };
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return { success: false, restoredCount: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Check if product is owned
export async function isProductOwned(productId: string): Promise<boolean> {
  const history = await getPurchaseHistory();
  return history.purchases.some(p => p.productId === productId && p.verified);
}

// Get owned instrument packs
export async function getOwnedInstrumentPacks(): Promise<string[]> {
  const history = await getPurchaseHistory();
  const ownedPacks = ['free']; // Always include free pack

  history.purchases.forEach(purchase => {
    if (purchase.verified) {
      if (purchase.productId === BUNDLE_PACK.id) {
        // Bundle includes all packs
        INSTRUMENT_PACKS.filter(p => p.isPremium).forEach(pack => {
          if (!ownedPacks.includes(pack.id)) {
            ownedPacks.push(pack.id);
          }
        });
      } else {
        // Individual pack
        if (!ownedPacks.includes(purchase.productId)) {
          ownedPacks.push(purchase.productId);
        }
      }
    }
  });

  return ownedPacks;
}

// Subscription management (for future premium features)
export interface Subscription {
  id: string;
  productId: string;
  startDate: string;
  expiryDate: string;
  autoRenew: boolean;
  status: 'active' | 'expired' | 'cancelled';
}

export async function getActiveSubscription(): Promise<Subscription | null> {
  // Mock implementation - no subscriptions yet
  return null;
}

export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  // In a real app:
  // Direct user to platform subscription management
  // iOS: Settings > Apple ID > Subscriptions
  // Android: Play Store > Account > Subscriptions

  console.log('Mock: Cancelling subscription', subscriptionId);
  return true;
}

// Get purchase statistics
export interface PurchaseStats {
  totalPurchases: number;
  totalSpent: number;
  averagePurchase: number;
  firstPurchaseDate: string | null;
  mostRecentPurchase: string | null;
  ownedProducts: string[];
}

export async function getPurchaseStats(): Promise<PurchaseStats> {
  const history = await getPurchaseHistory();
  const ownedPacks = await getOwnedInstrumentPacks();

  return {
    totalPurchases: history.purchases.length,
    totalSpent: history.totalSpent,
    averagePurchase: history.purchases.length > 0
      ? history.totalSpent / history.purchases.length
      : 0,
    firstPurchaseDate: history.purchases.length > 0
      ? history.purchases[0].purchaseDate
      : null,
    mostRecentPurchase: history.lastPurchaseDate,
    ownedProducts: ownedPacks,
  };
}

// Handle pending purchases (for network failures)
export async function processPendingPurchases(): Promise<void> {
  try {
    const pending = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_PURCHASES);
    if (pending) {
      const purchases: Purchase[] = JSON.parse(pending);

      for (const purchase of purchases) {
        if (await verifyReceipt(purchase.receipt)) {
          await savePurchase(purchase);
        }
      }

      // Clear pending
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_PURCHASES);
    }
  } catch (error) {
    console.error('Error processing pending purchases:', error);
  }
}

// Initialize on app start
export async function initializePaymentSystem(): Promise<void> {
  await initializePayments();
  await processPendingPurchases();

  // Update owned packs in settings
  const ownedPacks = await getOwnedInstrumentPacks();
  console.log('Owned instrument packs:', ownedPacks);
}

// Format price for display
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
}

// Get product details
export function getProductDetails(productId: string): Product | null {
  return getAvailableProducts().find(p => p.id === productId) || null;
}

// Platform-specific links
export function getSubscriptionManagementUrl(): string {
  // In a real app, detect platform:
  // if (Platform.OS === 'ios') return 'https://apps.apple.com/account/subscriptions';
  // if (Platform.OS === 'android') return 'https://play.google.com/store/account/subscriptions';

  return 'https://example.com/manage-subscriptions';
}
