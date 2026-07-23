import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GoogleSignInButton from '../GoogleSignInButton';

const mockLoadGoogleScript = vi.fn();
let mockClientId: string | undefined;

vi.mock('../../lib/socialAuth', () => ({
  googleClientId: () => mockClientId,
  loadGoogleScript: () => mockLoadGoogleScript(),
}));

describe('GoogleSignInButton', () => {
  beforeEach(() => {
    mockClientId = undefined;
    mockLoadGoogleScript.mockReset();
    delete (window as any).google;
  });

  it('renders nothing when no client id is configured', () => {
    const { container } = render(<GoogleSignInButton onToken={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
    expect(mockLoadGoogleScript).not.toHaveBeenCalled();
  });

  it('initializes Google Identity Services and forwards the credential to onToken', async () => {
    mockClientId = 'test-client-id.apps.googleusercontent.com';
    const initialize = vi.fn();
    const renderButton = vi.fn();
    (window as any).google = { accounts: { id: { initialize, renderButton } } };
    mockLoadGoogleScript.mockResolvedValue(undefined);

    const onToken = vi.fn();
    render(<GoogleSignInButton onToken={onToken} />);

    await waitFor(() => expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'test-client-id.apps.googleusercontent.com' })
    ));
    expect(renderButton).toHaveBeenCalled();

    const callback = initialize.mock.calls[0][0].callback;
    callback({ credential: 'signed-id-token' });
    expect(onToken).toHaveBeenCalledWith('signed-id-token');
  });

  it('hides itself (no scary error banner) when the Google script fails to load', async () => {
    mockClientId = 'test-client-id.apps.googleusercontent.com';
    mockLoadGoogleScript.mockRejectedValue(new Error('offline'));

    const onAvailabilityChange = vi.fn();
    const { container } = render(<GoogleSignInButton onToken={vi.fn()} onAvailabilityChange={onAvailabilityChange} />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(onAvailabilityChange).toHaveBeenCalledWith(false);
  });

  it('reports itself as unavailable immediately when no client id is configured', () => {
    const onAvailabilityChange = vi.fn();
    render(<GoogleSignInButton onToken={vi.fn()} onAvailabilityChange={onAvailabilityChange} />);
    expect(onAvailabilityChange).toHaveBeenCalledWith(false);
  });
});
