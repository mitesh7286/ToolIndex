import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Header from '/src/components/Layout/Header'
import ProtectedRoute from '/src/Components/Layout/ProtectedRoute'
import Login from '/src/components/Auth/Login'
import Register from '/src/components/Auth/Register'
import ForgotPassword from '/src/components/Auth/ForgotPassword'
import ResetPassword from '/src/components/Auth/ResetPassword'
import Dashboard from '/src/Dashboard'
import Profile from '/src/components/Profile'
import AdminDashboard from '/src/Admin'
import ToolDetails from '/src/Components/Tools/Toolsdetails'
import AddTool from '/src/Components/Tools/AddTool'
import EditTool from '/src/Components/Tools/EditTool'
import '/src/index.css';

const App = () => {
  const [session, setSession] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) {
          setUserInfo(session.user.user_metadata);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session) {
          setUserInfo(session.user.user_metadata);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #f9fafb, #eff6ff)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading Tool-Index...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        {session && <Header userInfo={userInfo} />}
        <div style={{
          maxWidth: session ? '80rem' : '100%',
          margin: '0 auto',
          padding: session ? '2rem 1rem' : '0',
          minHeight: session ? 'calc(100vh - 80px)' : '100vh'
        }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!session ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/forgot-password" element={!session ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
            <Route path="/reset-password" element={!session ? <ResetPassword /> : <Navigate to="/dashboard" />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<Navigate to={session ? "/dashboard" : "/login"} />} />
            <Route path="/dashboard" element={
              <ProtectedRoute session={session}>
                <Dashboard userInfo={userInfo} />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute session={session}>
                <Profile userInfo={userInfo} />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute session={session} adminOnly>
                <AdminDashboard userInfo={userInfo} />
              </ProtectedRoute>
            } />
            
            <Route path="/tools/add" element={
              <ProtectedRoute session={session}>
                <AddTool userInfo={userInfo} />
              </ProtectedRoute>
            } />
            <Route path="/tools/:id" element={
              <ProtectedRoute session={session}>
                <ToolDetails userInfo={userInfo} />
              </ProtectedRoute>
            } />
            <Route path="/tools/:id/edit" element={
              <ProtectedRoute session={session}>
                <EditTool userInfo={userInfo} />
              </ProtectedRoute>
            } />
            
            
            {/* 404 */}
            <Route path="*" element={<Navigate to={session ? "/dashboard" : "/login"} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;