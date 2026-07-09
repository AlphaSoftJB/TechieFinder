import { useCallback, useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../lib/api';

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

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-neutral-200 text-neutral-600',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function UserDashboard() {
  const [tab, setTab] = useState<'bookings' | 'notifications'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [review, setReview] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    Promise.all([api.get('/bookings/my'), api.get('/notifications/my')])
      .then(([bookingsRes, notificationsRes]) => {
        setBookings(bookingsRes.data);
        setNotifications(notificationsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePay = async (bookingId: number) => {
    setError('');
    try {
      const response = await api.post(`/payments/bookings/${bookingId}/pay`);
      const payment = response.data;
      if (payment.requiresRedirect && payment.authorizationUrl) {
        // A real gateway (Paystack/Flutterwave) is configured: redirect to its
        // hosted checkout. PaymentCallback verifies by reference once the
        // gateway sends the browser back.
        sessionStorage.setItem('techiefinder.pendingPaymentReference', payment.transactionReference);
        window.location.href = payment.authorizationUrl;
        return;
      }
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Payment failed.'));
    }
  };

  const handleCancel = async (bookingId: number) => {
    if (!confirm('Cancel this booking?')) return;
    setError('');
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: 'CANCELLED', reason: 'Cancelled by customer' });
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not cancel this booking.'));
    }
  };

  const submitRating = async () => {
    if (!ratingBooking) return;
    setError('');
    try {
      await api.post('/ratings', { bookingId: ratingBooking.id, rating: ratingValue, review: review || undefined });
      setRatingBooking(null);
      setReview('');
      setRatingValue(5);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not submit rating.'));
    }
  };

  const markRead = async (notificationId: number) => {
    await api.patch(`/notifications/${notificationId}/read`);
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) return <p className="p-10 text-center text-neutral-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-neutral-900">My Account</h1>

      <div className="mt-6 flex gap-2">
        <button onClick={() => setTab('bookings')} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === 'bookings' ? 'bg-emerald-700 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
          Bookings
        </button>
        <button onClick={() => setTab('notifications')} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === 'notifications' ? 'bg-emerald-700 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
          Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </button>
      </div>

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {tab === 'bookings' ? (
        <div className="mt-6 space-y-3">
          {bookings.length === 0 && <p className="text-neutral-500">No bookings yet. Find a technician to get started.</p>}
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
                {booking.status === 'CONFIRMED' && booking.paymentStatus === 'PENDING' && (
                  <button onClick={() => handlePay(booking.id)} className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800">
                    Pay Now
                  </button>
                )}
                {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                  <button onClick={() => handleCancel(booking.id)} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-200">
                    Cancel
                  </button>
                )}
                {booking.status === 'COMPLETED' && (
                  <button onClick={() => setRatingBooking(booking)} className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800">
                    Rate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {notifications.length === 0 && <p className="text-neutral-500">No notifications yet.</p>}
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => !notification.read && markRead(notification.id)}
              className={`w-full rounded-lg border p-4 text-left ${notification.read ? 'border-neutral-200 bg-white' : 'border-emerald-600 bg-emerald-50'}`}
            >
              <p className="font-semibold text-neutral-900">{notification.title}</p>
              <p className="text-sm text-neutral-600">{notification.message}</p>
            </button>
          ))}
        </div>
      )}

      {ratingBooking && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6">
            <h2 className="mb-4 text-center font-semibold text-neutral-900">Rate this technician</h2>
            <div className="mb-4 flex justify-center gap-2 text-2xl text-amber-400">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRatingValue(n)}>
                  {n <= ratingValue ? '★' : '☆'}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Leave a review (optional)"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="mb-4 w-full rounded-md border border-neutral-300 p-2 text-sm"
              rows={3}
            />
            <div className="flex gap-2">
              <button onClick={() => setRatingBooking(null)} className="flex-1 rounded-md bg-neutral-100 py-2 text-sm font-medium text-neutral-700">
                Cancel
              </button>
              <button onClick={submitRating} className="flex-1 rounded-md bg-emerald-700 py-2 text-sm font-semibold text-white">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
