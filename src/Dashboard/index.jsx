// src/components/Dashboard/index.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '/src/supabaseClient';
import { 
  Search, 
  Plus, 
  AlertCircle, 
  Eye, 
  Camera, 
  BarChart3, 
  Shield,
  TrendingUp,
  Clock,
  Filter
} from 'lucide-react';

const Dashboard = ({ userInfo }) => {
  const navigate = useNavigate();
  const [tools, setTools] = useState([]);
  const [stats, setStats] = useState({
    totalTools: 0,
    stolenTools: 0,
    reportedThisMonth: 0,
    recoveredTools: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'stolen', 'reported'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'make'

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Build query based on user type
      let query = supabase
        .from('report_tools')
        .select('*');

      // Regular users only see their own tools
      if (userInfo?.account_Type !== 'government') {
        query = query.eq('email', userInfo?.email);
      }

      const { data, error: toolsError } = await query;

      console.log('====>',data);

      if (toolsError) throw toolsError;

      setTools(data || []);
      
      // Calculate stats
      const totalTools = data?.length || 0;
      const stolenTools = data?.filter(t => t.status === 'stolen').length || 0;
      
      // Calculate tools reported this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const reportedThisMonth = data?.filter(t => {
        const toolDate = new Date(t.created_at);
        return toolDate.getMonth() === currentMonth && 
               toolDate.getFullYear() === currentYear;
      }).length || 0;

      setStats({
        totalTools,
        stolenTools,
        reportedThisMonth,
        recoveredTools: 0 // You can add a 'recovered' status field later
      });
    } catch (error) {
      setError('Failed to load dashboard data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStolenStatus = async (toolId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'stolen' ? null : 'stolen';
      
      const { error } = await supabase
        .from('report_tools')
        .update({ status: newStatus })
        .eq('id', toolId);

      if (error) throw error;

      // Update local state
      setTools(tools.map(tool =>
        tool.id === toolId ? { ...tool, status: newStatus } : tool
      ));

      // Update stats
      setStats(prev => ({
        ...prev,
        stolenTools: newStatus === 'stolen' 
          ? prev.stolenTools + 1 
          : prev.stolenTools - 1
      }));
    } catch (error) {
      setError('Failed to update status: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Apply filters and sorting
  const getFilteredAndSortedTools = () => {
    let filtered = [...tools];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(tool =>
        [tool.make, tool.model, tool.serial_number, tool.police_file]
          .some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (filterStatus === 'stolen') {
      filtered = filtered.filter(tool => tool.status === 'stolen');
    } else if (filterStatus === 'reported') {
      filtered = filtered.filter(tool => !tool.status);
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'make':
        filtered.sort((a, b) => a.make.localeCompare(b.make));
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredTools = getFilteredAndSortedTools();

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="loading-spinner" style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem'
          }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Loading Dashboard
          </h3>
          <p style={{ color: '#6b7280' }}>
            Fetching your tools and statistics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Welcome back, {userInfo?.fullName?.split(' ')[0] || 'User'}! 👋
            </h1>
            <p style={{ color: '#6b7280', fontSize: '1rem' }}>
              {userInfo?.account_Type === 'government' 
                ? 'Law Enforcement Dashboard - Monitor all reported tools' 
                : 'Track and manage your reported tools'}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ 
              padding: '0.5rem 1rem', 
              background: '#eff6ff', 
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Shield size={16} color="#3b82f6" />
              <span style={{ fontWeight: '500' }}>{userInfo?.account_Type}</span>
            </div>
            
            <Link
              to="/tools/add"
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
            >
              <Plus size={20} />
              Report Tool
            </Link>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} style={{ marginRight: '0.5rem' }} />
          <span>{error}</span>
          <button 
            onClick={() => setError('')}
            style={{ 
              marginLeft: 'auto', 
              background: 'none', 
              border: 'none', 
              color: '#6b7280',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Tools</p>
              <h3 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalTools}</h3>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#dbeafe',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart3 size={24} color="#3b82f6" />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrendingUp size={16} color="#10b981" />
            <span style={{ fontSize: '0.75rem', color: '#10b981' }}>
              {stats.reportedThisMonth} reported this month
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Stolen Tools</p>
              <h3 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.stolenTools}</h3>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#fee2e2',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertCircle size={24} color="#ef4444" />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${stats.totalTools ? (stats.stolenTools / stats.totalTools * 100) : 0}%`, 
                height: '100%', 
                background: '#ef4444' 
              }} />
            </div>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
              {stats.totalTools ? ((stats.stolenTools / stats.totalTools * 100).toFixed(1)) : 0}% of your tools
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Recently Added</p>
              <h3 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {tools.length > 0 ? formatDate(tools[0].created_at) : 'None'}
              </h3>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#f0f9ff',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={24} color="#0ea5e9" />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {tools.length > 0 
                ? `Latest: ${tools[0].make} ${tools[0].model}`
                : 'No tools reported yet'}
            </p>
          </div>
        </div>

        {userInfo?.account_Type === 'government' && (
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Your Access Level</p>
                <h3 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Full</h3>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#ede9fe',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Shield size={24} color="#8b5cf6" />
              </div>
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                View all tools and contact information
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div style={{ 
        background: 'white', 
        borderRadius: '0.75rem', 
        padding: '1.5rem', 
        marginBottom: '2rem',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-container" style={{ flex: '1', minWidth: '300px' }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '0.875rem', color: '#9ca3af' }} size={20} />
            <input
              type="text"
              placeholder="Search by make, model, serial number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="custom-input"
                style={{ paddingRight: '2.5rem', minWidth: '140px' }}
              >
                <option value="all">All Tools</option>
                <option value="stolen">Stolen Only</option>
                <option value="reported">Reported Only</option>
              </select>
              <Filter size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            </div>

            <div style={{ position: 'relative' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="custom-input"
                style={{ paddingRight: '2.5rem', minWidth: '140px' }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="make">Sort by Make</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
            {userInfo?.account_Type === 'government' ? 'All Reported Tools' : 'Your Tools'}
            <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 'normal', marginLeft: '0.5rem' }}>
              ({filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'})
            </span>
          </h2>
          
          {filteredTools.length > 0 && (
            <div style={{ fontSize: '0.875rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} />
              <span>Sorted by {sortBy === 'newest' ? 'newest' : sortBy === 'oldest' ? 'oldest' : 'make'}</span>
            </div>
          )}
        </div>

        {filteredTools.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              {searchTerm || filterStatus !== 'all' ? '🔍' : '🔧'}
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              {searchTerm ? 'No matching tools found' : 'No tools reported yet'}
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              {searchTerm 
                ? 'Try adjusting your search terms or filters'
                : userInfo?.account_Type === 'government'
                  ? 'Users will appear here once they report stolen tools'
                  : 'Start by reporting your first stolen tool'
              }
            </p>
            {!searchTerm && userInfo?.account_Type !== 'government' && (
              <Link to="/tools/add" className="btn-primary">
                Report Your First Tool
              </Link>
            )}
          </div>
        ) : (
          <div className="tools-grid">
            {filteredTools.map((tool) => (
              <div key={tool.id} className="tool-card">
                <div className="tool-card-header">
                  <div className="tool-card-image">
                    {tool.img_url ? (
                      <img 
                        src={tool.img_url} 
                        alt={`${tool.make} ${tool.model}`}
                        style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: '180px', 
                        background: '#f3f4f6', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#9ca3af'
                      }}>
                        <Camera size={48} />
                      </div>
                    )}
                    {tool.status === 'stolen' && (
                      <div className="stolen-badge">
                        <AlertCircle size={14} />
                        STOLEN
                      </div>
                    )}
                  </div>
                </div>

                <div className="tool-card-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                        {tool.make} {tool.model}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', fontFamily: 'monospace' }}>
                        S/N: {tool.serial_number}
                      </p>
                    </div>
                    <Link
                      to={`/tools/${tool.id}`}
                      className="view-button"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </Link>
                  </div>

                  <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {tool.police_file && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Police File:</span>
                        <span style={{ fontWeight: '500' }}>{tool.police_file}</span>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Reported:</span>
                      <span>{formatDate(tool.created_at)}</span>
                    </div>

                    {userInfo?.account_Type === 'government' && (
                      <div style={{ 
                        marginTop: '0.75rem', 
                        paddingTop: '0.75rem', 
                        borderTop: '1px solid #e5e7eb' 
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem' }}>
                          OWNER CONTACT
                        </div>
                        <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                          <strong>Name:</strong> {tool.owner_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                          <strong>Phone:</strong> {tool.owner_phone}
                        </div>
                        <div style={{ fontSize: '0.75rem' }}>
                          <strong>Email:</strong> {tool.email}
                        </div>
                      </div>
                    )}
                  </div>

                  {tool.email === userInfo?.email && (
                    <button
                      onClick={() => toggleStolenStatus(tool.id, tool.status)}
                      className={tool.status === 'stolen' ? 'btn-danger' : 'btn-secondary'}
                      style={{
                        width: '100%',
                        marginTop: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      <AlertCircle size={16} />
                      {tool.status === 'stolen' ? 'Unmark as Stolen' : 'Mark as Stolen'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      {filteredTools.length > 0 && (
        <div style={{ 
          marginTop: '3rem', 
          padding: '1.5rem', 
          background: 'white', 
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              to="/tools/add"
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={18} />
              Report Another Tool
            </Link>
            
            {userInfo?.account_Type === 'government' && (
              <Link
                to="/admin"
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Shield size={18} />
                Go to Admin Dashboard
              </Link>
            )}
            
            <button
              onClick={() => window.print()}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <BarChart3 size={18} />
              Print Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Add these styles to your CSS
const styles = `
.dashboard-container {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.stat-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.tool-card {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
}

.tool-card-content {
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tool-card-image {
  position: relative;
  overflow: hidden;
}

.tool-card-image img {
  transition: transform 0.3s;
}

.tool-card:hover .tool-card-image img {
  transform: scale(1.05);
}

.stolen-badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.view-button {
  color: #9ca3af;
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-button:hover {
  color: #3b82f6;
  background: #eff6ff;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 0.75rem;
  }
  
  .tools-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 1.25rem;
  }
}

@media (max-width: 480px) {
  .dashboard-container {
    padding: 0.5rem;
  }
}
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default Dashboard;