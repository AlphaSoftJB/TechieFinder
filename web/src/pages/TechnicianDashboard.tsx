import { useCallback, useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface Booking {
  id: number;
  bookingNumber: string;
  status: string;
  serviceDescription: string;
  serviceAddress: string;
  estimatedPrice: number;
  paymentStatus: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Offering {
  id: number;
  serviceName: string;
  categoryName: string;
  basePrice: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-neutral-200 text-neutral-600',
  REJECTED: 'bg-red-100 text-red-700',
};
const PRICING_TYPES = ['FIXED', 'HOURLY', 'NEGOTIABLE'];

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'jobs' | 'profile' | 'notifications'>('jobs');
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationForm, setLocationForm] = useState({ address: '', city: '', state: '', latitude: '', longitude: '', serviceRadiusKm: '15' });
  const [serviceForm, setServiceForm] = useState({ categorySlug: '', serviceName: '', basePrice: '', pricingType: 'FIXED' });

  const ensureProfile = useCallback(async () => {
    try {
      const res = await api.get('/technicians/me');
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404 && user) {
        try {
          const created = await api.post(`/technicians/create/${user.id}`);
          return created.data;
        } catch (createErr: any) {
          // Another in-flight request (e.g. React StrictMode's double effect
          // invocation in dev) may have already created it a moment ago.
          if (createErr.response?.status === 409) {
            const res = await api.get('/technicians/me');
            return res.data;
          }
          throw createErr;
        }
      }
      throw err;
    }
  }, [user]);

  const load = useCallback(async () => {
    try {
      const technicianProfile = await ensureProfile();
      setProfile(technicianProfile);
      const [bookingsRes, notificationsRes, categoriesRes, offeringsRes] = await Promise.all([
        api.get('/bookings/technician/my'),
        api.get('/notifications/my'),
        api.get('/public/categories'),
        api.get('/technicians/me/services'),
      ]);
      setBookings(bookingsRes.data);
      setNotifications(notificationsRes.data);
      setCategories(categoriesRes.data);
      setOfferings(offeringsRes.data);
      setServiceForm((prev) => ({ ...prev, categorySlug: prev.categorySlug || categoriesRes.data[0]?.slug || '' }));
    } catch (err) {
      console.error('Error loading technician dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [ensureProfile]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (bookingId: number, status: string) => {
    setError('');
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status });
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update this booking.'));
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      setLocationForm((prev) => ({
        ...prev,
        latitude: String(position.coords.latitude),
        longitude: String(position.coords.longitude),
      }));
    });
  };

  const saveLocation = async () => {
    setError('');
    try {
      await api.put('/technicians/me/location', {
        address: locationForm.address,
        city: locationForm.city,
        state: locationForm.state,
        latitude: parseFloat(locationForm.latitude),
        longitude: parseFloat(locationForm.longitude),
        serviceRadiusKm: parseInt(locationForm.serviceRadiusKm, 10) || 15,
      });
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save location.'));
    }
  };

  const addService = async () => {
    setError('');
    try {
      await api.post('/technicians/me/services', {
        categorySlug: serviceForm.categorySlug,
        serviceName: serviceForm.serviceName,
        basePrice: parseFloat(serviceForm.basePrice),
        pricingType: serviceForm.pricingType,
      });
      setServiceForm({ ...serviceForm, serviceName: '', basePrice: '' });
      const res = await api.get('/technicians/me/services');
      setOfferings(res.data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not add this service.'));
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) return <p className="p-10 text-center text-neutral-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-neutral-900">Technician Dashboard</h1>
      <p className="text-sm text-neutral-500">
        {profile?.technicianId} &middot; &#9733; {Number(profile?.rating || 0).toFixed(1)} ({profile?.totalRatings})
      </p>

      <div className="mt-6 flex gap-2">
        <button onClick={() => setTab('jobs')} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === 'jobs' ? 'bg-emerald-700 text-white' : 'bg-neutral-100 text-neutral-600'}`}>Jobs</button>
        <button onClick={() => setTab('profile')} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === 'profile' ? 'bg-emerald-700 text-white' : 'bg-neutral-100 text-neutral-600'}`}>Profile</button>
        <button onClick={() => setTab('notifications')} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === 'notifications' ? 'bg-emerald-700 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
          Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </button>
      </div>

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {tab === 'jobs' && (
        <div className="mt-6 space-y-3">
          {bookings.length === 0 && <p className="text-neutral-500">No jobs yet. Add your services and location so customers can find you.</p>}
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">{booking.bookingNumber}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[booking.status] || 'bg-neutral-100 text-neutral-600'}`}>
                  {booking.status}
                </span>
              </div>
              <p className="mt-1 font-semibold text-neutral-900">{booking.serviceDescription}</p>
              <p className="text-sm text-neutral-500">{booking.serviceAddress}</p>
              <p className="text-sm text-neutral-500">
                &#8358;{Number(booking.estimatedPrice).toLocaleString()} &middot; Payment: {booking.paymentStatus}
              </p>
              <div className="mt-3 flex gap-2">
                {booking.status === 'PENDING' && (
                  <>
                    <button onClick={() => updateStatus(booking.id, 'CONFIRMED')} className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white">Confirm</button>
                    <button onClick={() => updateStatus(booking.id, 'REJECTED')} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white">Reject</button>
                  </>
                )}
                {booking.status === 'CONFIRMED' && (
                  <button onClick={() => updateStatus(booking.id, 'IN_PROGRESS')} className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white">Start Job</button>
                )}
                {booking.status === 'IN_PROGRESS' && (
                  <button onClick={() => updateStatus(booking.id, 'COMPLETED')} className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white">Mark Completed</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'notifications' && (
        <div className="mt-6 space-y-3">
          {notifications.length === 0 && <p className="text-neutral-500">No notifications yet.</p>}
          {notifications.map((notification) => (
            <div key={notification.id} className={`rounded-lg border p-4 ${notification.read ? 'border-neutral-200 bg-white' : 'border-emerald-600 bg-emerald-50'}`}>
              <p className="font-semibold text-neutral-900">{notification.title}</p>
              <p className="text-sm text-neutral-600">{notification.message}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'profile' && (
        <div className="mt-6 space-y-8">
          <div>
            <h2 className="mb-3 font-semibold text-neutral-900">Service Area</h2>
            <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
              <input placeholder="Street address" value={locationForm.address} onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="City" value={locationForm.city} onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })} className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
                <input placeholder="State" value={locationForm.state} onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })} className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              </div>
              <button onClick={useCurrentLocation} className="text-sm font-medium text-emerald-700">Use my current location</button>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Latitude" value={locationForm.latitude} onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })} className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
                <input placeholder="Longitude" value={locationForm.longitude} onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })} className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              </div>
              <input placeholder="Service radius (km)" value={locationForm.serviceRadiusKm} onChange={(e) => setLocationForm({ ...locationForm, serviceRadiusKm: e.target.value })} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              <button onClick={saveLocation} className="w-full rounded-md bg-emerald-700 py-2 text-sm font-semibold text-white">Save Location</button>
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-neutral-900">Add a Service</h2>
            <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button key={c.id} onClick={() => setServiceForm({ ...serviceForm, categorySlug: c.slug })}
                    className={`rounded-full border px-3 py-1 text-sm ${serviceForm.categorySlug === c.slug ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-neutral-300 text-neutral-600'}`}>
                    {c.name}
                  </button>
                ))}
              </div>
              <input placeholder="Service name (e.g. Pipe repair)" value={serviceForm.serviceName} onChange={(e) => setServiceForm({ ...serviceForm, serviceName: e.target.value })} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              <div className="flex gap-2">
                {PRICING_TYPES.map((p) => (
                  <button key={p} onClick={() => setServiceForm({ ...serviceForm, pricingType: p })}
                    className={`flex-1 rounded-md border py-1.5 text-sm ${serviceForm.pricingType === p ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-neutral-300 text-neutral-600'}`}>
                    {p}
                  </button>
                ))}
              </div>
              <input placeholder="Base price (₦)" value={serviceForm.basePrice} onChange={(e) => setServiceForm({ ...serviceForm, basePrice: e.target.value })} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              <button onClick={addService} className="w-full rounded-md bg-emerald-700 py-2 text-sm font-semibold text-white">Add Service</button>
            </div>

            {offerings.length > 0 && (
              <ul className="mt-3 divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white px-4">
                {offerings.map((o) => (
                  <li key={o.id} className="flex justify-between py-2 text-sm">
                    <span>{o.serviceName} <span className="text-neutral-400">({o.categoryName})</span></span>
                    <span className="font-semibold text-emerald-700">&#8358;{Number(o.basePrice).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
