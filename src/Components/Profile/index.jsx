// src/components/Profile/index.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '/src/supabaseClient';
import { User, Phone, MapPin, Building, Save, AlertCircle } from 'lucide-react';

const Profile = ({ userInfo }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userInfo) {
      setFormData({
        fullName: userInfo.fullName || '',
        phone: userInfo.phone || '',
        address: userInfo.address || '',
        city: userInfo.city || '',
        province: userInfo.province || '',
        postalCode: userInfo.postal_code || ''
      });
    }
  }, [userInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postalCode
        }
      });

      if (error) throw error;

      setMessage('Profile updated successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-circle">
            <User size={32} />
          </div>
          <div className="profile-info">
            <h1 className="profile-title">Profile Settings</h1>
            <p className="profile-subtitle">Update your personal information</p>
          </div>
        </div>
        
        <div className="account-badge">
          <Building size={16} />
          <span>Account Type: {userInfo?.account_Type || 'Owner'}</span>
        </div>
      </div>

      <div className="profile-content">
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="alert alert-success">
            <span>{message}</span>
          </div>
        )}

        <div className="profile-card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">
                  <User size={18} />
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label">
                  <Phone size={18} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your phone number"
                  maxLength="10"
                />
              </div>

              {/* Address */}
              <div className="form-group">
                <label className="form-label">
                  <MapPin size={18} />
                  Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your street address"
                />
              </div>

              {/* City */}
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your city"
                />
              </div>

              {/* Province */}
              <div className="form-group">
                <label className="form-label">Province</label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your province"
                />
              </div>

              {/* Postal Code */}
              <div className="form-group">
                <label className="form-label">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="A1A 1A1"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="read-only-field">
              <label className="form-label">Email Address</label>
              <div className="read-only-input">
                {userInfo?.email || 'Not available'}
                <span className="read-only-note">(Cannot be changed)</span>
              </div>
            </div>

            {/* Account Type (read-only) */}
            <div className="read-only-field">
              <label className="form-label">Account Type</label>
              <div className="account-type-badge">
                {userInfo?.account_Type || 'Owner'}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;