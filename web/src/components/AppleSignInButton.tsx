import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { appleClientId, appleRedirectUri, loadAppleScript } from '../lib/socialAuth';

interface AppleSignInButtonProps {
  onToken: (idToken: string, firstName?: string, lastName?: string) => void;
  onError: (message: string) => void;
}

export default function AppleSignInButton({ onToken, onError }: AppleSignInButtonProps) {
  const { t } = useTranslation();
  const clientId = appleClientId();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!clientId) return;
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
      .catch(() => onError('Could not load Apple Sign-In. Check your connection and try again.'));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (!clientId) return null;

  const handleClick = async () => {
    if (!window.AppleID) return;
    try {
      const result = await window.AppleID.auth.signIn();
      onToken(
        result.authorization.id_token,
        result.user?.name?.firstName,
        result.user?.name?.lastName
      );
    } catch {
      // The user closing the popup also rejects this promise -- not an error
      // worth surfacing.
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
