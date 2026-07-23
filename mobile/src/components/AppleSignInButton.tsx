import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

interface AppleSignInButtonProps {
  onToken: (idToken: string, firstName?: string, lastName?: string) => void;
  onError: (message: string) => void;
}

export default function AppleSignInButton({ onToken, onError }: AppleSignInButtonProps) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync()
      .then(setAvailable)
      .catch(() => setAvailable(false));
  }, []);

  if (Platform.OS !== 'ios' || !available) return null;

  const handlePress = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        onError('Apple did not return a sign-in token. Please try again.');
        return;
      }
      onToken(credential.identityToken, credential.fullName?.givenName ?? undefined, credential.fullName?.familyName ?? undefined);
    } catch (error: any) {
      // ERR_REQUEST_CANCELED is the user dismissing the native sheet -- not
      // worth surfacing as an error.
      if (error?.code !== 'ERR_REQUEST_CANCELED') {
        onError('Apple sign-in failed. Please try again.');
      }
    }
  };

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={12}
      style={styles.button}
      onPress={handlePress}
      testID="apple-signin-button"
    />
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    width: '100%',
  },
});
