// src/components/Auth/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '/src/supabaseClient';
import { ArrowRight, Mail, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberEmail', email);
      } else {
        localStorage.removeItem('rememberEmail');
      }
      
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Load remembered email on component mount
  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="auth-page">
      {/* Auth Header */}
      <header className="auth-header">
        <div className="container">
          <div className="auth-header-content">
            <div className="auth-brand">
              <Link to="/" className="gradient-text">
                <h1>Tool-Index</h1>
              </Link>
              <p className="tagline">www.toolindex.ca</p>
            </div>
            <div className="auth-navigation">
              <Link to="/" className="nav-link">
                Pricing Plans
              </Link>
            </div>
            <div className="auth-navigation">
              <Link to="/register" className="nav-link">
                Terms of Services
              </Link>
            </div>
            <div className="auth-navigation">
              <Link to="/" className="nav-link">
                About - US
              </Link>
            </div>
            <div className="auth-navigation">
              <Link to="/" className="nav-link">
                Contact - US
              </Link>
            </div>
            
            <div className="auth-navigation">
              <Link to="/register" className="nav-link">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="auth-main">
        <div className="container">
          <div className="auth-content">
            {/* Left Side - Illustration/Info */}
            <div className="auth-left">
              <div className="auth-illustration">
                <div className="illustration-circle">
                  <div className="inner-circle">🔧</div>
                </div>
                <h2 className="illustration-title">Welcome Back</h2>
                <p className="illustration-text">
                  Securely access your tool inventory and recovery dashboard
                </p>
                <div className="features-list">
                  <div className="feature">
                    <div className="feature-icon">✓</div>
                    <span>Track your reported tools</span>
                  </div>
                  <div className="feature">
                    <div className="feature-icon">✓</div>
                    <span>Update tool status in real-time</span>
                  </div>
                  <div className="feature">
                    <div className="feature-icon">✓</div>
                    <span>Connect with law enforcement</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="auth-right">
              <div className="auth-card">
                <div className="auth-card-header">
                  <h2>Sign In to Your Account</h2>
                  <p className="auth-subtitle">
                    Enter your credentials to access the platform
                  </p>
                </div>

                {error && (
                  <div className="auth-alert error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      <Mail size={18} />
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                      placeholder="Enter your email"
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="form-group">
                    <div className="form-label-row">
                      <label htmlFor="password" className="form-label">
                        <Lock size={18} />
                        Password
                      </label>
                      <Link to="/forgot-password" className="forgot-password">
                        Forgot password?
                      </Link>
                    </div>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                    />
                  </div>

                  <div className="form-options">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="checkbox-input"
                      />
                      <span className="checkbox-custom"></span>
                      Remember me
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="auth-button primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>

                  <div className="divider">
                    <span>or</span>
                  </div>

                  <div className="auth-footer">
                    <p className="register-text">
                      Don't have an account?{' '}
                      <Link to="/register" className="register-link">
                        Sign up now
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="auth-footer">
        <div className="container">
          <p className="footer-text">
            &copy; {new Date().getFullYear()} Tool-Index. All rights reserved.
          </p>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/contact">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;