import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';
import { useAuth } from '../../contexts/AuthContext';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('LoginScreen', () => {
  it('validates required fields without calling login', async () => {
    const login = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({ login });

    const { getByText } = await render(<LoginScreen navigation={{ navigate: jest.fn() }} />);
    await fireEvent.press(getByText('Login'));

    await waitFor(() => expect(getByText('Email is required')).toBeTruthy());
    expect(login).not.toHaveBeenCalled();
  });

  it('calls login with the entered credentials once the form is valid', async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({ login });

    const { getByPlaceholderText, getByText } = await render(<LoginScreen navigation={{ navigate: jest.fn() }} />);
    await fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    await fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    await fireEvent.press(getByText('Login'));

    await waitFor(() => expect(login).toHaveBeenCalledWith('test@example.com', 'password123'));
  });

  it('shows an alert-worthy error without crashing when login rejects', async () => {
    const login = jest.fn().mockRejectedValue(new Error('Invalid email or password'));
    (useAuth as jest.Mock).mockReturnValue({ login });

    const { getByPlaceholderText, getByText } = await render(<LoginScreen navigation={{ navigate: jest.fn() }} />);
    await fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    await fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    await fireEvent.press(getByText('Login'));

    await waitFor(() => expect(login).toHaveBeenCalled());
  });
});
