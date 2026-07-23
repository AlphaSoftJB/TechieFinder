import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { googleAuthConfig, isGoogleAuthConfigured } from '../lib/socialAuth';

// Required once per app so the in-app browser used for the OAuth redirect
// closes itself and hands control back here when Google redirects home.
WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  onToken: (idToken: string) => void;
  onError: (message: string) => void;
}

export default function GoogleSignInButton({ onToken, onError }: GoogleSignInButtonProps) {
  const { t } = useTranslation();
  const configured = isGoogleAuthConfigured();
  const { clientId, iosClientId, androidClientId } = googleAuthConfig();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId,
    iosClientId,
    androidClientId,
  });

  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      onToken(response.params.id_token);
    } else if (response?.type === 'error') {
      onError(t('login.googleSignInFailed'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  if (!configured) return null;

  return (
    <TouchableOpacity
      style={styles.button}
      disabled={!request}
      onPress={() => promptAsync()}
      testID="google-signin-button"
    >
      <Ionicons name="logo-google" size={18} color="#1f2937" style={styles.icon} />
      <Text style={styles.text}>{t('login.continueWithGoogle')}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
});
