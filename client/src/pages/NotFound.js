import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
    <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>⚖️</div>
    <h1 style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--gray-200)', marginBottom: '0.5rem' }}>404</h1>
    <h2 style={{ fontSize: '1.5rem', color: 'var(--gray-700)', marginBottom: '0.75rem' }}>Page Not Found</h2>
    <p style={{ color: 'var(--gray-500)', marginBottom: '2rem', maxWidth: 340 }}>
      The page you're looking for doesn't exist or has been moved.
    </p>
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
      <Link to="/" className="btn btn-primary">Go Home</Link>
      <Link to="/advocates" className="btn btn-outline">Find Advocates</Link>
    </div>
  </div>
);

export default NotFound;
