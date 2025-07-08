import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import MerchantTrainingSchedule from '../components/MerchantTrainingSchedule';

const MerchantDashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    email: '',
    businessName: '',
    businessRegistrationNumber: '',
    contactPersonName: '',
    contactPhone: '',
    businessAddress: '',
    businessCategory: '',
    status: 'pending',
    onboardingId: ''
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiService.getMerchantProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage('');

    try {
      await apiService.updateMerchantProfile(profile);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'status-confirmed';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'status-pending';
      default:
        return 'status-inactive';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      case 'suspended':
        return '⚠️';
      default:
        return '⏳';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-text-muted">Loading your profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="card">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-main">
              Welcome, {profile.contactPersonName || user?.email}!
            </h1>
            <p className="text-text-muted mt-2">
              Manage your business profile and track your onboarding progress
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-text-muted">Account Status:</span>
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getStatusIcon(profile.status)}</span>
              <span className={`status-badge ${getStatusColor(profile.status)}`}>
                {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`card ${message.includes('successfully') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center">
            <span className="text-lg mr-3">
              {message.includes('successfully') ? '✅' : '❌'}
            </span>
            <p className={`font-medium ${message.includes('successfully') ? 'text-green-800' : 'text-red-800'}`}>
              {message}
            </p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-primary-600 font-bold text-lg">👋</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-text-main">Welcome</h3>
              <p className="text-sm text-text-muted">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">🏢</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-text-main">Business</h3>
              <p className="text-sm text-text-muted">{profile.businessName || 'Not set'}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold text-lg">📞</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-text-main">Contact</h3>
              <p className="text-sm text-text-muted">{profile.contactPhone || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-bold text-text-main">Business Profile</h2>
          <p className="text-text-muted mt-1">Update your business information and contact details</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="businessName" className="block text-sm font-semibold text-text-main mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={profile.businessName}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter your business name"
                  required
                />
              </div>

              <div>
                <label htmlFor="businessRegistrationNumber" className="block text-sm font-semibold text-text-main mb-2">
                  Business Registration Number *
                </label>
                <input
                  type="text"
                  id="businessRegistrationNumber"
                  name="businessRegistrationNumber"
                  value={profile.businessRegistrationNumber}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter registration number"
                  required
                />
              </div>

              <div>
                <label htmlFor="contactPersonName" className="block text-sm font-semibold text-text-main mb-2">
                  Contact Person Name *
                </label>
                <input
                  type="text"
                  id="contactPersonName"
                  name="contactPersonName"
                  value={profile.contactPersonName}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter contact person name"
                  required
                />
              </div>

              <div>
                <label htmlFor="contactPhone" className="block text-sm font-semibold text-text-main mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={profile.contactPhone}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <label htmlFor="businessCategory" className="block text-sm font-semibold text-text-main mb-2">
                  Business Category *
                </label>
                <select
                  id="businessCategory"
                  name="businessCategory"
                  value={profile.businessCategory}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="retail">Retail</option>
                  <option value="food-beverage">Food & Beverage</option>
                  <option value="services">Services</option>
                  <option value="technology">Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="businessAddress" className="block text-sm font-semibold text-text-main mb-2">
                Business Address *
              </label>
              <textarea
                id="businessAddress"
                name="businessAddress"
                rows={4}
                value={profile.businessAddress}
                onChange={handleInputChange}
                className="input-field resize-none"
                placeholder="Enter your complete business address"
                required
              />
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-divider">
              <button
                type="button"
                onClick={fetchProfile}
                className="btn-secondary"
                disabled={updating}
              >
                Reset Changes
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={updating}
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Training Schedule */}
      {profile.onboardingId && (
        <MerchantTrainingSchedule onboardingId={profile.onboardingId} />
      )}
    </div>
  );
};

export default MerchantDashboard; 