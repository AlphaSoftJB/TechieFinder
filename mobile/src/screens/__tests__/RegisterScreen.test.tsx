import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../RegisterScreen';
import { useAuth } from '../../contexts/AuthContext';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('RegisterScreen', () => {
  it('validates required fields without calling register', async () => {
    const register = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({ register });

    const { getByText, getAllByText } = await render(<RegisterScreen navigation={{ navigate: jest.fn() }} />);
    await fireEvent.press(getAllByText('Create Account')[1]);

    await waitFor(() => expect(getByText('First name is required')).toBeTruthy());
    expect(register).not.toHaveBeenCalled();
  });

  it('rejects a password/confirmation mismatch without calling register', async () => {
    const register = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({ register });

    const { getByPlaceholderText, getByText, getAllByText } = await render(<RegisterScreen navigation={{ navigate: jest.fn() }} />);
    await fireEvent.changeText(getByPlaceholderText('Enter your first name'), 'Ada');
    await fireEvent.changeText(getByPlaceholderText('Enter your last name'), 'Lovelace');
    await fireEvent.changeText(getByPlaceholderText('Enter your email'), 'ada@example.com');
    await fireEvent.changeText(getByPlaceholderText('+234 800 000 0000'), '08012345678');
    await fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
    await fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'different123');
    await fireEvent.press(getAllByText('Create Account')[1]);

    await waitFor(() => expect(getByText('Passwords do not match')).toBeTruthy());
    expect(register).not.toHaveBeenCalled();
  });

  it('calls register with the entered details once the form is valid', async () => {
    const register = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({ register });

    const { getByPlaceholderText, getByText, getAllByText } = await render(<RegisterScreen navigation={{ navigate: jest.fn() }} />);
    await fireEvent.changeText(getByPlaceholderText('Enter your first name'), 'Ada');
    await fireEvent.changeText(getByPlaceholderText('Enter your last name'), 'Lovelace');
    await fireEvent.changeText(getByPlaceholderText('Enter your email'), 'ada@example.com');
    await fireEvent.changeText(getByPlaceholderText('+234 800 000 0000'), '08012345678');
    await fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
    await fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');
    await fireEvent.press(getAllByText('Create Account')[1]);

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phoneNumber: '08012345678',
        password: 'password123',
        role: 'USER',
      })
    );
  });
});
