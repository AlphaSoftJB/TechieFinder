import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppleSignInButton from '../AppleSignInButton';

const mockLoadAppleScript = vi.fn();
let mockClientId: string | undefined;

vi.mock('../../lib/socialAuth', () => ({
  appleClientId: () => mockClientId,
  appleRedirectUri: () => 'http://localhost:3000',
  loadAppleScript: () => mockLoadAppleScript(),
}));

describe('AppleSignInButton', () => {
  beforeEach(() => {
    mockClientId = undefined;
    mockLoadAppleScript.mockReset();
    delete (window as any).AppleID;
  });

  it('renders nothing when no client id is configured', () => {
    const { container } = render(<AppleSignInButton onToken={vi.fn()} onError={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
    expect(mockLoadAppleScript).not.toHaveBeenCalled();
  });

  it('initializes the Apple JS SDK and forwards the id token and name to onToken', async () => {
    mockClientId = 'com.techiefinder.web';
    const init = vi.fn();
    const signIn = vi.fn().mockResolvedValue({
      authorization: { id_token: 'apple-id-token' },
      user: { name: { firstName: 'Katherine', lastName: 'Johnson' } },
    });
    (window as any).AppleID = { auth: { init, signIn } };
    mockLoadAppleScript.mockResolvedValue(undefined);

    const onToken = vi.fn();
    render(<AppleSignInButton onToken={onToken} onError={vi.fn()} />);

    await waitFor(() => expect(init).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'com.techiefinder.web', redirectURI: 'http://localhost:3000' })
    ));

    await userEvent.click(await screen.findByTestId('apple-signin-button'));

    expect(signIn).toHaveBeenCalled();
    await waitFor(() => expect(onToken).toHaveBeenCalledWith('apple-id-token', 'Katherine', 'Johnson'));
  });

  it('hides itself (no scary error banner) when the Apple script fails to load', async () => {
    mockClientId = 'com.techiefinder.web';
    mockLoadAppleScript.mockRejectedValue(new Error('offline'));

    const onError = vi.fn();
    const onAvailabilityChange = vi.fn();
    const { container } = render(
      <AppleSignInButton onToken={vi.fn()} onError={onError} onAvailabilityChange={onAvailabilityChange} />
    );

    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(onError).not.toHaveBeenCalled();
    expect(onAvailabilityChange).toHaveBeenCalledWith(false);
  });

  it('reports an error when sign-in itself fails for a reason other than the user cancelling', async () => {
    mockClientId = 'com.techiefinder.web';
    const init = vi.fn();
    const signIn = vi.fn().mockRejectedValue({ error: 'invalid_client' });
    (window as any).AppleID = { auth: { init, signIn } };
    mockLoadAppleScript.mockResolvedValue(undefined);

    const onError = vi.fn();
    render(<AppleSignInButton onToken={vi.fn()} onError={onError} />);

    await waitFor(() => expect(init).toHaveBeenCalled());
    await userEvent.click(await screen.findByTestId('apple-signin-button'));
    await waitFor(() => expect(onError).toHaveBeenCalledWith('Apple sign-in failed. Please try again.'));
  });

  it('does not report an error when the user simply cancels the native sheet', async () => {
    mockClientId = 'com.techiefinder.web';
    const init = vi.fn();
    const signIn = vi.fn().mockRejectedValue({ error: 'user_cancelled_authorize' });
    (window as any).AppleID = { auth: { init, signIn } };
    mockLoadAppleScript.mockResolvedValue(undefined);

    const onError = vi.fn();
    render(<AppleSignInButton onToken={vi.fn()} onError={onError} />);

    await waitFor(() => expect(init).toHaveBeenCalled());
    await userEvent.click(await screen.findByTestId('apple-signin-button'));
    await waitFor(() => expect(signIn).toHaveBeenCalled());
    expect(onError).not.toHaveBeenCalled();
  });
});
