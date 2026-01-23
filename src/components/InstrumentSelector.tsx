import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import GlassCard from './GlassCard';
import { INSTRUMENT_PACKS, BUNDLE_PACK, InstrumentPack, InstrumentType, isInstrumentOwned } from '../types/instruments';
import { purchaseProduct, getProductDetails } from '../services/payments';

interface InstrumentSelectorProps {
  selectedInstrument: string;
  ownedPacks: string[];
  onSelectInstrument: (instrumentId: string) => void;
  onPurchasePack: (packId: string) => void;
}

export default function InstrumentSelector({
  selectedInstrument,
  ownedPacks,
  onSelectInstrument,
  onPurchasePack,
}: InstrumentSelectorProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState<InstrumentPack | null>(null);

  const handleInstrumentPress = (instrument: InstrumentType) => {
    if (isInstrumentOwned(instrument.id, ownedPacks)) {
      onSelectInstrument(instrument.id);
    } else {
      // Find and show the pack this instrument belongs to
      const pack = INSTRUMENT_PACKS.find(p => p.id === instrument.packId);
      if (pack) {
        setSelectedPack(pack);
        setShowModal(true);
      }
    }
  };

  const handlePurchase = async () => {
    if (!selectedPack) return;

    const product = getProductDetails(selectedPack.id);
    if (!product) return;

    Alert.alert(
      'Confirm Purchase',
      `Purchase ${selectedPack.name} for ${selectedPack.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: async () => {
            // Show loading
            Alert.alert('Processing', 'Please wait...');

            try {
              const result = await purchaseProduct(selectedPack.id);

              if (result.success) {
                // Purchase successful
                onPurchasePack(selectedPack.id);
                setShowModal(false);
                Alert.alert(
                  'Purchase Successful! 🎉',
                  `${selectedPack.name} has been unlocked. Enjoy your new instruments!`,
                  [{ text: 'Great!', onPress: () => {} }]
                );
              } else {
                // Purchase failed
                Alert.alert(
                  'Purchase Failed',
                  result.error || 'Unable to complete purchase. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              Alert.alert(
                'Error',
                'An unexpected error occurred. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const allInstruments = INSTRUMENT_PACKS.flatMap(pack => pack.instruments);
  const currentInstrument = allInstruments.find(i => i.id === selectedInstrument);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Instrument</Text>
          <TouchableOpacity
            style={styles.currentInstrument}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.instrumentEmoji}>{currentInstrument?.emoji || '🎹'}</Text>
            <Text style={styles.instrumentName}>{currentInstrument?.name || 'Piano'}</Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Instrument</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.packsList}>
              {/* Bundle Pack */}
              <TouchableOpacity
                style={[styles.packCard, styles.bundleCard]}
                onPress={() => {
                  setSelectedPack(BUNDLE_PACK);
                  handlePurchase();
                }}
              >
                <View style={styles.packHeader}>
                  <Text style={styles.bundleEmoji}>{BUNDLE_PACK.icon}</Text>
                  <View style={styles.packInfo}>
                    <View style={styles.packTitleRow}>
                      <Text style={styles.packName}>{BUNDLE_PACK.name}</Text>
                      <View style={styles.saveBadge}>
                        <Text style={styles.saveText}>SAVE 40%</Text>
                      </View>
                    </View>
                    <Text style={styles.packDescription}>{BUNDLE_PACK.description}</Text>
                  </View>
                  <Text style={styles.packPrice}>{BUNDLE_PACK.price}</Text>
                </View>
              </TouchableOpacity>

              {/* Individual Packs */}
              {INSTRUMENT_PACKS.map((pack) => {
                const isOwned = ownedPacks.includes(pack.id) || !pack.isPremium;

                return (
                  <View key={pack.id} style={styles.packCard}>
                    <View style={styles.packHeader}>
                      <Text style={styles.packEmoji}>{pack.icon}</Text>
                      <View style={styles.packInfo}>
                        <View style={styles.packTitleRow}>
                          <Text style={styles.packName}>{pack.name}</Text>
                          {!pack.isPremium && (
                            <View style={styles.freeBadge}>
                              <Text style={styles.freeText}>FREE</Text>
                            </View>
                          )}
                          {isOwned && pack.isPremium && (
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                          )}
                        </View>
                        <Text style={styles.packDescription}>{pack.description}</Text>
                      </View>
                      {pack.isPremium && !isOwned && (
                        <TouchableOpacity
                          style={styles.buyButton}
                          onPress={() => {
                            setSelectedPack(pack);
                            handlePurchase();
                          }}
                        >
                          <Text style={styles.packPrice}>{pack.price}</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Instruments in pack */}
                    <View style={styles.instrumentsList}>
                      {pack.instruments.map((instrument) => {
                        const isSelected = instrument.id === selectedInstrument;
                        const canUse = isInstrumentOwned(instrument.id, ownedPacks);

                        return (
                          <TouchableOpacity
                            key={instrument.id}
                            style={[
                              styles.instrumentItem,
                              isSelected && styles.instrumentItemSelected,
                              !canUse && styles.instrumentItemLocked,
                            ]}
                            onPress={() => handleInstrumentPress(instrument)}
                            disabled={!canUse}
                          >
                            <Text style={styles.instrumentItemEmoji}>{instrument.emoji}</Text>
                            <Text style={styles.instrumentItemName}>{instrument.name}</Text>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                            )}
                            {!canUse && (
                              <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  currentInstrument: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.glass,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  instrumentEmoji: {
    fontSize: 20,
  },
  instrumentName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  packsList: {
    padding: SPACING.md,
  },
  packCard: {
    backgroundColor: COLORS.glass,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  bundleCard: {
    backgroundColor: COLORS.warning + '20',
    borderColor: COLORS.warning,
    borderWidth: 2,
  },
  packHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  packEmoji: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  bundleEmoji: {
    fontSize: 40,
    marginRight: SPACING.md,
  },
  packInfo: {
    flex: 1,
  },
  packTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 4,
  },
  packName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  packDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  freeBadge: {
    backgroundColor: COLORS.success + '40',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  freeText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: 'bold',
  },
  saveBadge: {
    backgroundColor: COLORS.error + '40',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  saveText: {
    color: COLORS.error,
    fontSize: 10,
    fontWeight: 'bold',
  },
  buyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  packPrice: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  instrumentsList: {
    gap: SPACING.xs,
  },
  instrumentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.cardBackground + '40',
    borderRadius: BORDER_RADIUS.md,
  },
  instrumentItemSelected: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  instrumentItemLocked: {
    opacity: 0.5,
  },
  instrumentItemEmoji: {
    fontSize: 20,
  },
  instrumentItemName: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
