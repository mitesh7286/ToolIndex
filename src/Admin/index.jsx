// src/components/Admin/index.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '/src/supabaseClient';
import { Users, AlertCircle, Shield, BarChart3, Search } from 'lucide-react';

const AdminDashboard = ({ userInfo }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTools: 0,
    stolenTools: 0,
    governmentUsers: 0,
    recentTools: [],
    recentUsers: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    if (userInfo?.account_Type !== 'government') {
      return;
    }
    fetchAdminData();
  }, [userInfo]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Fetch user statistics
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const totalUsers = usersData?.users?.length || 0;
      const governmentUsers = usersData?.users?.filter(user => 
        user.user_metadata?.account_Type === 'government'
      ).length || 0;

      // Fetch tool statistics
      const { data: toolsData } = await supabase
        .from('report_tools')
        .select('*');

      const totalTools = toolsData?.length || 0;
      const stolenTools = toolsData?.filter(tool => tool.status === 'stolen').length || 0;

      // Fetch recent tools
      const { data: recentToolsData } = await supabase
        .from('report_tools')
        .select('*, report_tool_images(image_url)')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent users
      const recentUsers = usersData?.users
        ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10) || [];

      setStats({
        totalUsers,
        totalTools,
        stolenTools,
        governmentUsers,
        recentTools: recentToolsData || [],
        recentUsers
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <div style={{
        background: color,
        width: '48px',
        height: '48px',
        borderRadius: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={24} color="white" />
      </div>
      <div>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>{title}</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</p>
      </div>
    </div>
  );

  if (userInfo?.account_Type !== 'government') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <Shield size={64} color="#9ca3af" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Access Denied
        </h2>
        <p style={{ color: '#6b7280' }}>
          This section is only accessible to government agency accounts.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div>Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: '#6b7280' }}>
          Manage and monitor the Tool-Index platform
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="#3b82f6"
        />
        <StatCard
          title="Reported Tools"
          value={stats.totalTools}
          icon={Users}
          color="#10b981"
        />
        <StatCard
          title="Stolen Tools"
          value={stats.stolenTools}
          icon={AlertCircle}
          color="#ef4444"
        />
        <StatCard
          title="Govt. Agencies"
          value={stats.governmentUsers}
          icon={Shield}
          color="#8b5cf6"
        />
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setSelectedTab('overview')}
            style={{
              padding: '0.75rem 1.5rem',
              background: selectedTab === 'overview' ? '#3b82f6' : 'transparent',
              color: selectedTab === 'overview' ? 'white' : '#6b7280',
              border: 'none',
              borderBottom: selectedTab === 'overview' ? '2px solid #3b82f6' : 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            <BarChart3 size={16} style={{ marginRight: '0.5rem' }} />
            Overview
          </button>
          <button
            onClick={() => setSelectedTab('tools')}
            style={{
              padding: '0.75rem 1.5rem',
              background: selectedTab === 'tools' ? '#3b82f6' : 'transparent',
              color: selectedTab === 'tools' ? 'white' : '#6b7280',
              border: 'none',
              borderBottom: selectedTab === 'tools' ? '2px solid #3b82f6' : 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            <Tool size={16} style={{ marginRight: '0.5rem' }} />
            Recent Tools
          </button>
          <button
            onClick={() => setSelectedTab('users')}
            style={{
              padding: '0.75rem 1.5rem',
              background: selectedTab === 'users' ? '#3b82f6' : 'transparent',
              color: selectedTab === 'users' ? 'white' : '#6b7280',
              border: 'none',
              borderBottom: selectedTab === 'users' ? '2px solid #3b82f6' : 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            <Users size={16} style={{ marginRight: '0.5rem' }} />
            Recent Users
          </button>
        </div>
      </div>

      {/* Content based on selected tab */}
      {selectedTab === 'overview' && (
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '2rem', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Platform Analytics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '1rem' }}>
                Tool Status Distribution
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Stolen Tools</span>
                    <span>{stats.stolenTools} ({(stats.totalTools ? (stats.stolenTools / stats.totalTools * 100).toFixed(1) : 0)}%)</span>
                  </div>
                  <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${stats.totalTools ? (stats.stolenTools / stats.totalTools * 100) : 0}%`, 
                      height: '100%', 
                      background: '#ef4444' 
                    }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Reported (Not Stolen)</span>
                    <span>{stats.totalTools - stats.stolenTools} ({(stats.totalTools ? ((stats.totalTools - stats.stolenTools) / stats.totalTools * 100).toFixed(1) : 0)}%)</span>
                  </div>
                  <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${stats.totalTools ? ((stats.totalTools - stats.stolenTools) / stats.totalTools * 100) : 0}%`, 
                      height: '100%', 
                      background: '#10b981' 
                    }} />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '1rem' }}>
                User Types
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Government Agencies</span>
                    <span>{stats.governmentUsers} ({(stats.totalUsers ? (stats.governmentUsers / stats.totalUsers * 100).toFixed(1) : 0)}%)</span>
                  </div>
                  <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${stats.totalUsers ? (stats.governmentUsers / stats.totalUsers * 100) : 0}%`, 
                      height: '100%', 
                      background: '#8b5cf6' 
                    }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Regular Users</span>
                    <span>{stats.totalUsers - stats.governmentUsers} ({(stats.totalUsers ? ((stats.totalUsers - stats.governmentUsers) / stats.totalUsers * 100).toFixed(1) : 0)}%)</span>
                  </div>
                  <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${stats.totalUsers ? ((stats.totalUsers - stats.governmentUsers) / stats.totalUsers * 100) : 0}%`, 
                      height: '100%', 
                      background: '#3b82f6' 
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'tools' && (
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '2rem', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Recent Tool Reports</h3>
            <div className="search-container" style={{ width: '300px' }}>
              <Search style={{ position: 'absolute', left: '1rem', top: '0.875rem', color: '#9ca3af' }} size={20} />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Tool</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Serial</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Owner</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Date Reported</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTools
                  .filter(tool => 
                    !searchTerm ||
                    tool.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    tool.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    tool.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((tool) => (
                    <tr key={tool.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {tool.img_url ? (
                            <img 
                              src={tool.img_url} 
                              alt={tool.make}
                              style={{ width: '40px', height: '40px', borderRadius: '0.375rem', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '40px', height: '40px', background: '#f3f4f6', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Tool size={20} color="#9ca3af" />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: '500' }}>{tool.make} {tool.model}</div>
                            {tool.police_file && (
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>File: {tool.police_file}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{tool.serial_number}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <div>{tool.owner_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{tool.email}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: tool.status === 'stolen' ? '#fee2e2' : '#d1fae5',
                          color: tool.status === 'stolen' ? '#dc2626' : '#059669'
                        }}>
                          {tool.status === 'stolen' ? 'Stolen' : 'Reported'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        {new Date(tool.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          
          {stats.recentTools.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#6b7280' }}>
              No tools reported yet.
            </div>
          )}
        </div>
      )}

      {selectedTab === 'users' && (
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '2rem', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Recent Users</h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#6b7280' }}>User</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Account Type</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Phone</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: '500' }}>{user.user_metadata?.fullName || 'N/A'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{user.user_metadata?.city || 'Unknown location'}</div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: user.user_metadata?.account_Type === 'government' ? '#ede9fe' : 
                                   user.user_metadata?.account_Type === 'business' ? '#f0f9ff' : '#f0fdf4',
                        color: user.user_metadata?.account_Type === 'government' ? '#7c3aed' : 
                               user.user_metadata?.account_Type === 'business' ? '#0ea5e9' : '#16a34a'
                      }}>
                        {user.user_metadata?.account_Type || 'owner'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{user.email}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{user.user_metadata?.phone || 'N/A'}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {stats.recentUsers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#6b7280' }}>
              No users registered yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;