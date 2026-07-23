import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import BiometricUnlockButton from '../BiometricUnlockButton';

let mockHardwareAvailable = false;
let mockEnabled = false;
const mockUnlockWithBiometrics = jest.fn();

jest.mock('../../lib/biometricAuth', () => ({
  isBiometricHardwareAvailable: () => Promise.resolve(mockHardwareAvailable),
  isBiometricUnlockEnabled: () => Promise.resolve(mockEnabled),
  unlockWithBiometrics: () => mockUnlockWithBiometrics(),
}));

describe('BiometricUnlockButton', () => {
  beforeEach(() => {
    mockHardwareAvailable = false;
    mockEnabled = false;
    mockUnlockWithBiometrics.mockReset();
  });

  it('renders nothing when quick unlock was never enabled', async () => {
    mockHardwareAvailable = true;
    mockEnabled = false;

    const { queryByTestId } = await render(<BiometricUnlockButton onUnlock={jest.fn()} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(queryByTestId('biometric-unlock-button')).toBeNull();
  });

  it('renders nothing when there is no biometric hardware, even if enabled was somehow set', async () => {
    mockHardwareAvailable = false;
    mockEnabled = true;

    const { queryByTestId } = await render(<BiometricUnlockButton onUnlock={jest.fn()} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(queryByTestId('biometric-unlock-button')).toBeNull();
  });

  it('prompts biometrics on press and forwards the refresh token to onUnlock', async () => {
    mockHardwareAvailable = true;
    mockEnabled = true;
    mockUnlockWithBiometrics.mockResolvedValue('the-refresh-token');

    const onUnlock = jest.fn();
    const { getByTestId } = await render(<BiometricUnlockButton onUnlock={onUnlock} />);
    await waitFor(() => expect(getByTestId('biometric-unlock-button')).toBeTruthy());

    fireEvent.press(getByTestId('biometric-unlock-button'));
    await waitFor(() => expect(onUnlock).toHaveBeenCalledWith('the-refresh-token'));
  });

  it('does not call onUnlock when the user cancels the prompt', async () => {
    mockHardwareAvailable = true;
    mockEnabled = true;
    mockUnlockWithBiometrics.mockResolvedValue(null);

    const onUnlock = jest.fn();
    const { getByTestId } = await render(<BiometricUnlockButton onUnlock={onUnlock} />);
    await waitFor(() => expect(getByTestId('biometric-unlock-button')).toBeTruthy());

    fireEvent.press(getByTestId('biometric-unlock-button'));
    await waitFor(() => expect(mockUnlockWithBiometrics).toHaveBeenCalled());
    expect(onUnlock).not.toHaveBeenCalled();
  });
});
