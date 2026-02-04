// src/components/Tools/EditTool.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '/src/supabaseClient';
import { X, Camera, Upload, Trash2, AlertTriangle } from 'lucide-react';

const EditTool = ({ userInfo }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    serial_number: '',
    police_file: '',
    description: '',
    owner_name: '',
    owner_phone: '',
    email: '',
    status: ''
  });

  // Memoize fetchToolData with useCallback
  const fetchToolData = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Fetch tool details
      const { data: toolData, error: toolError } = await supabase
        .from('report_tools')
        .select('*')
        .eq('id', id)
        .single();

      if (toolError) throw toolError;

      // Check if user owns this tool
      if (toolData.user_id !== userInfo?.sub) {
        setError('You do not have permission to edit this tool');
        setTimeout(() => navigate('/dashboard'), 2000);
        return;
      }

      // Set form data
      setFormData({
        make: toolData.make || '',
        model: toolData.model || '',
        serial_number: toolData.serial_number || '',
        police_file: toolData.police_file || '',
        description: toolData.description || '',
        owner_name: toolData.owner_name || '',
        owner_phone: toolData.owner_phone || '',
        email: toolData.email || '',
        status: toolData.status || ''
      });

      // Fetch existing images
      const { data: imagesData, error: imagesError } = await supabase
        .from('report_tool_images')
        .select('*')
        .eq('report_tool_id', id);

      if (imagesError) throw imagesError;

      setExistingImages(imagesData || []);

    } catch (error) {
      setError('Failed to load tool data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [id, userInfo, navigate]);

  // Fetch tool data
  useEffect(() => {
    if (id) {
      fetchToolData();
    }
  }, [id, fetchToolData]); // Added fetchToolData to dependencies

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];
    const newFiles = [];

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        newImages.push({
          id: `new-${Date.now()}-${Math.random()}`,
          image_url: event.target.result,
          file_name: file.name,
          is_primary: selectedImages.length + existingImages.length === 0
        });
        newFiles.push(file);
        
        if (newImages.length === files.length) {
          setSelectedImages(prev => [...prev, ...newImages]);
          setImageFiles(prev => [...prev, ...newFiles]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const markExistingImageForDeletion = (imageId) => {
    setImagesToDelete(prev => [...prev, imageId]);
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  const setAsPrimaryImage = (imageId) => {
    // Update existing images
    const updatedExisting = existingImages.map(img => ({
      ...img,
      is_primary: img.id === imageId
    }));
    setExistingImages(updatedExisting);

    // Update selected images
    const updatedSelected = selectedImages.map(img => ({
      ...img,
      is_primary: img.id === imageId
    }));
    setSelectedImages(updatedSelected);
  };

  const uploadImagesToSupabase = async () => {
    if (imageFiles.length === 0) return null;

    let firstImageUrl = null;
    const uploadedImages = [];

    for (const [index, file] of imageFiles.entries()) {
      const uniqueName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('tools')
        .upload(uniqueName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('tools')
        .getPublicUrl(uniqueName);

      const publicUrl = publicUrlData.publicUrl;

      uploadedImages.push({
        report_tool_id: id,
        image_url: publicUrl,
        file_name: uniqueName,
        is_primary: selectedImages[index]?.is_primary || false
      });

      if (selectedImages[index]?.is_primary) {
        firstImageUrl = publicUrl;
      }
    }

    // Insert new images
    if (uploadedImages.length > 0) {
      const { error: insertError } = await supabase
        .from('report_tool_images')
        .insert(uploadedImages);

      if (insertError) throw insertError;
    }

    return firstImageUrl;
  };

  const deleteMarkedImages = async () => {
    if (imagesToDelete.length === 0) return;

    for (const imageId of imagesToDelete) {
      // Get file name from existing images
      const imageToDelete = existingImages.find(img => img.id === imageId);
      if (!imageToDelete) continue;

      // Delete from storage
      await supabase.storage
        .from('tools')
        .remove([imageToDelete.file_name]);

      // Delete from database
      await supabase
        .from('report_tool_images')
        .delete()
        .eq('id', imageId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.make || !formData.model || !formData.serial_number || 
        !formData.owner_name || !formData.owner_phone) {
      setError('Please fill in all required fields');
      setUpdating(false);
      return;
    }

    try {
      // Update tool record
      const { error: updateError } = await supabase
        .from('report_tools')
        .update({
          make: formData.make,
          model: formData.model,
          serial_number: formData.serial_number,
          police_file: formData.police_file || null,
          description: formData.description || null,
          owner_name: formData.owner_name,
          owner_phone: formData.owner_phone,
          email: formData.email || userInfo?.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Handle images
      let primaryImageUrl = null;
      
      // Upload new images
      if (imageFiles.length > 0) {
        primaryImageUrl = await uploadImagesToSupabase();
      }

      // Delete marked images
      await deleteMarkedImages();

      // Update primary image if needed
      const allImages = [...existingImages, ...selectedImages];
      const primaryImage = allImages.find(img => img.is_primary);
      
      if (primaryImage && !primaryImageUrl) {
        primaryImageUrl = primaryImage.image_url;
      }

      if (primaryImageUrl) {
        await supabase
          .from('report_tools')
          .update({ img_url: primaryImageUrl })
          .eq('id', id);
      }

      setSuccess('Tool updated successfully!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      setError('Failed to update tool: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this tool? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
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
          .from('tools')
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

      setSuccess('Tool deleted successfully!');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      setError('Failed to delete tool: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div className="loading-spinner"></div>
        <span style={{ marginLeft: '1rem' }}>Loading tool data...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Edit Tool Report
            </h1>
            <p style={{ color: '#6b7280' }}>
              Update the details of your reported tool
            </p>
          </div>
          <button
            onClick={handleDelete}
            style={{
              padding: '0.5rem 1rem',
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fecaca';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fee2e2';
            }}
          >
            <Trash2 size={16} />
            Delete Tool
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertTriangle size={20} color="#dc2626" />
          <p style={{ color: '#dc2624', fontSize: '0.875rem', margin: 0 }}>{error}</p>
        </div>
      )}

      {success && (
        <div style={{
          background: '#d1fae5',
          border: '1px solid #a7f3d0',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{ color: '#065f46', fontSize: '0.875rem', margin: 0 }}>{success}</p>
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
                name="serial_number"
                value={formData.serial_number}
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
                name="police_file"
                value={formData.police_file}
                onChange={handleChange}
                className="custom-input"
                placeholder="If applicable"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Owner Name *
              </label>
              <input
                type="text"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleChange}
                className="custom-input"
                placeholder="Enter owner name"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Owner Phone *
              </label>
              <input
                type="tel"
                name="owner_phone"
                value={formData.owner_phone}
                onChange={handleChange}
                className="custom-input"
                placeholder="10-digit phone number"
                required
                maxLength="10"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="custom-input"
                placeholder="Email address"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Status
              </label>
              <select
                name="status"
                value={formData.status || ''}
                onChange={handleChange}
                className="custom-input"
              >
                <option value="">Select Status</option>
                <option value="reported">Reported</option>
                <option value="investigating">Investigating</option>
                <option value="recovered">Recovered</option>
                <option value="closed">Closed</option>
              </select>
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

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Existing Images
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {existingImages.map((img) => (
                  <div key={img.id} style={{ position: 'relative', width: '120px', height: '120px' }}>
                    <img
                      src={img.image_url}
                      alt="Tool"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.5rem' }}
                    />
                    <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '2px' }}>
                      {img.is_primary && (
                        <span style={{
                          background: '#3b82f6',
                          color: 'white',
                          fontSize: '10px',
                          padding: '2px 4px',
                          borderRadius: '4px'
                        }}>
                          Primary
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => markExistingImageForDeletion(img.id)}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                    {!img.is_primary && (
                      <button
                        type="button"
                        onClick={() => setAsPrimaryImage(img.id)}
                        style={{
                          position: 'absolute',
                          bottom: '4px',
                          left: '4px',
                          background: 'rgba(59, 130, 246, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        Set as Primary
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images Upload */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Add New Images
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
                <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Upload New Images</p>
                <p style={{ fontSize: '0.875rem' }}>Click to browse or drag & drop</p>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                  Max 5 images, 5MB each
                </p>
              </div>
            </div>

            {/* New Images Preview */}
            {selectedImages.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                {selectedImages.map((img, index) => (
                  <div key={img.id} style={{ position: 'relative', width: '120px', height: '120px' }}>
                    <img
                      src={img.image_url}
                      alt={`New preview ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.5rem' }}
                    />
                    <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '2px' }}>
                      {img.is_primary && (
                        <span style={{
                          background: '#3b82f6',
                          color: 'white',
                          fontSize: '10px',
                          padding: '2px 4px',
                          borderRadius: '4px'
                        }}>
                          Primary
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                    {!img.is_primary && (
                      <button
                        type="button"
                        onClick={() => setAsPrimaryImage(img.id)}
                        style={{
                          position: 'absolute',
                          bottom: '4px',
                          left: '4px',
                          background: 'rgba(59, 130, 246, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        Set as Primary
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
              disabled={updating}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Cancel
            </button>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => navigate(`/tool/${id}`)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                View Details
              </button>
              
              <button
                type="submit"
                className="btn-primary"
                disabled={updating}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {updating ? 'Updating...' : 'Update Tool'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditTool;