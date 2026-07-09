import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
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

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/public/categories'), api.get('/technicians/available')])
      .then(([categoriesRes, techniciansRes]) => {
        setCategories(categoriesRes.data);
        setTechnicians(techniciansRes.data.slice(0, 6));
      })
      .catch((error) => console.error('Error loading home page:', error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="bg-emerald-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">Find skilled technicians near you</h1>
          <p className="mx-auto mt-4 max-w-xl text-emerald-50">
            Plumbers, electricians, mechanics, and more &mdash; verified and rated by real customers across Nigeria.
          </p>
          <Link
            to="/search"
            className="mt-8 inline-block rounded-md bg-white px-6 py-3 font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Find a technician
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="mb-6 text-xl font-bold text-neutral-900">Browse by category</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => navigate(`/search?category=${category.slug}`)}
              className="rounded-lg border border-neutral-200 bg-white p-4 text-left hover:border-emerald-600 hover:shadow-sm"
            >
              <p className="font-semibold text-neutral-900">{category.name}</p>
              <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{category.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-6 text-xl font-bold text-neutral-900">Featured technicians</h2>
        {loading ? (
          <p className="text-neutral-500">Loading...</p>
        ) : technicians.length === 0 ? (
          <p className="text-neutral-500">No technicians available yet.</p>
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
      </section>
    </div>
  );
}
