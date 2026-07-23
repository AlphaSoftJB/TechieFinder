import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import GoogleSignInButton from '../GoogleSignInButton';

const mockPromptAsync = jest.fn();
let mockResponse: any = null;
let mockConfig: { clientId?: string; iosClientId?: string; androidClientId?: string } = {};

jest.mock('expo-auth-session/providers/google', () => ({
  useIdTokenAuthRequest: () => [{}, mockResponse, mockPromptAsync],
}));

jest.mock('../../lib/socialAuth', () => ({
  googleAuthConfig: () => mockConfig,
  isGoogleAuthConfigured: () => !!(mockConfig.clientId || mockConfig.iosClientId || mockConfig.androidClientId),
}));

describe('GoogleSignInButton', () => {
  beforeEach(() => {
    mockPromptAsync.mockReset();
    mockResponse = null;
    mockConfig = {};
  });

  it('renders nothing when no client id is configured', async () => {
    const { queryByTestId } = await render(<GoogleSignInButton onToken={jest.fn()} onError={jest.fn()} />);
    expect(queryByTestId('google-signin-button')).toBeNull();
  });

  it('prompts the Google auth flow when pressed', async () => {
    mockConfig = { clientId: 'test-client-id' };
    const { getByTestId } = await render(<GoogleSignInButton onToken={jest.fn()} onError={jest.fn()} />);

    fireEvent.press(getByTestId('google-signin-button'));
    expect(mockPromptAsync).toHaveBeenCalled();
  });

  it('forwards the id token to onToken once the auth response succeeds', async () => {
    mockConfig = { clientId: 'test-client-id' };
    mockResponse = { type: 'success', params: { id_token: 'signed-id-token' } };

    const onToken = jest.fn();
    render(<GoogleSignInButton onToken={onToken} onError={jest.fn()} />);

    await waitFor(() => expect(onToken).toHaveBeenCalledWith('signed-id-token'));
  });

  it('reports an error when the auth response fails', async () => {
    mockConfig = { clientId: 'test-client-id' };
    mockResponse = { type: 'error' };

    const onError = jest.fn();
    render(<GoogleSignInButton onToken={jest.fn()} onError={onError} />);

    await waitFor(() => expect(onError).toHaveBeenCalled());
  });
});
