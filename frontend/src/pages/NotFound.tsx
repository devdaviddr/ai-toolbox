import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
      <h1 className="text-6xl font-bold text-white">404</h1>
      <p className="text-2xl font-semibold text-slate-300">Page Not Found</p>
      <p className="text-slate-400 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        Go back to Dashboard
      </Link>
    </div>
  );
}
