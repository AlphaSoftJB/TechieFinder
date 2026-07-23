import './src/i18n';

// expo-auth-session's Google provider and expo-apple-authentication both
// reach for real native/platform behavior (PKCE crypto, platform-specific
// client id checks, native sign-in sheets) that isn't meaningful under Jest.
// Screens that render GoogleSignInButton/AppleSignInButton just need these
// to no-op so the rest of the screen can still be tested.
jest.mock('expo-auth-session/providers/google', () => ({
  useIdTokenAuthRequest: () => [null, null, jest.fn()],
}));

jest.mock('expo-apple-authentication', () => {
  const React = require('react');
  const { TouchableOpacity } = require('react-native');
  return {
    isAvailableAsync: jest.fn().mockResolvedValue(false),
    signInAsync: jest.fn(),
    // A real (if minimal) pressable so tests can still find it by testID
    // and fire onPress, unlike a component that renders null.
    AppleAuthenticationButton: ({ testID, onPress }) =>
      React.createElement(TouchableOpacity, { testID, onPress }),
    AppleAuthenticationButtonType: { CONTINUE: 0 },
    AppleAuthenticationButtonStyle: { BLACK: 0 },
    AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
  };
});
