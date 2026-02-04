import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, LogOut, Home, Settings, Shield , Wrench} from 'lucide-react'
import { supabase } from '/src/supabaseClient'

const Header = ({ userInfo }) => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header style={{ 
      background: 'white', 
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', 
      position: 'sticky', 
      top: 0, 
      zIndex: 50 
    }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.25rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <h1 className="gradient-text" style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>
                Tool-Index
              </h1>
            </Link>
            
            <nav style={{ display: 'flex', gap: '1.5rem' }}>
              <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#4b5563' }}>
                <Home size={18} />
                <span>Dashboard</span>
              </Link>
              
              <Link to="/tools/add" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#4b5563' }}>
                <Wrench size={18} />
                <span>Report Tool</span>
              </Link>
              
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#4b5563' }}>
                <Settings size={18} />
                <span>Profile</span>
              </Link>
              
              {userInfo?.account_Type === 'government' && (
                <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#4b5563' }}>
                  <Shield size={18} />
                  <span>Admin</span>
                </Link>
              )}
            </nav>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              padding: '0.5rem 1rem', 
              background: '#eff6ff', 
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <User size={16} color="#3b82f6" />
              <span style={{ fontWeight: '500' }}>{userInfo?.fullName}</span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                ({userInfo?.account_Type})
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                color: '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fee2e2'
                e.currentTarget.style.color = '#dc2626'
                e.currentTarget.style.borderColor = '#fca5a5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#6b7280'
                e.currentTarget.style.borderColor = '#d1d5db'
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header