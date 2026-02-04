// src/components/Layout/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, session, adminOnly = false }) => {
  // If no session, redirect to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  // If adminOnly is required but user is not government, redirect to dashboard
  if (adminOnly && (!session.user.user_metadata || session.user.user_metadata.account_Type !== 'government')) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export default ProtectedRoute;