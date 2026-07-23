import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import BiometricUnlockToggle from '../BiometricUnlockToggle';
import { useAuth } from '../../contexts/AuthContext';

let mockHardwareAvailable = false;
let mockEnabled = false;
const mockEnable = jest.fn();
const mockDisable = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../lib/biometricAuth', () => ({
  isBiometricHardwareAvailable: () => Promise.resolve(mockHardwareAvailable),
  isBiometricUnlockEnabled: () => Promise.resolve(mockEnabled),
  enableBiometricUnlock: (...args: unknown[]) => mockEnable(...args),
  disableBiometricUnlock: (...args: unknown[]) => mockDisable(...args),
}));

describe('BiometricUnlockToggle', () => {
  beforeEach(() => {
    mockHardwareAvailable = false;
    mockEnabled = false;
    mockEnable.mockReset().mockResolvedValue(undefined);
    mockDisable.mockReset().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({ refreshToken: 'current-refresh-token' });
  });

  it('renders nothing on a device with no biometric hardware', async () => {
    mockHardwareAvailable = false;

    const { queryByTestId } = await render(<BiometricUnlockToggle />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(queryByTestId('biometric-unlock-toggle')).toBeNull();
  });

  it('turns quick unlock on using the current session refresh token', async () => {
    mockHardwareAvailable = true;
    mockEnabled = false;

    const { getByRole } = await render(<BiometricUnlockToggle />);
    const toggle = await waitFor(() => getByRole('switch'));

    fireEvent(toggle, 'valueChange', true);

    await waitFor(() => expect(mockEnable).toHaveBeenCalledWith('current-refresh-token'));
  });

  it('turns quick unlock off', async () => {
    mockHardwareAvailable = true;
    mockEnabled = true;

    const { getByRole } = await render(<BiometricUnlockToggle />);
    const toggle = await waitFor(() => getByRole('switch'));

    fireEvent(toggle, 'valueChange', false);

    await waitFor(() => expect(mockDisable).toHaveBeenCalled());
  });
});
