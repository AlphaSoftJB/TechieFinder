import { describe, expect, it } from 'vitest';
import { apiErrorMessage } from '../api';

describe('apiErrorMessage', () => {
  it('returns the backend message when present', () => {
    const error = { response: { data: { message: 'Email already exists' } } };
    expect(apiErrorMessage(error, 'fallback')).toBe('Email already exists');
  });

  it('falls back when the error has no response body', () => {
    expect(apiErrorMessage(new Error('network down'), 'fallback')).toBe('fallback');
  });

  it('falls back when the response body has no message field', () => {
    const error = { response: { data: {} } };
    expect(apiErrorMessage(error, 'fallback')).toBe('fallback');
  });
});
