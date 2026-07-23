import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { SUPPORTED_LANGUAGES } from '../i18n';

function LanguageSelect({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();
  return (
    <>
      <label className="sr-only" htmlFor="language-select">
        {t('language.label')}
      </label>
      <select
        id="language-select"
        value={i18n.resolvedLanguage || 'en'}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className={className}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </>
  );
}

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 font-bold text-lg text-emerald-700"
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white text-sm">
              TF
            </span>
            <span className="whitespace-nowrap">TechieFinder</span>
          </Link>

          {/* Desktop nav -- collapses into the toggle button below md */}
          <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-600 md:flex">
            <Link to="/search" className="hover:text-emerald-700">
              {t('nav.findTechnician')}
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="hover:text-emerald-700">
                  {user?.role === 'ADMIN' ? t('nav.admin') : t('nav.dashboard')}
                </Link>
                <span className="text-neutral-400">|</span>
                <span className="text-neutral-500">{t('nav.hi', { name: user?.firstName })}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-neutral-100 px-3 py-1.5 text-neutral-700 hover:bg-neutral-200"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-emerald-700">
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-emerald-700 px-4 py-1.5 text-white hover:bg-emerald-800"
                >
                  {t('nav.signup')}
                </Link>
              </>
            )}
            <LanguageSelect className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-600" />
          </nav>

          {/* Mobile menu toggle -- shown below md instead of the nav above */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 md:hidden"
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile nav panel */}
        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-600 md:hidden">
            <Link to="/search" onClick={() => setMenuOpen(false)} className="rounded-md px-2 py-2 hover:bg-neutral-100">
              {t('nav.findTechnician')}
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-2 py-2 hover:bg-neutral-100"
                >
                  {user?.role === 'ADMIN' ? t('nav.admin') : t('nav.dashboard')}
                </Link>
                <span className="px-2 py-1 text-neutral-500">{t('nav.hi', { name: user?.firstName })}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-md px-2 py-2 text-left hover:bg-neutral-100"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-2 py-2 hover:bg-neutral-100"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md bg-emerald-700 px-2 py-2 text-center text-white hover:bg-emerald-800"
                >
                  {t('nav.signup')}
                </Link>
              </>
            )}
            <div className="px-2 pt-2">
              <LanguageSelect className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-600" />
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-200 py-6 text-center text-sm text-neutral-500">
        {t('footer.tagline')}
      </footer>
    </div>
  );
}
