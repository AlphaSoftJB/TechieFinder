import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import {
  disableBiometricUnlock,
  enableBiometricUnlock,
  isBiometricHardwareAvailable,
  isBiometricUnlockEnabled,
} from '../lib/biometricAuth';

// Lets an already-logged-in user turn quick unlock on/off from their
// account screen (as opposed to the one-time opt-in prompt right after
// login -- see useBiometricOptIn.ts). Hidden entirely on devices with no
// biometric hardware enrolled.
export default function BiometricUnlockToggle() {
  const { refreshToken } = useAuth();
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([isBiometricHardwareAvailable(), isBiometricUnlockEnabled()]).then(
      ([hw, on]) => {
        if (!cancelled) {
          setAvailable(hw);
          setEnabled(on);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (!available) return null;

  const handleToggle = async (value: boolean) => {
    setBusy(true);
    try {
      if (value) {
        if (!refreshToken) return;
        await enableBiometricUnlock(refreshToken);
      } else {
        await disableBiometricUnlock();
      }
      setEnabled(value);
    } catch {
      Alert.alert('Something went wrong', 'Could not update quick unlock. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.row} testID="biometric-unlock-toggle">
      <Text style={styles.label}>Quick unlock with Face ID / Touch ID</Text>
      <Switch value={enabled} onValueChange={handleToggle} disabled={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
});
