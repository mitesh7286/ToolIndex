// src/components/Tools/ToolDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '/src/supabaseClient';
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Share2, 
  Printer, 
  Camera, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Hash,
  FileText,
  MapPin
} from 'lucide-react';

const ToolDetails = ({ userInfo }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [tool, setTool] = useState(null);
  const [images, setImages] = useState([]);
  const [primaryImage, setPrimaryImage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  // Status configuration
  const statusConfig = {
    reported: { color: 'bg-blue-100 text-blue-800', icon: <AlertTriangle size={16} />, label: 'Reported' },
    investigating: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={16} />, label: 'Investigating' },
    recovered: { color: 'bg-green-100 text-green-800', icon: <CheckCircle size={16} />, label: 'Recovered' },
    closed: { color: 'bg-gray-100 text-gray-800', icon: <XCircle size={16} />, label: 'Closed' }
  };

  // Fetch tool details
  useEffect(() => {
    if (id) {
      fetchToolDetails();
    }
  }, [id]);

  const fetchToolDetails = async () => {
    try {
      setLoading(true);

      // Fetch tool details
      const { data: toolData, error: toolError } = await supabase
        .from('report_tools')
        .select('*')
        .eq('id', id)
        .single();

      if (toolError) throw toolError;

      // Format dates
      const formattedTool = {
        ...toolData,
        created_at: new Date(toolData.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        updated_at: new Date(toolData.updated_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      setTool(formattedTool);

      // Fetch images
      const { data: imagesData, error: imagesError } = await supabase
        .from('report_tool_images')
        .select('*')
        .eq('report_tool_id', id);

      if (imagesError) throw imagesError;

      setImages(imagesData || []);
      setPrimaryImage(imagesData?.find(img => img.is_primary)?.image_url || imagesData?.[0]?.image_url || '');

    } catch (error) {
      console.error('Error fetching tool details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this tool? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      // First, get all images for this tool
      const { data: images } = await supabase
        .from('report_tool_images')
        .select('file_name')
        .eq('report_tool_id', id);

      // Delete images from storage
      if (images && images.length > 0) {
        const fileNames = images.map(img => img.file_name);
        await supabase.storage
          .from('Tools')
          .remove(fileNames);
      }

      // Delete images from database
      await supabase
        .from('report_tool_images')
        .delete()
        .eq('report_tool_id', id);

      // Delete the tool
      const { error } = await supabase
        .from('report_tools')
        .delete()
        .eq('id', id);

      if (error) throw error;

      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting tool:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/tool/${id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tool: ${tool?.make} ${tool?.model}`,
          text: `Check out this tool report: ${tool?.make} ${tool?.model}`,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopySuccess('Link copied to clipboard!');
        setTimeout(() => setCopySuccess(''), 3000);
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <span style={{ color: '#6b7280' }}>Loading tool details...</span>
      </div>
    );
  }

  if (!tool) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <AlertTriangle size={48} style={{ margin: '0 auto 1rem', color: '#6b7280' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Tool Not Found
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          The tool you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="tool-details" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', paddingTop: '1rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            marginBottom: '1rem',
            padding: '0.5rem 0'
          }}
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              {tool.make} {tool.model}
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
              Serial Number: <strong>{tool.serial_number}</strong>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{
                padding: '0.25rem 0.75rem',
                background: statusConfig[tool.status]?.color || '#f3f4f6',
                color: statusConfig[tool.status]?.color?.split(' ')[1] || '#6b7280',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                {statusConfig[tool.status]?.icon}
                {statusConfig[tool.status]?.label || tool.status}
              </span>
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Reported on {tool.created_at}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleShare}
              style={{
                padding: '0.5rem 1rem',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Share2 size={16} />
              Share
            </button>
            
            <button
              onClick={handlePrint}
              style={{
                padding: '0.5rem 1rem',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Printer size={16} />
              Print
            </button>
            
            {userInfo?.sub === tool.user_id && (
              <>
                <Link
                  to={`/tools/${id}/edit`}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    borderRadius: '0.5rem',
                    fontWeight: '500',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Edit2 size={16} />
                  Edit
                </Link>
                
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '0.5rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Trash2 size={16} />
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </div>

        {copySuccess && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#d1fae5',
            border: '1px solid #a7f3d0',
            borderRadius: '0.5rem',
            color: '#065f46'
          }}>
            {copySuccess}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 400px',
        gap: '2rem',
        '@media (max-width: 1024px)': {
          gridTemplateColumns: '1fr'
        }
      }}>
        {/* Left Column - Images */}
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Images
            </h2>
            
            {primaryImage && (
              <div style={{ marginBottom: '1rem' }}>
                <img
                  src={primaryImage}
                  alt={`${tool.make} ${tool.model} - Primary`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </div>
            )}

            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {images.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setPrimaryImage(img.image_url)}
                    style={{
                      flex: '0 0 auto',
                      width: '100px',
                      height: '100px',
                      border: img.image_url === primaryImage ? '3px solid #3b82f6' : '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: 'none',
                      padding: 0
                    }}
                  >
                    <img
                      src={img.image_url}
                      alt={`${tool.make} ${tool.model} - ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {images.length === 0 && (
              <div style={{
                border: '2px dashed #d1d5db',
                borderRadius: '0.75rem',
                padding: '3rem',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <Camera size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>No images available</p>
              </div>
            )}
          </div>

          {/* Description */}
          {tool.description && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                Description
              </h2>
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                padding: '1.5rem'
              }}>
                <p style={{ color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {tool.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div>
          {/* Tool Information Card */}
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              Tool Information
            </h2>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Make</span>
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                    {tool.make}
                  </div>
                </div>
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Model</span>
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                    {tool.model}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Hash size={16} color="#6b7280" />
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Serial Number</span>
                </div>
                <div style={{ 
                  fontFamily: 'monospace',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  padding: '0.75rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem'
                }}>
                  {tool.serial_number}
                </div>
              </div>

              {tool.police_file && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <FileText size={16} color="#6b7280" />
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Police File Number</span>
                  </div>
                  <div style={{ 
                    padding: '0.75rem',
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '0.5rem',
                    fontWeight: '500'
                  }}>
                    {tool.police_file}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Owner Information Card */}
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              Owner Information
            </h2>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <User size={16} color="#6b7280" />
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Name</span>
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                  {tool.owner_name}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Phone size={16} color="#6b7280" />
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Phone</span>
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                  {formatPhoneNumber(tool.owner_phone)}
                </div>
              </div>

              {tool.email && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Mail size={16} color="#6b7280" />
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Email</span>
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '500', wordBreak: 'break-all' }}>
                    {tool.email}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Report Information Card */}
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              Report Information
            </h2>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Calendar size={16} color="#6b7280" />
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Reported On</span>
                </div>
                <div style={{ fontWeight: '500' }}>
                  {tool.created_at}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Calendar size={16} color="#6b7280" />
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Last Updated</span>
                </div>
                <div style={{ fontWeight: '500' }}>
                  {tool.updated_at}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Shield size={16} color="#6b7280" />
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Report Status</span>
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  background: statusConfig[tool.status]?.color || '#f3f4f6',
                  color: statusConfig[tool.status]?.color?.split(' ')[1] || '#6b7280',
                  borderRadius: '9999px',
                  fontWeight: '500'
                }}>
                  {statusConfig[tool.status]?.icon}
                  {statusConfig[tool.status]?.label || tool.status}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#fee2e2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <AlertTriangle size={24} color="#dc2626" />
              </div>
              
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Delete Tool
              </h3>
              
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Are you sure you want to delete <strong>"{tool.make} {tool.model}"</strong>? This action cannot be undone.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDelete();
                }}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {deleting ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>
        {`
          @media print {
            button, .no-print {
              display: none !important;
            }
            .tool-details {
              max-width: 100% !important;
              padding: 0 !important;
            }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ToolDetails;