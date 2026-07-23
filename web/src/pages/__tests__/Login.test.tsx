import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from '../Login';

const mockLogin = vi.fn();
const mockLoginWithGoogle = vi.fn();
const mockLoginWithApple = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, loginWithGoogle: mockLoginWithGoogle, loginWithApple: mockLoginWithApple }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('Login page', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
  });

  it('submits the entered credentials and navigates to the dashboard on success', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    });

    expect(mockLogin).toHaveBeenCalledWith('ada@example.com', 'password123');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows an error message and does not navigate when login fails', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid email or password. Please try again.'));
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong-password');
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    });

    expect(await screen.findByText('Invalid email or password. Please try again.')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('hides Google/Apple sign-in entirely when no client id is configured', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.queryByTestId('google-signin-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('apple-signin-button')).not.toBeInTheDocument();
  });
});
