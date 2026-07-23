import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  isBiometricHardwareAvailable,
  isBiometricUnlockEnabled,
  unlockWithBiometrics,
} from '../lib/biometricAuth';

interface BiometricUnlockButtonProps {
  onUnlock: (refreshToken: string) => void;
}

export default function BiometricUnlockButton({ onUnlock }: BiometricUnlockButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([isBiometricHardwareAvailable(), isBiometricUnlockEnabled()])
      .then(([available, enabled]) => {
        if (!cancelled) setVisible(available && enabled);
      })
      .catch(() => {
        if (!cancelled) setVisible(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;

  const handlePress = async () => {
    const refreshToken = await unlockWithBiometrics();
    if (refreshToken) {
      onUnlock(refreshToken);
    }
    // A null result means the user cancelled or failed the prompt -- just
    // stay on the login screen, same as dismissing any native auth sheet.
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress} testID="biometric-unlock-button">
      <Ionicons name="finger-print-outline" size={22} color="#1B8B4D" />
      <Text style={styles.text}>Unlock with Face ID / Touch ID</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1B8B4D',
    backgroundColor: '#F0FDF4',
    marginBottom: 20,
    gap: 8,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B8B4D',
  },
});
