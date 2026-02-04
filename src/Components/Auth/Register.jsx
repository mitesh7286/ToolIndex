// src/components/Auth/Register.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '/src/supabaseClient';
import { ArrowRight, Mail, Lock, User, MapPin, Phone, Building, AlertCircle } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    phone: '',
    accountType: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      case 'name':
        return !value ? 'Full name is required' : '';
      case 'phone':
        const phoneRegex = /^\d{10}$/;
        if (!value) return 'Phone number is required';
        if (!phoneRegex.test(value)) return 'Phone must be 10 digits';
        return '';
      case 'accountType':
        return !value ? 'Account type is required' : '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general error
    if (error) setError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    
    if (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const validateAllFields = () => {
    const newErrors = {};
    
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isGovernmentEmail = (email) => {
    const governmentDomains = [
      'calgarypolice.ca',
      'calgary.ca', 
      'camrosepolice.ca',
      'edmontonpolice.ca',
      'ottawapolice.ca',
      'torontopolice.on.ca',
      'rcmp-grc.gc.ca',
      'vpd.ca',
      'cpkcpolice.com',
      'peelpolice.ca',
      'gmail.com'
    ];
    
    return governmentDomains.some(domain => 
      email.toLowerCase().includes(domain.toLowerCase())
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // CRITICAL: Prevent page reload
    setLoading(true);
    setError('');

    // Validate all fields
    if (!validateAllFields()) {
      setError('Please fix all errors before submitting');
      setLoading(false);
      return;
    }

    // Government email validation
    if (formData.accountType === 'government') {
      if (!isGovernmentEmail(formData.email)) {
        setError('Government accounts must use an official government email address');
        setLoading(false);
        return;
      }
    }

    console.log('Form submitted');
    console.log('Form data:', formData);
    console.log('Validation passed:', validateAllFields());

    try {
      const { data, error: supabaseError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            fullName: formData.name,
            account_Type: formData.accountType,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            province: formData.province,
            postal_code: formData.postalCode
          }
        }
      });

      if (supabaseError) throw supabaseError;

      setSuccess(true);
      
      // Show success message for 3 seconds then redirect
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error details:', err.message, err.stack);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
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
                <Link to="/login" className="nav-link">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="auth-main">
          <div className="container">
            <div className="auth-content">
              <div className="auth-right">
                <div className="auth-card" style={{ textAlign: 'center' }}>
                  <div className="success-icon">
                    <div className="checkmark">✓</div>
                  </div>
                  <h2>Registration Successful!</h2>
                  <p style={{ color: '#64748b', margin: '1rem 0 2rem' }}>
                    Please check your email to verify your account. You'll be redirected to login in a few seconds.
                  </p>
                  <Link to="/login" className="auth-button primary">
                    Go to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Header */}
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
              <Link to="/login" className="nav-link">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="auth-main">
        <div className="container">
          <div className="auth-content">
            {/* Left Side */}
            <div className="auth-left">
              <div className="auth-illustration">
                <div className="illustration-circle">
                  <div className="inner-circle">🔧</div>
                </div>
                <h2 className="illustration-title">Join Tool-Index</h2>
                <p className="illustration-text">
                  Create your account to start reporting and tracking stolen tools
                </p>
                <div className="features-list">
                  <div className="feature">
                    <div className="feature-icon">✓</div>
                    <span>Report stolen tools quickly</span>
                  </div>
                  <div className="feature">
                    <div className="feature-icon">✓</div>
                    <span>Connect with law enforcement</span>
                  </div>
                  <div className="feature">
                    <div className="feature-icon">✓</div>
                    <span>Track your tool recovery status</span>
                  </div>
                  <div className="feature">
                    <div className="feature-icon">✓</div>
                    <span>Secure and private platform</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="auth-right">
              <div className="auth-card">
                <div className="auth-card-header">
                  <h2>Create Your Account</h2>
                  <p className="auth-subtitle">
                    Fill in your details to get started
                  </p>
                </div>

                {error && (
                  <div className="auth-alert error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                  {/* Email */}
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      <Mail size={18} />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`form-input ${errors.email ? 'input-error' : ''}`}
                      placeholder="Enter your email"
                      required
                    />
                    {errors.email && (
                      <span className="error-message">{errors.email}</span>
                    )}
                  </div>

                  {/* Password */}
                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      <Lock size={18} />
                      Password *
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`form-input ${errors.password ? 'input-error' : ''}`}
                      placeholder="At least 6 characters"
                      required
                    />
                    {errors.password && (
                      <span className="error-message">{errors.password}</span>
                    )}
                  </div>

                  {/* Account Type */}
                  <div className="form-group">
                    <label htmlFor="accountType" className="form-label">
                      <Building size={18} />
                      Account Type *
                    </label>
                    <select
                      id="accountType"
                      name="accountType"
                      value={formData.accountType}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`form-input ${errors.accountType ? 'input-error' : ''}`}
                      required
                    >
                      <option value="">Select account type</option>
                      <option value="owner">Tool Owner</option>
                      <option value="business">Business Owner</option>
                      <option value="government">Government Agency</option>
                    </select>
                    {errors.accountType && (
                      <span className="error-message">{errors.accountType}</span>
                    )}
                    {formData.accountType === 'government' && (
                      <div className="info-message">
                        Government accounts require official email verification
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      <User size={18} />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`form-input ${errors.name ? 'input-error' : ''}`}
                      placeholder="Enter your full name"
                      required
                    />
                    {errors.name && (
                      <span className="error-message">{errors.name}</span>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      <Phone size={18} />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`form-input ${errors.phone ? 'input-error' : ''}`}
                      placeholder="10-digit phone number"
                      maxLength="10"
                      required
                    />
                    {errors.phone && (
                      <span className="error-message">{errors.phone}</span>
                    )}
                  </div>

                  {/* Address */}
                  <div className="form-group">
                    <label htmlFor="address" className="form-label">
                      <MapPin size={18} />
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Street address"
                    />
                  </div>

                  {/* City */}
                  <div className="form-group">
                    <label htmlFor="city" className="form-label">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="City"
                    />
                  </div>

                  {/* Province and Postal Code in one row */}
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="province" className="form-label">
                        Province
                      </label>
                      <input
                        type="text"
                        id="province"
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Province"
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="postalCode" className="form-label">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="A1A 1A1"
                      />
                    </div>
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
                        Create Account
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>

                  <div className="divider">
                    <span>Already have an account?</span>
                  </div>

                  <div className="auth-footer">
                    <Link to="/login" className="auth-button secondary">
                      Sign In Instead
                    </Link>
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

export default Register;