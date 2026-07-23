// Thin script-loader helpers for Google Identity Services and the Apple JS
// SDK. Both are loaded lazily (only when the matching button actually
// mounts) and only if this deployment's client id env var is set --
// otherwise the buttons render nothing at all.

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const APPLE_SCRIPT_SRC = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

let googleScriptPromise: Promise<void> | null = null;
let appleScriptPromise: Promise<void> | null = null;

function loadScriptOnce(src: string, cached: Promise<void> | null, setCache: (p: Promise<void>) => void): Promise<void> {
  if (cached) return cached;
  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
  setCache(promise);
  return promise;
}

export function loadGoogleScript(): Promise<void> {
  return loadScriptOnce(GOOGLE_SCRIPT_SRC, googleScriptPromise, (p) => (googleScriptPromise = p));
}

export function loadAppleScript(): Promise<void> {
  return loadScriptOnce(APPLE_SCRIPT_SRC, appleScriptPromise, (p) => (appleScriptPromise = p));
}

export function googleClientId(): string | undefined {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
}

export function appleClientId(): string | undefined {
  return import.meta.env.VITE_APPLE_CLIENT_ID as string | undefined;
}

export function appleRedirectUri(): string {
  return (import.meta.env.VITE_APPLE_REDIRECT_URI as string | undefined) || window.location.origin;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization: { id_token: string };
          user?: { name?: { firstName?: string; lastName?: string } };
        }>;
      };
    };
  }
}
