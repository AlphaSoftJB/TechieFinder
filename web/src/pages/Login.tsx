import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import AppleSignInButton from '../components/AppleSignInButton';
import { appleClientId, googleClientId } from '../lib/socialAuth';

export default function Login() {
  const { login, loginWithGoogle, loginWithApple } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const hasSocialSignIn = !!googleClientId() || !!appleClientId();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleToken = async (idToken: string) => {
    setError('');
    try {
      await loginWithGoogle(idToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAppleToken = async (idToken: string, firstName?: string, lastName?: string) => {
    setError('');
    try {
      await loginWithApple(idToken, firstName, lastName);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900">{t('login.title')}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t('login.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
          {t('login.email')}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
          {t('login.password')}
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-md bg-emerald-700 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {loading ? t('login.submitting') : t('login.submit')}
        </button>

        {hasSocialSignIn && (
          <>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="text-xs text-neutral-400">{t('login.or')}</span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>
            <div className="flex flex-col gap-2">
              <GoogleSignInButton onToken={handleGoogleToken} onError={setError} />
              <AppleSignInButton onToken={handleAppleToken} onError={setError} />
            </div>
          </>
        )}
      </form>

      <p className="text-center text-sm text-neutral-500">
        {t('login.noAccount')}{' '}
        <Link to="/register" className="font-semibold text-emerald-700 hover:underline">
          {t('login.signUp')}
        </Link>
      </p>
    </div>
  );
}
