import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import {
  disableBiometricUnlock,
  enableBiometricUnlock,
  isBiometricHardwareAvailable,
  isBiometricUnlockEnabled,
  refreshStoredToken,
  unlockWithBiometrics,
} from '../biometricAuth';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest')
);

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('biometricAuth', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('isBiometricHardwareAvailable', () => {
    it('is false when the device has no biometric hardware at all', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
      expect(await isBiometricHardwareAvailable()).toBe(false);
      expect(LocalAuthentication.isEnrolledAsync).not.toHaveBeenCalled();
    });

    it('is false when hardware exists but nothing is enrolled', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);
      expect(await isBiometricHardwareAvailable()).toBe(false);
    });

    it('is true when hardware exists and a face/fingerprint is enrolled', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      expect(await isBiometricHardwareAvailable()).toBe(true);
    });
  });

  it('reports quick unlock as disabled until enableBiometricUnlock is called', async () => {
    expect(await isBiometricUnlockEnabled()).toBe(false);

    await enableBiometricUnlock('refresh-token-abc');

    expect(await isBiometricUnlockEnabled()).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'techiefinder.biometric.refreshToken',
      'refresh-token-abc',
      expect.objectContaining({ requireAuthentication: true })
    );
  });

  it('clears both the flag and the stored secret when disabled', async () => {
    await enableBiometricUnlock('refresh-token-abc');
    await disableBiometricUnlock();

    expect(await isBiometricUnlockEnabled()).toBe(false);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('techiefinder.biometric.refreshToken');
  });

  it('refreshStoredToken re-stores the token only if quick unlock is already enabled', async () => {
    await refreshStoredToken('should-not-be-stored');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();

    await enableBiometricUnlock('first-token');
    jest.clearAllMocks();

    await refreshStoredToken('rotated-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'techiefinder.biometric.refreshToken',
      'rotated-token',
      expect.objectContaining({ requireAuthentication: true })
    );
  });

  describe('unlockWithBiometrics', () => {
    it('returns the stored refresh token once the OS-level prompt succeeds', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('the-refresh-token');
      expect(await unlockWithBiometrics()).toBe('the-refresh-token');
    });

    it('returns null instead of throwing when the prompt is cancelled or fails', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('user canceled'));
      expect(await unlockWithBiometrics()).toBeNull();
    });
  });
});
