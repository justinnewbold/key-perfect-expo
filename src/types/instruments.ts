// Premium Instrument System

export interface InstrumentPack {
  id: string;
  name: string;
  description: string;
  icon: string;
  isPremium: boolean;
  price?: string; // e.g., "$4.99"
  instruments: InstrumentType[];
}

export interface InstrumentType {
  id: string;
  name: string;
  emoji: string;
  isPremium: boolean;
  packId: string;
}

export const INSTRUMENT_PACKS: InstrumentPack[] = [
  {
    id: 'free',
    name: 'Free Pack',
    description: 'High-quality synthetic piano',
    icon: '🎹',
    isPremium: false,
    instruments: [
      { id: 'piano_synth', name: 'Piano (Synth)', emoji: '🎹', isPremium: false, packId: 'free' },
    ],
  },
  {
    id: 'real_piano',
    name: 'Real Piano',
    description: 'Professional sampled grand piano',
    icon: '🎹',
    isPremium: true,
    price: '$2.99',
    instruments: [
      { id: 'piano_grand', name: 'Grand Piano', emoji: '🎹', isPremium: true, packId: 'real_piano' },
      { id: 'piano_upright', name: 'Upright Piano', emoji: '🎹', isPremium: true, packId: 'real_piano' },
    ],
  },
  {
    id: 'guitar',
    name: 'Guitar Collection',
    description: 'Acoustic and electric guitars',
    icon: '🎸',
    isPremium: true,
    price: '$3.99',
    instruments: [
      { id: 'guitar_acoustic', name: 'Acoustic Guitar', emoji: '🎸', isPremium: true, packId: 'guitar' },
      { id: 'guitar_electric', name: 'Electric Guitar', emoji: '🎸', isPremium: true, packId: 'guitar' },
    ],
  },
  {
    id: 'strings',
    name: 'String Orchestra',
    description: 'Violin, cello, and ensemble',
    icon: '🎻',
    isPremium: true,
    price: '$4.99',
    instruments: [
      { id: 'strings_violin', name: 'Violin', emoji: '🎻', isPremium: true, packId: 'strings' },
      { id: 'strings_cello', name: 'Cello', emoji: '🎻', isPremium: true, packId: 'strings' },
      { id: 'strings_ensemble', name: 'String Ensemble', emoji: '🎻', isPremium: true, packId: 'strings' },
    ],
  },
  {
    id: 'vocals',
    name: 'Human Voice',
    description: 'Male and female vocals',
    icon: '🎤',
    isPremium: true,
    price: '$2.99',
    instruments: [
      { id: 'vocals_male', name: 'Male Voice', emoji: '🎤', isPremium: true, packId: 'vocals' },
      { id: 'vocals_female', name: 'Female Voice', emoji: '🎤', isPremium: true, packId: 'vocals' },
    ],
  },
  {
    id: 'jazz',
    name: 'Jazz Ensemble',
    description: 'Saxophone, trumpet, double bass',
    icon: '🎷',
    isPremium: true,
    price: '$5.99',
    instruments: [
      { id: 'jazz_saxophone', name: 'Saxophone', emoji: '🎷', isPremium: true, packId: 'jazz' },
      { id: 'jazz_trumpet', name: 'Trumpet', emoji: '🎺', isPremium: true, packId: 'jazz' },
      { id: 'jazz_bass', name: 'Double Bass', emoji: '🎸', isPremium: true, packId: 'jazz' },
    ],
  },
  {
    id: 'world',
    name: 'World Instruments',
    description: 'Traditional instruments from around the globe',
    icon: '🌍',
    isPremium: true,
    price: '$4.99',
    instruments: [
      { id: 'world_sitar', name: 'Sitar', emoji: '🪕', isPremium: true, packId: 'world' },
      { id: 'world_shakuhachi', name: 'Shakuhachi Flute', emoji: '🎋', isPremium: true, packId: 'world' },
      { id: 'world_didgeridoo', name: 'Didgeridoo', emoji: '🪃', isPremium: true, packId: 'world' },
      { id: 'world_koto', name: 'Koto', emoji: '🎎', isPremium: true, packId: 'world' },
    ],
  },
  {
    id: 'electronic',
    name: 'EDM & Electronic',
    description: 'Modern synthesizers and electronic sounds',
    icon: '🔊',
    isPremium: true,
    price: '$3.99',
    instruments: [
      { id: 'electronic_synth_lead', name: 'Synth Lead', emoji: '🎹', isPremium: true, packId: 'electronic' },
      { id: 'electronic_synth_pad', name: 'Synth Pad', emoji: '🎛️', isPremium: true, packId: 'electronic' },
      { id: 'electronic_bass', name: 'Electronic Bass', emoji: '🔉', isPremium: true, packId: 'electronic' },
      { id: 'electronic_808', name: '808 Sub Bass', emoji: '🔊', isPremium: true, packId: 'electronic' },
    ],
  },
  {
    id: 'percussion',
    name: 'Orchestral Percussion',
    description: 'Timpani, xylophone, and tuned percussion',
    icon: '🥁',
    isPremium: true,
    price: '$3.99',
    instruments: [
      { id: 'percussion_timpani', name: 'Timpani', emoji: '🥁', isPremium: true, packId: 'percussion' },
      { id: 'percussion_xylophone', name: 'Xylophone', emoji: '🎵', isPremium: true, packId: 'percussion' },
      { id: 'percussion_marimba', name: 'Marimba', emoji: '🎶', isPremium: true, packId: 'percussion' },
      { id: 'percussion_bells', name: 'Tubular Bells', emoji: '🔔', isPremium: true, packId: 'percussion' },
    ],
  },
  {
    id: 'vintage_keys',
    name: 'Vintage Keyboards',
    description: 'Classic organs and harpsichord',
    icon: '⚙️',
    isPremium: true,
    price: '$3.99',
    instruments: [
      { id: 'vintage_organ_church', name: 'Church Organ', emoji: '⛪', isPremium: true, packId: 'vintage_keys' },
      { id: 'vintage_organ_hammond', name: 'Hammond Organ', emoji: '🎹', isPremium: true, packId: 'vintage_keys' },
      { id: 'vintage_harpsichord', name: 'Harpsichord', emoji: '🎼', isPremium: true, packId: 'vintage_keys' },
      { id: 'vintage_clavinet', name: 'Clavinet', emoji: '🎹', isPremium: true, packId: 'vintage_keys' },
    ],
  },
  {
    id: 'woodwinds',
    name: 'Woodwind Section',
    description: 'Flute, clarinet, oboe, and bassoon',
    icon: '🎶',
    isPremium: true,
    price: '$4.99',
    instruments: [
      { id: 'woodwind_flute', name: 'Flute', emoji: '🎶', isPremium: true, packId: 'woodwinds' },
      { id: 'woodwind_clarinet', name: 'Clarinet', emoji: '🎵', isPremium: true, packId: 'woodwinds' },
      { id: 'woodwind_oboe', name: 'Oboe', emoji: '🎶', isPremium: true, packId: 'woodwinds' },
      { id: 'woodwind_bassoon', name: 'Bassoon', emoji: '🎵', isPremium: true, packId: 'woodwinds' },
    ],
  },
  {
    id: 'brass',
    name: 'Brass Section',
    description: 'French horn, trombone, and tuba',
    icon: '🎺',
    isPremium: true,
    price: '$4.99',
    instruments: [
      { id: 'brass_french_horn', name: 'French Horn', emoji: '📯', isPremium: true, packId: 'brass' },
      { id: 'brass_trombone', name: 'Trombone', emoji: '🎺', isPremium: true, packId: 'brass' },
      { id: 'brass_tuba', name: 'Tuba', emoji: '🎺', isPremium: true, packId: 'brass' },
      { id: 'brass_euphonium', name: 'Euphonium', emoji: '🎺', isPremium: true, packId: 'brass' },
    ],
  },
];

export const BUNDLE_PACK: InstrumentPack = {
  id: 'all_instruments',
  name: 'Complete Orchestra Bundle',
  description: 'All 12 premium packs - 45+ instruments (Save 40%!)',
  icon: '🎵',
  isPremium: true,
  price: '$29.99',
  instruments: INSTRUMENT_PACKS.filter(p => p.isPremium)
    .flatMap(p => p.instruments),
};

// Get all available instruments
export function getAllInstruments(): InstrumentType[] {
  return INSTRUMENT_PACKS.flatMap(pack => pack.instruments);
}

// Check if user owns an instrument (for now, only free pack)
export function isInstrumentOwned(instrumentId: string, ownedPacks: string[]): boolean {
  const instrument = getAllInstruments().find(i => i.id === instrumentId);
  if (!instrument) return false;

  // Free instruments are always owned
  if (!instrument.isPremium) return true;

  // Check if user owns the pack
  return ownedPacks.includes(instrument.packId);
}

// Get owned instruments
export function getOwnedInstruments(ownedPacks: string[]): InstrumentType[] {
  return getAllInstruments().filter(i => isInstrumentOwned(i.id, ownedPacks));
}

// Default instrument
export const DEFAULT_INSTRUMENT = 'piano_synth';
