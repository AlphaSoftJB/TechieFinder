import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-emerald-700">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-white text-sm">
              TF
            </span>
            TechieFinder
          </Link>

          <nav className="flex items-center gap-6 text-sm font-medium text-neutral-600">
            <Link to="/search" className="hover:text-emerald-700">
              Find a Technician
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="hover:text-emerald-700">
                  {user?.role === 'ADMIN' ? 'Admin' : 'Dashboard'}
                </Link>
                <span className="text-neutral-400">|</span>
                <span className="text-neutral-500">Hi, {user?.firstName}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-neutral-100 px-3 py-1.5 text-neutral-700 hover:bg-neutral-200"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-emerald-700">
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-emerald-700 px-4 py-1.5 text-white hover:bg-emerald-800"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-200 py-6 text-center text-sm text-neutral-500">
        TechieFinder &mdash; connecting Nigerians with skilled local technicians.
      </footer>
    </div>
  );
}
