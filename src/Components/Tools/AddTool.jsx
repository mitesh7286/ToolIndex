import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '/src/supabaseClient';
import { X, Upload } from 'lucide-react';

const AddTool = ({ userInfo }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    serialNumber: '',
    policeFileNumber: '',
    description: '',
    ownerName: userInfo?.fullName || '',
    ownerPhone: userInfo?.phone || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];
    const newFiles = [];

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        newImages.push(event.target.result);
        newFiles.push(file);
        
        if (newImages.length === files.length) {
          setSelectedImages(prev => [...prev, ...newImages]);
          setImageFiles(prev => [...prev, ...newFiles]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImagesToSupabase = async (toolId) => {
    if (imageFiles.length === 0) return null;

    let firstImageUrl = null;

    for (const [index, file] of imageFiles.entries()) {
      const uniqueName = `${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('Tools')
        .upload(uniqueName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('Tools')
        .getPublicUrl(uniqueName);

      const publicUrl = publicUrlData.publicUrl;

      await supabase.from('report_tool_images').insert({
        report_tool_id: toolId,
        image_url: publicUrl,
        file_name: uniqueName,
        is_primary: index === 0
      });

      if (index === 0) firstImageUrl = publicUrl;
    }

    return firstImageUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Basic validation
    if (!formData.make || !formData.model || !formData.serialNumber || !formData.ownerName || !formData.ownerPhone) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      // Insert tool record
      const { data: toolData, error: toolError } = await supabase
        .from('report_tools')
        .insert({
          user_id: userInfo?.sub,
          make: formData.make,
          model: formData.model,
          serial_number: formData.serialNumber,
          police_file: formData.policeFileNumber || null,
          description: formData.description || null,
          owner_name: formData.ownerName,
          owner_phone: formData.ownerPhone,
          email: userInfo?.email,
          status: null
        })
        .select()
        .single();

      if (toolError) throw toolError;

      // Upload images
      const firstImageUrl = await uploadImagesToSupabase(toolData.id);

      // Update tool with first image URL
      if (firstImageUrl) {
        await supabase
          .from('report_tools')
          .update({ img_url: firstImageUrl })
          .eq('id', toolData.id);
      }

      setSuccess('Tool reported successfully!');
      
      // Reset form
      setFormData({
        make: '',
        model: '',
        serialNumber: '',
        policeFileNumber: '',
        description: '',
        ownerName: userInfo?.fullName || '',
        ownerPhone: userInfo?.phone || ''
      });
      setSelectedImages([]);
      setImageFiles([]);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setError('Failed to report tool: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Report Stolen Tool
        </h1>
        <p style={{ color: '#6b7280' }}>
          Fill in the details of your stolen tool
        </p>
      </div>

      {error && (
        <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>
        </div>
      )}

      {success && (
        <div className="alert-success" style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: '#10b981', fontSize: '0.875rem' }}>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ 
          background: 'white', 
          borderRadius: '0.75rem', 
          padding: '2rem',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Make *
              </label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleChange}
                className="custom-input"
                placeholder="e.g., DeWalt, Milwaukee"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Model *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="custom-input"
                placeholder="e.g., DCD999P2, 2850-20"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Serial Number *
              </label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                className="custom-input"
                placeholder="Enter serial number"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Police File Number
              </label>
              <input
                type="text"
                name="policeFileNumber"
                value={formData.policeFileNumber}
                onChange={handleChange}
                className="custom-input"
                placeholder="If applicable"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Your Name *
              </label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                className="custom-input"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Your Phone *
              </label>
              <input
                type="tel"
                name="ownerPhone"
                value={formData.ownerPhone}
                onChange={handleChange}
                className="custom-input"
                placeholder="10-digit phone number"
                required
                maxLength="10"
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="custom-input"
              placeholder="Additional details, marks, accessories, etc."
              rows="4"
              style={{ resize: 'vertical', width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Tool Images
            </label>
            <div style={{ 
              border: '2px dashed #d1d5db', 
              borderRadius: '0.5rem', 
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
              <div style={{ color: '#6b7280' }}>
                <Upload size={48} style={{ marginBottom: '1rem' }} />
                <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Upload Tool Images</p>
                <p style={{ fontSize: '0.875rem' }}>Drag & drop or click to browse</p>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                  Max 5 images, 5MB each
                </p>
              </div>
            </div>

            {selectedImages.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                {selectedImages.map((img, index) => (
                  <div key={index} style={{ position: 'relative', width: '120px', height: '120px' }}>
                    <img
                      src={img}
                      alt={`Preview ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Reporting...' : 'Report Tool'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddTool;