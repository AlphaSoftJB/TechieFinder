import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// A plain (non-secret) flag so screens can check "is quick unlock on?" for
// UI purposes without triggering a Face ID/Touch ID prompt just to look.
const ENABLED_FLAG_KEY = '@techiefinder/biometricUnlockEnabled';

// The actual secret. Stored with requireAuthentication so iOS/Android gate
// *reading* it behind Face ID/Touch ID/fingerprint (or device passcode as a
// fallback) at the OS level -- not just behind an app-level check.
const REFRESH_TOKEN_KEY = 'techiefinder.biometric.refreshToken';

export async function isBiometricHardwareAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  return LocalAuthentication.isEnrolledAsync();
}

export async function isBiometricUnlockEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(ENABLED_FLAG_KEY)) === 'true';
}

export async function enableBiometricUnlock(refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken, {
    requireAuthentication: true,
  });
  await AsyncStorage.setItem(ENABLED_FLAG_KEY, 'true');
}

export async function disableBiometricUnlock(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await AsyncStorage.removeItem(ENABLED_FLAG_KEY);
}

// Re-stores a freshly-rotated refresh token after a successful unlock, so
// quick unlock keeps working next time instead of expiring after one use.
// A no-op if the user never enabled quick unlock in the first place.
export async function refreshStoredToken(refreshToken: string): Promise<void> {
  if (await isBiometricUnlockEnabled()) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken, {
      requireAuthentication: true,
    });
  }
}

/**
 * Prompts Face ID/Touch ID/fingerprint (via the OS-level Keychain/Keystore
 * gate on the stored item, not a separate app-level check) and returns the
 * stored refresh token on success, or null if the user cancels or fails.
 */
export async function unlockWithBiometrics(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY, {
      requireAuthentication: true,
    });
  } catch {
    return null;
  }
}
