import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { appleClientId, appleRedirectUri, loadAppleScript } from '../lib/socialAuth';

interface AppleSignInButtonProps {
  onToken: (idToken: string, firstName?: string, lastName?: string) => void;
  onError: (message: string) => void;
  // Lets the parent hide a leftover "or" divider if this ends up being the
  // only social button and it fails to load -- see Login.tsx/Register.tsx.
  onAvailabilityChange?: (available: boolean) => void;
}

export default function AppleSignInButton({ onToken, onError, onAvailabilityChange }: AppleSignInButtonProps) {
  const { t } = useTranslation();
  const clientId = appleClientId();
  const [ready, setReady] = useState(false);
  // Mirrors GoogleSignInButton: an SDK that fails to load (ad-blocker,
  // corporate proxy, offline) just hides the button instead of surfacing a
  // top-of-form error banner for something the user never asked for.
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (!clientId) {
      onAvailabilityChange?.(false);
      return;
    }
    onAvailabilityChange?.(true);
    let cancelled = false;

    loadAppleScript()
      .then(() => {
        if (cancelled || !window.AppleID) return;
        window.AppleID.auth.init({
          clientId,
          scope: 'name email',
          redirectURI: appleRedirectUri(),
          usePopup: true,
        });
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setAvailable(false);
        onAvailabilityChange?.(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (!clientId || !available) return null;

  const handleClick = async () => {
    if (!window.AppleID) return;
    try {
      const result = await window.AppleID.auth.signIn();
      onToken(
        result.authorization.id_token,
        result.user?.name?.firstName,
        result.user?.name?.lastName
      );
    } catch (error: any) {
      // The user closing the popup rejects this promise with an error code
      // like 'user_cancelled_authorize' -- not worth surfacing as a failure.
      const code = String(error?.error || '').toLowerCase();
      if (!code.includes('cancel')) {
        onError(t('login.appleSignInFailed'));
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!ready}
      data-testid="apple-signin-button"
      className="flex w-full items-center justify-center gap-2 rounded-md bg-black py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
    >
      <span aria-hidden="true"></span>
      {t('login.continueWithApple')}
    </button>
  );
}
