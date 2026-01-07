import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// Configure audio session for iOS
export async function configureAudioSession(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Audio.setAudioModeAsync({
      // Allow recording for pitch detection/tuner
      allowsRecordingIOS: false,
      // Keep audio playing during notifications
      staysActiveInBackground: true,
      // Play audio even in silent mode
      playsInSilentModeIOS: true,
      // Don't mix with other apps (we want full audio control)
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      // Duck other apps on Android
      shouldDuckAndroid: true,
      // Interruption mode for Android
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      // We want to use speaker by default
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.error('Error configuring audio session:', error);
  }
}

// Configure audio session for recording (tuner/pitch detection)
export async function configureAudioForRecording(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.error('Error configuring audio for recording:', error);
  }
}

// Reset audio session to default playback mode
export async function resetAudioSession(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.error('Error resetting audio session:', error);
  }
}

// Request audio permissions
export async function requestAudioPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting audio permissions:', error);
    return false;
  }
}

// Check audio permissions
export async function checkAudioPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const { status } = await Audio.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    return false;
  }
}

// Handle audio interruption (phone call, etc.)
export function setupInterruptionHandler(
  onInterruption: (shouldResume: boolean) => void
): void {
  if (Platform.OS === 'web') return;

  // Note: Expo's Audio API handles interruptions automatically
  // This is a placeholder for custom handling if needed
}

// Get audio output route (speaker, headphones, etc.)
export async function getAudioOutputRoute(): Promise<string> {
  if (Platform.OS === 'web') return 'web';

  // This would require native module access
  // For now, return 'unknown' as expo-av doesn't expose this directly
  return 'unknown';
}
