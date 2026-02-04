// src/components/Layout/AuthHeader.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const AuthHeader = () => {
  return (
    <header className="auth-header">
      <div className="container">
        <div className="auth-header-content">
          <div className="auth-brand">
            <Link to="/" className="gradient-text">
              <h1>Tool-Index</h1>
            </Link>
            <p className="tagline">Secure Tool Recovery Platform</p>
          </div>
          <nav className="auth-nav">
            <Link to="/login" className="nav-link">
              Sign In
            </Link>
            <Link to="/register" className="nav-button">
              Get Started
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default AuthHeader;