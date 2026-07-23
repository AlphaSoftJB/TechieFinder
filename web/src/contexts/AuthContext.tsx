import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import api, { apiErrorMessage, setAuthToken, setUnauthorizedHandler } from '../lib/api';

const STORAGE_KEY = 'techiefinder.auth';

export type UserRole = 'USER' | 'TECHNICIAN' | 'ADMIN';

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface StoredAuth {
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
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginWithGoogle: (idToken: string, role?: UserRole) => Promise<void>;
  loginWithApple: (idToken: string, firstName?: string, lastName?: string, role?: UserRole) => Promise<void>;
  logout: () => void;
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
  const [loading, setLoading] = useState(true);

  const persist = (auth: StoredAuth) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    setAuthToken(auth.accessToken);
    setToken(auth.accessToken);
    setUser(auth.user);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    setUnauthorizedHandler(() => logout());

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const stored: StoredAuth = JSON.parse(raw);
        setAuthToken(stored.accessToken);
        setToken(stored.accessToken);
        setUser(stored.user);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);

    return () => setUnauthorizedHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      persist(toStoredAuth(response.data));
    } catch (error) {
      throw new Error(apiErrorMessage(error, 'Invalid email or password. Please try again.'));
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.post('/auth/register', data);
      persist(toStoredAuth(response.data));
    } catch (error) {
      throw new Error(apiErrorMessage(error, 'Unable to create account. Please try again.'));
    }
  };

  const loginWithGoogle = async (idToken: string, role?: UserRole) => {
    try {
      const response = await api.post('/auth/social/google', { idToken, role });
      persist(toStoredAuth(response.data));
    } catch (error) {
      throw new Error(apiErrorMessage(error, 'Unable to sign in with Google. Please try again.'));
    }
  };

  const loginWithApple = async (idToken: string, firstName?: string, lastName?: string, role?: UserRole) => {
    try {
      const response = await api.post('/auth/social/apple', { idToken, firstName, lastName, role });
      persist(toStoredAuth(response.data));
    } catch (error) {
      throw new Error(apiErrorMessage(error, 'Unable to sign in with Apple. Please try again.'));
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!token, loading, login, register, loginWithGoogle, loginWithApple, logout }}
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
