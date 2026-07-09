import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Technician {
  id: number;
  firstName: string;
  lastName: string;
  businessName: string | null;
  bio: string | null;
  rating: number;
  totalRatings: number;
  verified: boolean;
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get('category');

  const [categories, setCategories] = useState<Category[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [nearMe, setNearMe] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    api.get('/public/categories').then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  const loadByCategory = useCallback((slug: string | null) => {
    setLoading(true);
    api
      .get('/technicians/available', { params: slug ? { category: slug } : {} })
      .then((res) => setTechnicians(res.data))
      .catch((error) => console.error('Error searching technicians:', error))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!nearMe) {
      loadByCategory(categorySlug);
    }
  }, [categorySlug, nearMe, loadByCategory]);

  const selectCategory = (slug: string | null) => {
    setNearMe(false);
    setLocationError('');
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNearMe(true);
        setLoading(true);
        api
          .get('/technicians/nearby', {
            params: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              radiusKm: 15,
            },
          })
          .then((res) => setTechnicians(res.data))
          .catch((error) => console.error('Error with nearby search:', error))
          .finally(() => {
            setLoading(false);
            setLocating(false);
          });
      },
      () => {
        setLocationError('Could not get your location. Please allow location access and try again.');
        setLocating(false);
      }
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-neutral-900">Find a Technician</h1>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => selectCategory(null)}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium ${!nearMe && !categorySlug ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-neutral-300 text-neutral-600'}`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => selectCategory(category.slug)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${!nearMe && categorySlug === category.slug ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-neutral-300 text-neutral-600'}`}
          >
            {category.name}
          </button>
        ))}
        <button
          onClick={handleNearMe}
          disabled={locating}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium ${nearMe ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-emerald-700 text-emerald-700'}`}
        >
          {locating ? 'Locating...' : 'Near Me'}
        </button>
      </div>
      {locationError && <p className="mt-2 text-sm text-red-600">{locationError}</p>}

      <div className="mt-8">
        {loading ? (
          <p className="text-neutral-500">Loading...</p>
        ) : technicians.length === 0 ? (
          <p className="text-neutral-500">No technicians found. Try a different filter.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {technicians.map((technician) => (
              <Link
                key={technician.id}
                to={`/technicians/${technician.id}`}
                className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-emerald-600 hover:shadow-sm"
              >
                <p className="font-semibold text-neutral-900">
                  {technician.firstName} {technician.lastName}
                </p>
                <p className="mt-1 line-clamp-1 text-sm text-neutral-500">
                  {technician.bio || technician.businessName || 'Professional Technician'}
                </p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="font-semibold text-amber-500">&#9733; {Number(technician.rating).toFixed(1)}</span>
                  <span className="text-neutral-400">({technician.totalRatings})</span>
                  {technician.verified && <span className="text-xs font-semibold text-emerald-700">Verified</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
