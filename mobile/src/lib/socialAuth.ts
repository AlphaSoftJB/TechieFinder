// Centralizes reading the Google/Apple sign-in env vars so the button
// components can be tested by mocking this module instead of fighting
// Expo's build-time inlining of process.env.EXPO_PUBLIC_* values.

export interface GoogleAuthConfig {
  clientId?: string;
  iosClientId?: string;
  androidClientId?: string;
}

export function googleAuthConfig(): GoogleAuthConfig {
  return {
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  };
}

export function isGoogleAuthConfigured(): boolean {
  const config = googleAuthConfig();
  return !!(config.clientId || config.iosClientId || config.androidClientId);
}
