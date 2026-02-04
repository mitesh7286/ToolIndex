// src/components/Auth/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '/src/supabaseClient';
import { CheckCircle, XCircle } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const checkPassword = () => {
      const newRequirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      };

      setRequirements(newRequirements);

      const metCount = Object.values(newRequirements).filter(Boolean).length;
      const strength = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][metCount];
      setPasswordStrength(strength);
    };

    if (password) checkPassword();
  }, [password]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (Object.values(requirements).filter(Boolean).length < 4) {
      setError('Please use a stronger password');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/forgot-password');
      }
    };

    checkSession();
  }, [navigate]);

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ color: '#10b981', marginBottom: '1rem' }}>
              <CheckCircle size={64} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Password Reset Successful!
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Your password has been updated successfully.
            </p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Redirecting to login page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="gradient-text" style={{ fontSize: '2.25rem', fontWeight: 'bold' }}>
            Set New Password
          </h1>
          <div style={{ height: '0.25rem', background: 'linear-gradient(90deg,#2563eb,#3b82f6)', borderRadius: '9999px', marginTop: '0.25rem' }} />
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Create a strong new password
          </p>
        </div>

        {error && (
          <div className="alert-error" style={{ marginBottom: '1rem' }}>
            <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handlePasswordReset}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="custom-input"
              placeholder="Enter new password"
              required
              style={{ width: '100%' }}
            />
            
            {password && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Password Strength:</span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    color: passwordStrength === 'Very Weak' || passwordStrength === 'Weak' ? '#ef4444' :
                           passwordStrength === 'Fair' ? '#f59e0b' :
                           passwordStrength === 'Good' ? '#10b981' : '#059669'
                  }}>
                    {passwordStrength}
                  </span>
                </div>
                
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    {requirements.length ? <CheckCircle size={12} color="#10b981" /> : <XCircle size={12} color="#ef4444" />}
                    <span>At least 8 characters</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    {requirements.uppercase ? <CheckCircle size={12} color="#10b981" /> : <XCircle size={12} color="#ef4444" />}
                    <span>One uppercase letter</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    {requirements.lowercase ? <CheckCircle size={12} color="#10b981" /> : <XCircle size={12} color="#ef4444" />}
                    <span>One lowercase letter</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    {requirements.number ? <CheckCircle size={12} color="#10b981" /> : <XCircle size={12} color="#ef4444" />}
                    <span>One number</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {requirements.special ? <CheckCircle size={12} color="#10b981" /> : <XCircle size={12} color="#ef4444" />}
                    <span>One special character</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="custom-input"
              placeholder="Confirm your new password"
              required
              style={{ width: '100%' }}
            />
            {confirmPassword && password !== confirmPassword && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            style={{ width: '100%' }}
          >
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;