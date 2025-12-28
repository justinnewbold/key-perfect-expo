import { useState, useEffect, useCallback, useRef } from 'react';

// MIDI note number to note name mapping
const MIDI_NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

export interface MidiNote {
  note: string;      // e.g., "C4", "F#5"
  noteName: string;  // e.g., "C", "F#"
  octave: number;    // e.g., 4, 5
  midiNumber: number;
  velocity: number;  // 0-127
  timestamp: number;
}

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  connected: boolean;
}

export interface MidiInputState {
  isSupported: boolean;
  isEnabled: boolean;
  devices: MidiDevice[];
  selectedDevice: MidiDevice | null;
  lastNote: MidiNote | null;
  error: string | null;
}

// Convert MIDI note number to note name and octave
function midiNumberToNote(midiNumber: number): { noteName: string; octave: number; fullName: string } {
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteIndex = midiNumber % 12;
  const noteName = MIDI_NOTE_NAMES[noteIndex];
  return {
    noteName,
    octave,
    fullName: `${noteName}${octave}`,
  };
}

// Check if Web MIDI API is available
function checkMidiSupport(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'requestMIDIAccess' in navigator;
}

export function useMidiInput(onNoteReceived?: (note: MidiNote) => void) {
  const [state, setState] = useState<MidiInputState>({
    isSupported: false,
    isEnabled: false,
    devices: [],
    selectedDevice: null,
    lastNote: null,
    error: null,
  });

  const midiAccessRef = useRef<WebMidi.MIDIAccess | null>(null);
  const onNoteReceivedRef = useRef(onNoteReceived);

  // Keep callback ref updated
  useEffect(() => {
    onNoteReceivedRef.current = onNoteReceived;
  }, [onNoteReceived]);

  // Handle MIDI message
  const handleMidiMessage = useCallback((event: WebMidi.MIDIMessageEvent) => {
    const [status, midiNumber, velocity] = event.data;

    // Note On message (0x90-0x9F) with velocity > 0
    if ((status & 0xF0) === 0x90 && velocity > 0) {
      const { noteName, octave, fullName } = midiNumberToNote(midiNumber);

      const note: MidiNote = {
        note: fullName,
        noteName,
        octave,
        midiNumber,
        velocity,
        timestamp: event.timeStamp,
      };

      setState(prev => ({ ...prev, lastNote: note }));
      onNoteReceivedRef.current?.(note);
    }
  }, []);

  // Update device list
  const updateDevices = useCallback((midiAccess: WebMidi.MIDIAccess) => {
    const devices: MidiDevice[] = [];

    midiAccess.inputs.forEach((input) => {
      devices.push({
        id: input.id,
        name: input.name || 'Unknown Device',
        manufacturer: input.manufacturer || 'Unknown',
        connected: input.state === 'connected',
      });
    });

    setState(prev => ({
      ...prev,
      devices,
      // Auto-select first device if none selected
      selectedDevice: prev.selectedDevice || (devices.length > 0 ? devices[0] : null),
    }));
  }, []);

  // Initialize MIDI
  const initializeMidi = useCallback(async () => {
    if (!checkMidiSupport()) {
      setState(prev => ({
        ...prev,
        isSupported: false,
        error: 'Web MIDI API is not supported in this browser/environment',
      }));
      return;
    }

    try {
      const midiAccess = await (navigator as any).requestMIDIAccess({ sysex: false });
      midiAccessRef.current = midiAccess;

      updateDevices(midiAccess);

      // Listen for device changes
      midiAccess.onstatechange = () => {
        updateDevices(midiAccess);
      };

      setState(prev => ({
        ...prev,
        isSupported: true,
        isEnabled: true,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSupported: true,
        isEnabled: false,
        error: error instanceof Error ? error.message : 'Failed to access MIDI devices',
      }));
    }
  }, [updateDevices]);

  // Select a MIDI device
  const selectDevice = useCallback((deviceId: string) => {
    const midiAccess = midiAccessRef.current;
    if (!midiAccess) return;

    // Remove listener from previous device
    midiAccess.inputs.forEach((input) => {
      input.onmidimessage = null;
    });

    // Find and set up new device
    const input = midiAccess.inputs.get(deviceId);
    if (input) {
      input.onmidimessage = handleMidiMessage;

      const device: MidiDevice = {
        id: input.id,
        name: input.name || 'Unknown Device',
        manufacturer: input.manufacturer || 'Unknown',
        connected: input.state === 'connected',
      };

      setState(prev => ({ ...prev, selectedDevice: device }));
    }
  }, [handleMidiMessage]);

  // Enable MIDI input
  const enableMidi = useCallback(async () => {
    if (state.isSupported && !state.isEnabled) {
      await initializeMidi();
    }

    // Set up listener for selected device
    const midiAccess = midiAccessRef.current;
    if (midiAccess && state.selectedDevice) {
      const input = midiAccess.inputs.get(state.selectedDevice.id);
      if (input) {
        input.onmidimessage = handleMidiMessage;
      }
    }
  }, [state.isSupported, state.isEnabled, state.selectedDevice, initializeMidi, handleMidiMessage]);

  // Disable MIDI input
  const disableMidi = useCallback(() => {
    const midiAccess = midiAccessRef.current;
    if (midiAccess) {
      midiAccess.inputs.forEach((input) => {
        input.onmidimessage = null;
      });
    }
    setState(prev => ({ ...prev, isEnabled: false }));
  }, []);

  // Check support on mount
  useEffect(() => {
    setState(prev => ({ ...prev, isSupported: checkMidiSupport() }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disableMidi();
    };
  }, [disableMidi]);

  return {
    ...state,
    initializeMidi,
    enableMidi,
    disableMidi,
    selectDevice,
  };
}

// Type declarations for Web MIDI API
declare namespace WebMidi {
  interface MIDIAccess {
    inputs: Map<string, MIDIInput>;
    outputs: Map<string, MIDIOutput>;
    onstatechange: ((event: MIDIConnectionEvent) => void) | null;
  }

  interface MIDIInput {
    id: string;
    name: string | null;
    manufacturer: string | null;
    state: 'connected' | 'disconnected';
    onmidimessage: ((event: MIDIMessageEvent) => void) | null;
  }

  interface MIDIOutput {
    id: string;
    name: string | null;
    manufacturer: string | null;
    state: 'connected' | 'disconnected';
  }

  interface MIDIMessageEvent {
    data: Uint8Array;
    timeStamp: number;
  }

  interface MIDIConnectionEvent {
    port: MIDIInput | MIDIOutput;
  }
}
