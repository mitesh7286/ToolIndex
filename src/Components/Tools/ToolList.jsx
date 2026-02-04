import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '/src/supabaseClient';
import { Search, Plus, AlertCircle, Eye, Camera } from 'lucide-react';

const ToolList = ({ userInfo }) => {
  const [tools, setTools] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      setLoading(true);
      let query = supabase.from('report_tools').select('*');

      // Filter by user if not government
      if (userInfo?.account_Type !== 'government') {
        query = query.eq('email', userInfo?.email);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTools(data || []);
    } catch (error) {
      setError('Failed to load tools: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTools = tools.filter(tool =>
    [tool.make, tool.model, tool.serial_number, tool.police_file]
      .some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="loading-spinner"></div>
        <p>Loading tools...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Tools</h1>
        <p>View and manage your reported tools</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={20} />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.875rem 1rem 0.875rem 3rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>
        <Link to="/tools/add" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} />
          Add Tool
        </Link>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {filteredTools.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '0.75rem' }}>
          <Camera size={48} color="#9ca3af" style={{ marginBottom: '1rem' }} />
          <h3>No tools found</h3>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            {searchTerm ? 'Try a different search term' : 'Start by reporting your first tool'}
          </p>
          {!searchTerm && (
            <Link to="/tools/add" className="btn-primary">
              Report First Tool
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredTools.map((tool) => (
            <div key={tool.id} style={{ background: 'white', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ position: 'relative', height: '180px' }}>
                {tool.img_url ? (
                  <img src={tool.img_url} alt={tool.make} style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={48} color="#9ca3af" />
                  </div>
                )}
                {tool.status === 'stolen' && (
                  <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: '#ef4444', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertCircle size={12} />
                    STOLEN
                  </div>
                )}
              </div>
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>{tool.make} {tool.model}</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', fontFamily: 'monospace' }}>S/N: {tool.serial_number}</p>
                  </div>
                  <Link to={`/tools/${tool.id}`} style={{ color: '#9ca3af', padding: '0.5rem', borderRadius: '9999px', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; }}>
                    <Eye size={18} />
                  </Link>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Reported:</span>
                    <span>{new Date(tool.created_at).toLocaleDateString()}</span>
                  </div>
                  {tool.police_file && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Police File:</span>
                      <span>{tool.police_file}</span>
                    </div>
                  )}
                </div>
                {userInfo?.account_Type === 'government' && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>Owner Contact</div>
                    <div>Name: {tool.owner_name}</div>
                    <div>Phone: {tool.owner_phone}</div>
                    <div>Email: {tool.email}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolList;