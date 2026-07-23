import { useEffect, useRef } from 'react';
import { googleClientId, loadGoogleScript } from '../lib/socialAuth';

interface GoogleSignInButtonProps {
  onToken: (idToken: string) => void;
  onError: (message: string) => void;
}

export default function GoogleSignInButton({ onToken, onError }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = googleClientId();

  useEffect(() => {
    if (!clientId || !containerRef.current) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => onToken(response.credential),
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: 320,
        });
      })
      .catch(() => onError('Could not load Google Sign-In. Check your connection and try again.'));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (!clientId) return null;

  return <div ref={containerRef} data-testid="google-signin-button" />;
}
