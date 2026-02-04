// src/components/Auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '/src/supabaseClient';
import { ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setMessage(`Password reset email sent to ${email}`);
      setEmailSent(true);
    } catch (error) {
      setError(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="gradient-text" style={{ fontSize: '2.25rem', fontWeight: 'bold' }}>
            Reset Password
          </h1>
          <div style={{ height: '0.25rem', background: 'linear-gradient(90deg,#2563eb,#3b82f6)', borderRadius: '9999px', marginTop: '0.25rem' }} />
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Enter your email to receive a reset link
          </p>
        </div>

        {error && (
          <div className="alert-error" style={{ marginBottom: '1rem' }}>
            <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>
          </div>
        )}

        {message && (
          <div className="alert-success" style={{ marginBottom: '1rem' }}>
            <p style={{ color: '#10b981', fontSize: '0.875rem' }}>{message}</p>
          </div>
        )}

        {!emailSent ? (
          <form onSubmit={handleResetRequest}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="custom-input"
                placeholder="Enter your registered email"
                required
                style={{ width: '100%' }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📧</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Check Your Email
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              We've sent password reset instructions to {email}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>
        )}

        <Link
          to="/login"
          className="btn-secondary"
          style={{ 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.5rem',
            textDecoration: 'none',
            marginTop: '1rem'
          }}
        >
          <ArrowLeft size={16} />
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;