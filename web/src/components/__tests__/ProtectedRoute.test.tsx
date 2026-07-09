import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ProtectedRoute from '../ProtectedRoute';

const mockUseAuth = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderWithAuth(authState: object, role?: 'USER' | 'TECHNICIAN' | 'ADMIN') {
  mockUseAuth.mockReturnValue(authState);
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute role={role}>
              <div>Secret Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('shows a loading state while auth is resolving', () => {
    renderWithAuth({ isAuthenticated: false, loading: true, user: null });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    renderWithAuth({ isAuthenticated: false, loading: false, user: null });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders the protected content once authenticated', () => {
    renderWithAuth({ isAuthenticated: true, loading: false, user: { role: 'USER' } });
    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });

  it('redirects a non-admin away from an admin-only route', () => {
    renderWithAuth({ isAuthenticated: true, loading: false, user: { role: 'USER' } }, 'ADMIN');
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('renders the protected content for a matching role', () => {
    renderWithAuth({ isAuthenticated: true, loading: false, user: { role: 'ADMIN' } }, 'ADMIN');
    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });
});
