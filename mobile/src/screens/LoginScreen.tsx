import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { SUPPORTED_LANGUAGES } from '../i18n';
import GoogleSignInButton from '../components/GoogleSignInButton';
import AppleSignInButton from '../components/AppleSignInButton';
import BiometricUnlockButton from '../components/BiometricUnlockButton';
import { useBiometricOptIn } from '../hooks/useBiometricOptIn';
import { refreshStoredToken } from '../lib/biometricAuth';

export default function LoginScreen({ navigation }: any) {
  const { login, loginWithGoogle, loginWithApple, unlockWithRefreshToken } = useAuth();
  const { offerBiometricOptIn } = useBiometricOptIn();
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: '', password: '' };

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = t('login.emailRequired');
      valid = false;
    } else if (!emailRegex.test(email)) {
      newErrors.email = t('login.emailInvalid');
      valid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = t('login.passwordRequired');
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = t('login.passwordTooShort');
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const auth = await login(email, password);
      // Navigation is handled automatically by AuthContext
      offerBiometricOptIn(auth.refreshToken);
    } catch (error: any) {
      Alert.alert(
        t('login.failedTitle'),
        error.message || t('login.failedDefault'),
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSocialError = (message: string) => {
    Alert.alert(t('login.failedTitle'), message, [{ text: 'OK' }]);
  };

  const handleGoogleToken = async (idToken: string) => {
    try {
      const auth = await loginWithGoogle(idToken);
      offerBiometricOptIn(auth.refreshToken);
    } catch (error: any) {
      handleSocialError(error.message || t('login.failedDefault'));
    }
  };

  const handleAppleToken = async (idToken: string, firstName?: string, lastName?: string) => {
    try {
      const auth = await loginWithApple(idToken, firstName, lastName);
      offerBiometricOptIn(auth.refreshToken);
    } catch (error: any) {
      handleSocialError(error.message || t('login.failedDefault'));
    }
  };

  const handleBiometricUnlock = async (refreshToken: string) => {
    try {
      const auth = await unlockWithRefreshToken(refreshToken);
      // Quietly rotate the stored secret so quick unlock keeps working next
      // time instead of expiring after a single use.
      await refreshStoredToken(auth.refreshToken);
    } catch (error: any) {
      Alert.alert(t('login.failedTitle'), error.message || t('login.failedDefault'), [{ text: 'OK' }]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo/Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="construct" size={60} color="#1B8B4D" />
          </View>
          <Text style={styles.title}>{t('login.title')}</Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
        </View>

        {/* Quick unlock -- hidden entirely unless the user previously
            enabled it and this device has biometric hardware enrolled */}
        <BiometricUnlockButton onUnlock={handleBiometricUnlock} />

        {/* Language switcher */}
        <View style={styles.languageRow}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => i18n.changeLanguage(lang.code)}
              style={[styles.languagePill, i18n.language === lang.code && styles.languagePillActive]}
            >
              <Text style={[styles.languagePillText, i18n.language === lang.code && styles.languagePillTextActive]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('login.emailLabel')}</Text>
            <View style={[styles.inputWrapper, errors.email ? styles.inputError : null]}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrors({ ...errors, email: '' });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('login.passwordLabel')}</Text>
            <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors({ ...errors, password: '' });
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>{t('login.forgotPassword')}</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>{t('login.submit')}</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('login.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social sign-in -- hidden entirely unless a client id is
              configured for this platform (see .env.example) */}
          <View style={styles.socialButtons}>
            <GoogleSignInButton onToken={handleGoogleToken} onError={handleSocialError} />
            <AppleSignInButton onToken={handleAppleToken} onError={handleSocialError} />
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>{t('login.noAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>{t('login.signUp')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  languagePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  languagePillActive: {
    backgroundColor: '#1B8B4D',
    borderColor: '#1B8B4D',
  },
  languagePillText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  languagePillTextActive: {
    color: '#fff',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1B8B4D',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#1B8B4D',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#1B8B4D',
    borderRadius: 12,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#1B8B4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666',
  },
  socialButtons: {
    gap: 12,
    marginBottom: 24,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#1B8B4D',
    fontWeight: 'bold',
  },
});
