import { useEffect, useRef, useState } from 'react';
import { googleClientId, loadGoogleScript } from '../lib/socialAuth';

interface GoogleSignInButtonProps {
  onToken: (idToken: string) => void;
  // Lets the parent hide a leftover "or" divider if this ends up being the
  // only social button and it fails to load -- see Login.tsx/Register.tsx.
  onAvailabilityChange?: (available: boolean) => void;
}

// Google's button renderer takes a fixed pixel width, not "100%" -- so it's
// measured from the container on mount and whenever the container resizes,
// clamped to Google's supported range, to match the full-width Apple button
// next to it instead of overflowing/underflowing on narrow or wide screens.
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function GoogleSignInButton({ onToken, onAvailabilityChange }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = googleClientId();
  // Google's script can fail to load for reasons that have nothing to do
  // with anything the user just did (an ad-blocker, a corporate proxy, no
  // network) -- rather than greet every visitor with a scary top-of-form
  // error banner for a background script they never asked for, this just
  // hides the button, same as if it were never configured at all.
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (!clientId) {
      onAvailabilityChange?.(false);
      return;
    }
    onAvailabilityChange?.(true);
    if (!containerRef.current) return;
    let cancelled = false;
    const container = containerRef.current;

    const render = () => {
      if (!window.google || !container) return;
      const width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, container.clientWidth || MAX_WIDTH));
      container.innerHTML = '';
      window.google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width,
      });
    };

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => onToken(response.credential),
        });
        render();
      })
      .catch(() => {
        if (cancelled) return;
        setAvailable(false);
        onAvailabilityChange?.(false);
      });

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => render()) : null;
    resizeObserver?.observe(container);

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (!clientId || !available) return null;

  return <div ref={containerRef} className="flex w-full justify-center" data-testid="google-signin-button" />;
}
