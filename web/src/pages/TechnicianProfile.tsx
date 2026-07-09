import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface Technician {
  id: number;
  firstName: string;
  lastName: string;
  businessName: string | null;
  bio: string | null;
  rating: number;
  totalRatings: number;
  completedJobs: number;
  verified: boolean;
}

interface Rating {
  id: number;
  rating: number;
  review: string | null;
}

interface Offering {
  id: number;
  serviceName: string;
  categoryName: string;
  basePrice: number;
}

interface PortfolioItem {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string;
  categoryName: string | null;
}

interface Certification {
  id: number;
  name: string;
  issuingOrganization: string;
  verificationStatus: string;
}

export default function TechnicianProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [technician, setTechnician] = useState<Technician | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    serviceDescription: '', serviceAddress: '', city: '', state: '', estimatedPrice: '', date: '', time: '',
  });

  useEffect(() => {
    Promise.all([
      api.get(`/technicians/${id}`),
      api.get(`/ratings/technician/${id}`),
      api.get(`/technicians/${id}/services`),
      api.get(`/technicians/${id}/portfolio`),
      api.get(`/technicians/${id}/certifications`),
    ])
      .then(([technicianRes, ratingsRes, offeringsRes, portfolioRes, certificationsRes]) => {
        setTechnician(technicianRes.data);
        setRatings(ratingsRes.data);
        setOfferings(offeringsRes.data);
        setPortfolio(portfolioRes.data);
        setCertifications(certificationsRes.data.filter((c: Certification) => c.verificationStatus === 'VERIFIED'));
      })
      .catch((error) => console.error('Error loading technician profile:', error))
      .finally(() => setLoading(false));
  }, [id]);

  const handleMessage = async () => {
    try {
      const response = await api.post(`/conversations/with-technician/${id}`);
      navigate(`/conversations/${response.data.id}`);
    } catch (error) {
      setMessage(apiErrorMessage(error, 'Could not start a conversation.'));
    }
  };

  const handleBook = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await api.post('/bookings', {
        technicianId: Number(id),
        scheduledDateTime: `${form.date}T${form.time}:00`,
        serviceDescription: form.serviceDescription,
        serviceAddress: form.serviceAddress,
        city: form.city,
        state: form.state,
        estimatedPrice: parseFloat(form.estimatedPrice),
      });
      navigate('/dashboard');
    } catch (error) {
      setMessage(apiErrorMessage(error, 'Could not create this booking. Please check your details.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-10 text-center text-neutral-500">Loading...</p>;
  if (!technician) return <p className="p-10 text-center text-neutral-500">Technician not found.</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {technician.firstName} {technician.lastName}
            </h1>
            {technician.businessName && <p className="text-neutral-500">{technician.businessName}</p>}
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="font-semibold text-amber-500">&#9733; {Number(technician.rating).toFixed(1)}</span>
              <span className="text-neutral-400">({technician.totalRatings} reviews)</span>
              {technician.verified && <span className="text-xs font-semibold text-emerald-700">Verified</span>}
            </div>
            <p className="mt-1 text-sm text-neutral-500">{technician.completedJobs} jobs completed</p>
          </div>
          {isAuthenticated && (
            <div className="flex gap-2">
              <button onClick={handleMessage} className="rounded-md border border-emerald-700 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
                Message
              </button>
              <button onClick={() => setShowForm(!showForm)} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                Book Now
              </button>
            </div>
          )}
        </div>

        {technician.bio && <p className="mt-4 text-sm text-neutral-700">{technician.bio}</p>}

        {offerings.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 font-semibold text-neutral-900">Services offered</h2>
            <ul className="divide-y divide-neutral-100">
              {offerings.map((offering) => (
                <li key={offering.id} className="flex justify-between py-2 text-sm">
                  <span>
                    {offering.serviceName} <span className="text-neutral-400">({offering.categoryName})</span>
                  </span>
                  <span className="font-semibold text-emerald-700">&#8358;{Number(offering.basePrice).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {certifications.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 font-semibold text-neutral-900">Certifications</h2>
            <div className="flex flex-wrap gap-2">
              {certifications.map((c) => (
                <span key={c.id} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  &#10003; {c.name} &middot; {c.issuingOrganization}
                </span>
              ))}
            </div>
          </div>
        )}

        {portfolio.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 font-semibold text-neutral-900">Portfolio</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {portfolio.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-lg border border-neutral-200">
                  <img src={item.imageUrl} alt={item.title} className="h-28 w-full object-cover" />
                  <p className="truncate p-1.5 text-xs font-medium text-neutral-700">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <h2 className="mb-2 font-semibold text-neutral-900">Reviews ({ratings.length})</h2>
          {ratings.length === 0 ? (
            <p className="text-sm text-neutral-500">No reviews yet.</p>
          ) : (
            <ul className="space-y-3">
              {ratings.map((rating) => (
                <li key={rating.id} className="rounded-md bg-neutral-50 p-3 text-sm">
                  <span className="font-semibold text-amber-500">{'★'.repeat(rating.rating)}{'☆'.repeat(5 - rating.rating)}</span>
                  {rating.review && <p className="mt-1 text-neutral-700">{rating.review}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {message && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}

        {!isAuthenticated && (
          <p className="mt-6 text-sm text-neutral-500">
            <a href="/login" className="font-semibold text-emerald-700">Log in</a> to book this technician or send a message.
          </p>
        )}

        {showForm && (
          <form onSubmit={handleBook} className="mt-6 space-y-3 rounded-lg border border-neutral-200 p-4">
            <h2 className="font-semibold text-neutral-900">Request a booking</h2>
            <input required placeholder="What do you need help with?" value={form.serviceDescription}
              onChange={(e) => setForm({ ...form, serviceDescription: e.target.value })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            <input required placeholder="Service address" value={form.serviceAddress}
              onChange={(e) => setForm({ ...form, serviceAddress: e.target.value })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              <input required placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              <input required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            </div>
            <input required type="number" min="0" placeholder="Estimated price (₦)" value={form.estimatedPrice}
              onChange={(e) => setForm({ ...form, estimatedPrice: e.target.value })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            <button type="submit" disabled={submitting} className="w-full rounded-md bg-emerald-700 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
              {submitting ? 'Submitting...' : 'Confirm booking request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
