import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-3xl font-bold text-neutral-900">Page not found</h1>
      <p className="mt-2 text-neutral-500">The page you're looking for doesn't exist.</p>
      <Link to="/" className="mt-6 inline-block rounded-md bg-emerald-700 px-5 py-2 text-sm font-semibold text-white">
        Back home
      </Link>
    </div>
  );
}
