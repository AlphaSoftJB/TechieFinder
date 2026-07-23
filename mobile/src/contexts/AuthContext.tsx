import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { apiErrorMessage, setAuthToken, setUnauthorizedHandler } from '../services/api';

const STORAGE_KEY = '@techiefinder/auth';

export type UserRole = 'USER' | 'TECHNICIAN' | 'ADMIN';

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<StoredAuth>;
  register: (data: RegisterData) => Promise<StoredAuth>;
  loginWithGoogle: (idToken: string, role?: UserRole) => Promise<StoredAuth>;
  loginWithApple: (idToken: string, firstName?: string, lastName?: string, role?: UserRole) => Promise<StoredAuth>;
  unlockWithRefreshToken: (refreshToken: string) => Promise<StoredAuth>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toStoredAuth(response: any): StoredAuth {
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    user: {
      id: response.userId,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = async (auth: StoredAuth): Promise<StoredAuth> => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    setAuthToken(auth.accessToken);
    setToken(auth.accessToken);
    setRefreshToken(auth.refreshToken);
    setUser(auth.user);
    return auth;
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored: StoredAuth = JSON.parse(raw);
          setAuthToken(stored.accessToken);
          setToken(stored.accessToken);
          setRefreshToken(stored.refreshToken);
          setUser(stored.user);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => setUnauthorizedHandler(null);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return await persist(toStoredAuth(response.data));
    } catch (error: any) {
      throw new Error(apiErrorMessage(error, 'Invalid email or password. Please try again.'));
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.post('/auth/register', data);
      return await persist(toStoredAuth(response.data));
    } catch (error: any) {
      throw new Error(apiErrorMessage(error, 'Unable to create account. Please try again.'));
    }
  };

  const loginWithGoogle = async (idToken: string, role?: UserRole) => {
    try {
      const response = await api.post('/auth/social/google', { idToken, role });
      return await persist(toStoredAuth(response.data));
    } catch (error: any) {
      throw new Error(apiErrorMessage(error, 'Unable to sign in with Google. Please try again.'));
    }
  };

  const loginWithApple = async (idToken: string, firstName?: string, lastName?: string, role?: UserRole) => {
    try {
      const response = await api.post('/auth/social/apple', { idToken, firstName, lastName, role });
      return await persist(toStoredAuth(response.data));
    } catch (error: any) {
      throw new Error(apiErrorMessage(error, 'Unable to sign in with Apple. Please try again.'));
    }
  };

  // Redeems a refresh token (pulled from SecureStore after a biometric
  // prompt) for a fresh session, without asking for the password again. The
  // caller re-stores the freshly-rotated refreshToken this returns so quick
  // unlock keeps working next time (see biometricAuth.ts).
  const unlockWithRefreshToken = async (refreshToken: string) => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      return await persist(toStoredAuth(response.data));
    } catch (error: any) {
      throw new Error(apiErrorMessage(error, 'Your session expired. Please log in again.'));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user, token, refreshToken, isAuthenticated: !!token, loading,
        login, register, loginWithGoogle, loginWithApple, unlockWithRefreshToken, logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
