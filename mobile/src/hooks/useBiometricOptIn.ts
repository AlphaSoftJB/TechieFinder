import { Alert } from 'react-native';
import {
  enableBiometricUnlock,
  isBiometricHardwareAvailable,
  isBiometricUnlockEnabled,
} from '../lib/biometricAuth';

/**
 * Offers to turn on Face ID/Touch ID/fingerprint quick unlock right after a
 * successful login/registration, the same way most banking/e-commerce apps
 * do. A no-op if there's no biometric hardware enrolled or it's already on.
 * Call this with the refreshToken from whatever just authenticated the user
 * (password, Google, or Apple -- quick unlock doesn't care how they signed in).
 */
export function useBiometricOptIn() {
  const offerBiometricOptIn = async (refreshToken: string) => {
    const [available, alreadyEnabled] = await Promise.all([
      isBiometricHardwareAvailable(),
      isBiometricUnlockEnabled(),
    ]);
    if (!available || alreadyEnabled) return;

    Alert.alert(
      'Enable quick unlock?',
      'Use Face ID, Touch ID, or your fingerprint to open TechieFinder next time instead of typing your password.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Enable',
          onPress: () => {
            enableBiometricUnlock(refreshToken).catch(() => {
              // Enabling quick unlock is a bonus, not required for login to
              // have succeeded -- silently skip it rather than blocking the
              // user with an error for a feature they didn't explicitly need.
            });
          },
        },
      ]
    );
  };

  return { offerBiometricOptIn };
}
