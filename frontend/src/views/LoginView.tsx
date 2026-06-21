import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { apiRequest } from '../utils/api';
import '../App.css';

export default function LoginView() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const setToken = useAppStore((state) => state.setToken);
  const setUser = useAppStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setToken(data.access_token);
      setUser(data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: 'var(--spacing-md)',
      background: 'radial-gradient(circle at top right, var(--primary-glow), transparent 40%), radial-gradient(circle at bottom left, var(--secondary-glow), transparent 40%)'
    }}>
      <div className="card card-glass" style={{ width: '100%', maxWidth: '400px', padding: 'var(--spacing-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 'var(--spacing-xs)', background: 'linear-gradient(to right, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            RupeeWise
          </h2>
          <p style={{ fontSize: '0.85rem' }}>Personal & Household Budgeting</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--danger-glow)',
            border: '1px solid var(--danger)',
            color: 'var(--text-primary)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem',
            marginBottom: 'var(--spacing-md)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="e.g., arjun@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="primary"
            style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-md)', fontSize: '0.9rem' }}>
          <p>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
