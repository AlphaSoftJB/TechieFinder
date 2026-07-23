import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import AppleSignInButton from '../AppleSignInButton';

describe('AppleSignInButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
  });

  it('renders nothing on Android regardless of availability', async () => {
    Platform.OS = 'android';
    (AppleAuthentication.isAvailableAsync as jest.Mock).mockResolvedValue(true);

    const { queryByTestId } = await render(<AppleSignInButton onToken={jest.fn()} onError={jest.fn()} />);
    expect(queryByTestId('apple-signin-button')).toBeNull();
  });

  it('renders nothing on iOS when Apple sign-in is not available on the device', async () => {
    (AppleAuthentication.isAvailableAsync as jest.Mock).mockResolvedValue(false);

    const { queryByTestId } = await render(<AppleSignInButton onToken={jest.fn()} onError={jest.fn()} />);
    await waitFor(() => expect(AppleAuthentication.isAvailableAsync).toHaveBeenCalled());
    expect(queryByTestId('apple-signin-button')).toBeNull();
  });

  it('forwards the identity token and name to onToken on a successful sign-in', async () => {
    (AppleAuthentication.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue({
      identityToken: 'apple-id-token',
      fullName: { givenName: 'Katherine', familyName: 'Johnson' },
    });

    const onToken = jest.fn();
    const { getByTestId } = await render(<AppleSignInButton onToken={onToken} onError={jest.fn()} />);
    await waitFor(() => expect(getByTestId('apple-signin-button')).toBeTruthy());

    fireEvent.press(getByTestId('apple-signin-button'));
    await waitFor(() => expect(onToken).toHaveBeenCalledWith('apple-id-token', 'Katherine', 'Johnson'));
  });

  it('silently ignores the user cancelling the native sheet', async () => {
    (AppleAuthentication.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (AppleAuthentication.signInAsync as jest.Mock).mockRejectedValue({ code: 'ERR_REQUEST_CANCELED' });

    const onError = jest.fn();
    const { getByTestId } = await render(<AppleSignInButton onToken={jest.fn()} onError={onError} />);
    await waitFor(() => expect(getByTestId('apple-signin-button')).toBeTruthy());

    fireEvent.press(getByTestId('apple-signin-button'));
    await waitFor(() => expect(AppleAuthentication.signInAsync).toHaveBeenCalled());
    expect(onError).not.toHaveBeenCalled();
  });

  it('reports an error for any other sign-in failure', async () => {
    (AppleAuthentication.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (AppleAuthentication.signInAsync as jest.Mock).mockRejectedValue({ code: 'ERR_INVALID_RESPONSE' });

    const onError = jest.fn();
    const { getByTestId } = await render(<AppleSignInButton onToken={jest.fn()} onError={onError} />);
    await waitFor(() => expect(getByTestId('apple-signin-button')).toBeTruthy());

    fireEvent.press(getByTestId('apple-signin-button'));
    await waitFor(() => expect(onError).toHaveBeenCalled());
  });
});
