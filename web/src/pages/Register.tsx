import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, type UserRole } from '../contexts/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phoneNumber: '', password: '', role: 'USER' as UserRole,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900">{t('register.title')}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t('register.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => update('role', 'USER')}
            className={`flex-1 rounded-md border py-2 text-sm font-medium ${form.role === 'USER' ? 'border-emerald-700 bg-emerald-50 text-emerald-700' : 'border-neutral-300 text-neutral-600'}`}
          >
            {t('register.roleUser')}
          </button>
          <button
            type="button"
            onClick={() => update('role', 'TECHNICIAN')}
            className={`flex-1 rounded-md border py-2 text-sm font-medium ${form.role === 'TECHNICIAN' ? 'border-emerald-700 bg-emerald-50 text-emerald-700' : 'border-neutral-300 text-neutral-600'}`}
          >
            {t('register.roleTechnician')}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
            {t('register.firstName')}
            <input required value={form.firstName} onChange={(e) => update('firstName', e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
            {t('register.lastName')}
            <input required value={form.lastName} onChange={(e) => update('lastName', e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
          {t('register.email')}
          <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
          {t('register.phoneNumber')}
          <input value={form.phoneNumber} onChange={(e) => update('phoneNumber', e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
          {t('register.password')}
          <input type="password" required minLength={6} value={form.password} onChange={(e) => update('password', e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-md bg-emerald-700 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {loading ? t('register.submitting') : t('register.submit')}
        </button>
      </form>

      <p className="text-center text-sm text-neutral-500">
        {t('register.haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-emerald-700 hover:underline">
          {t('register.logIn')}
        </Link>
      </p>
    </div>
  );
}
