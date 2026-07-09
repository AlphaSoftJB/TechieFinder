import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';

vi.mock('../../lib/api', () => ({
  default: { post: vi.fn() },
  apiErrorMessage: (_err: unknown, fallback: string) => fallback,
  setAuthToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}));

import api from '../../lib/api';

function TestConsumer() {
  const { user, isAuthenticated, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user ? `${user.firstName} ${user.role}` : 'none'}</span>
      <button onClick={() => login('a@b.com', 'password123')}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.post).mockReset();
  });

  it('starts unauthenticated with no stored session', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('restores a persisted session from localStorage', async () => {
    localStorage.setItem(
      'techiefinder.auth',
      JSON.stringify({
        accessToken: 'token123',
        refreshToken: 'refresh123',
        user: { id: 1, email: 'a@b.com', firstName: 'Ada', lastName: 'Lovelace', role: 'USER' },
      })
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('true'));
    expect(screen.getByTestId('user')).toHaveTextContent('Ada USER');
  });

  it('logs in successfully and persists the session', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        accessToken: 'tok', refreshToken: 'ref', userId: 1,
        email: 'a@b.com', firstName: 'Ada', lastName: 'Lovelace', role: 'USER',
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await act(async () => {
      await userEvent.click(screen.getByText('login'));
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(JSON.parse(localStorage.getItem('techiefinder.auth')!).user.firstName).toBe('Ada');
  });

  it('logs out and clears the persisted session', async () => {
    localStorage.setItem(
      'techiefinder.auth',
      JSON.stringify({
        accessToken: 'token123',
        refreshToken: 'refresh123',
        user: { id: 1, email: 'a@b.com', firstName: 'Ada', lastName: 'Lovelace', role: 'USER' },
      })
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('true'));

    await act(async () => {
      await userEvent.click(screen.getByText('logout'));
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(localStorage.getItem('techiefinder.auth')).toBeNull();
  });
});
