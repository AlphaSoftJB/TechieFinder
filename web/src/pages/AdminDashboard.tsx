import { useCallback, useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../lib/api';

interface Stats {
  totalUsers: number;
  totalCustomers: number;
  totalTechnicians: number;
  pendingTechnicianVerifications: number;
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  totalRatings: number;
  averageRating: number | null;
}

interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface AdminTechnician {
  id: number;
  technicianId: string;
  firstName: string;
  lastName: string;
  verificationStatus: string;
  rating: number;
  totalRatings: number;
  completedJobs: number;
}

interface AdminBooking {
  id: number;
  bookingNumber: string;
  customerName: string;
  technicianName: string;
  status: string;
  estimatedPrice: number;
  paymentStatus: string;
}

interface AdminRating {
  id: number;
  customerName: string;
  technicianName: string;
  rating: number;
  review: string;
}

type Tab = 'overview' | 'users' | 'technicians' | 'bookings' | 'reviews';

const VERIFICATION_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'];

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [technicians, setTechnicians] = useState<AdminTechnician[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [ratings, setRatings] = useState<AdminRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [statsRes, usersRes, techniciansRes, bookingsRes, ratingsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/technicians'),
        api.get('/admin/bookings'),
        api.get('/admin/ratings'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setTechnicians(techniciansRes.data);
      setBookings(bookingsRes.data);
      setRatings(ratingsRes.data);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleUserActive = async (targetUser: AdminUser) => {
    setError('');
    try {
      await api.patch(`/admin/users/${targetUser.id}/status`, { active: !targetUser.active });
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update this user.'));
    }
  };

  const setVerification = async (technicianId: number, status: string) => {
    setError('');
    try {
      await api.patch(`/admin/technicians/${technicianId}/verification`, { status });
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update this technician.'));
    }
  };

  const deleteReview = async (ratingId: number) => {
    setError('');
    try {
      await api.delete(`/admin/ratings/${ratingId}`);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not remove this review.'));
    }
  };

  if (loading) return <p className="p-10 text-center text-neutral-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
      <p className="text-sm text-neutral-500">Platform overview and moderation tools.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(['overview', 'users', 'technicians', 'bookings', 'reviews'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
              tab === t ? 'bg-emerald-700 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {tab === 'overview' && stats && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Customers" value={stats.totalCustomers} />
          <StatCard label="Technicians" value={stats.totalTechnicians} />
          <StatCard label="Pending Verifications" value={stats.pendingTechnicianVerifications} highlight={stats.pendingTechnicianVerifications > 0} />
          <StatCard label="Total Bookings" value={stats.totalBookings} />
          <StatCard label="Pending Bookings" value={stats.pendingBookings} />
          <StatCard label="Completed Bookings" value={stats.completedBookings} />
          <StatCard label="Cancelled Bookings" value={stats.cancelledBookings} />
          <StatCard label="Total Revenue" value={`₦${Number(stats.totalRevenue || 0).toLocaleString()}`} />
          <StatCard label="Total Reviews" value={stats.totalRatings} />
          <StatCard label="Average Rating" value={stats.averageRating != null ? stats.averageRating.toFixed(1) : '—'} />
        </div>
      )}

      {tab === 'users' && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3 text-neutral-600">{u.email}</td>
                  <td className="px-4 py-3 text-neutral-600">{u.role}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {u.active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => toggleUserActive(u)}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold ${u.active ? 'bg-red-600 text-white' : 'bg-emerald-700 text-white'}`}
                      >
                        {u.active ? 'Suspend' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-500">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'technicians' && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Technician ID</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Jobs Done</th>
                <th className="px-4 py-3">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {technicians.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{t.firstName} {t.lastName}</td>
                  <td className="px-4 py-3 text-neutral-600">{t.technicianId}</td>
                  <td className="px-4 py-3 text-neutral-600">&#9733; {Number(t.rating || 0).toFixed(1)} ({t.totalRatings})</td>
                  <td className="px-4 py-3 text-neutral-600">{t.completedJobs}</td>
                  <td className="px-4 py-3">
                    <select
                      value={t.verificationStatus}
                      onChange={(e) => setVerification(t.id, e.target.value)}
                      className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
                    >
                      {VERIFICATION_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {technicians.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-500">No technicians yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3">Booking #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Technician</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 text-neutral-600">{b.bookingNumber}</td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{b.customerName}</td>
                  <td className="px-4 py-3 text-neutral-600">{b.technicianName}</td>
                  <td className="px-4 py-3 text-neutral-600">{b.status}</td>
                  <td className="px-4 py-3 text-neutral-600">&#8358;{Number(b.estimatedPrice).toLocaleString()}</td>
                  <td className="px-4 py-3 text-neutral-600">{b.paymentStatus}</td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-neutral-500">No bookings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="mt-6 space-y-3">
          {ratings.map((r) => (
            <div key={r.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-neutral-900">
                  {r.customerName} &rarr; {r.technicianName}
                </p>
                <span className="text-sm text-amber-600">&#9733; {r.rating}</span>
              </div>
              {r.review && <p className="mt-1 text-sm text-neutral-600">{r.review}</p>}
              <button
                onClick={() => deleteReview(r.id)}
                className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Remove Review
              </button>
            </div>
          ))}
          {ratings.length === 0 && <p className="text-neutral-500">No reviews yet.</p>}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? 'border-amber-400 bg-amber-50' : 'border-neutral-200 bg-white'}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}
