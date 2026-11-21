import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import '../components/Shared.css';

export default function NotFound() {
  return (
    <div className="container">
      <div className="not-found card" style={{ padding: '3.5rem 2rem', marginTop: '2rem' }}>
        <h1 style={{ fontSize: '3.5rem', margin: 0, color: 'var(--color-primary)' }}>404</h1>
        <h2 style={{ fontSize: '1.25rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
          Page Not Found
        </h2>
        <p style={{ maxWidth: 400, margin: '0 auto 1.5rem', color: 'var(--color-text-secondary)' }}>
          The page or resource you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <button type="button">
            <Home size={16} /> Return to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}
