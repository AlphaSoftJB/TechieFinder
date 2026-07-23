import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../AuthContext';
import api from '../../services/api';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest')
);

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
  apiErrorMessage: (error: any, fallback: string) => error?.response?.data?.message || fallback,
  setAuthToken: jest.fn(),
  setUnauthorizedHandler: jest.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('starts unauthenticated once the initial AsyncStorage read resolves', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('login stores the session and marks the user authenticated', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: {
        accessToken: 'token-123',
        refreshToken: 'refresh-123',
        userId: 1,
        email: 'test@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        role: 'USER',
      },
    });

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.firstName).toBe('Ada');
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });

    const stored = JSON.parse((await AsyncStorage.getItem('@techiefinder/auth')) as string);
    expect(stored.user.email).toBe('test@example.com');
  });

  it('login failure surfaces the backend message and leaves the user logged out', async () => {
    (api.post as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'Invalid email or password' } },
    });

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.login('test@example.com', 'wrong-password');
      })
    ).rejects.toThrow('Invalid email or password');

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('loginWithGoogle stores the session returned by the social endpoint', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: {
        accessToken: 'g-token', refreshToken: 'g-refresh', userId: 2,
        email: 'grace@example.com', firstName: 'Grace', lastName: 'Hopper', role: 'USER',
      },
    });

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loginWithGoogle('fake-google-id-token');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.firstName).toBe('Grace');
    expect(api.post).toHaveBeenCalledWith('/auth/social/google', { idToken: 'fake-google-id-token', role: undefined });
  });

  it('loginWithApple passes the client-supplied name through to the backend', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: {
        accessToken: 'a-token', refreshToken: 'a-refresh', userId: 3,
        email: 'katherine@example.com', firstName: 'Katherine', lastName: 'Johnson', role: 'USER',
      },
    });

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loginWithApple('fake-apple-id-token', 'Katherine', 'Johnson');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(api.post).toHaveBeenCalledWith('/auth/social/apple', {
      idToken: 'fake-apple-id-token', firstName: 'Katherine', lastName: 'Johnson', role: undefined,
    });
  });

  it('unlockWithRefreshToken redeems a stored refresh token for a new session', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: {
        accessToken: 'new-token', refreshToken: 'new-refresh', userId: 1,
        email: 'test@example.com', firstName: 'Ada', lastName: 'Lovelace', role: 'USER',
      },
    });

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.unlockWithRefreshToken('stored-refresh-token');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(api.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'stored-refresh-token' });
  });

  it('unlockWithRefreshToken surfaces a friendly message when the token is rejected', async () => {
    (api.post as jest.Mock).mockRejectedValueOnce({ response: { status: 401 } });

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.unlockWithRefreshToken('expired-token');
      })
    ).rejects.toThrow('Your session expired. Please log in again.');

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('logout clears the stored session', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: {
        accessToken: 't', refreshToken: 'r', userId: 1,
        email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'USER',
      },
    });

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.login('a@b.com', 'password123');
    });
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(await AsyncStorage.getItem('@techiefinder/auth')).toBeNull();
  });
});
