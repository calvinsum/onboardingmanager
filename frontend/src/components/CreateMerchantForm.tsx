import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiService from '../services/api';

interface CreateMerchantFormData {
  onboardingTypes: string[];
  deliveryAddress1: string;
  deliveryAddress2: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryPostalCode: string;
  deliveryCountry: string;
  useSameAddressForTraining: boolean;
  trainingAddress1: string;
  trainingAddress2: string;
  trainingCity: string;
  trainingState: string;
  trainingPostalCode: string;
  trainingCountry: string;
  picName: string;
  picPhone: string;
  picEmail: string;
  expectedGoLiveDate: string;
}

const onboardingTypeOptions = [
  { value: 'hardware_delivery', label: 'Hardware Delivery' },
  { value: 'hardware_installation', label: 'Hardware Installation' },
  { value: 'remote_training', label: 'Remote Training' },
  { value: 'onsite_training', label: 'Onsite Training' },
];

const CreateMerchantForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateMerchantFormData>({
    onboardingTypes: [],
    deliveryAddress1: '',
    deliveryAddress2: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryPostalCode: '',
    deliveryCountry: 'Malaysia',
    useSameAddressForTraining: false,
    trainingAddress1: '',
    trainingAddress2: '',
    trainingCity: '',
    trainingState: '',
    trainingPostalCode: '',
    trainingCountry: 'Malaysia',
    picName: '',
    picPhone: '',
    picEmail: '',
    expectedGoLiveDate: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOnboardingTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      onboardingTypes: prev.onboardingTypes.includes(type)
        ? prev.onboardingTypes.filter(t => t !== type)
        : [...prev.onboardingTypes, type]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.onboardingTypes.length === 0) {
      toast.error('Please select at least one onboarding type');
      return;
    }

    if (!formData.deliveryAddress1 || !formData.deliveryCity || !formData.deliveryState || !formData.deliveryPostalCode) {
      toast.error('Please fill in all required delivery address fields');
      return;
    }

    if (!formData.useSameAddressForTraining && (!formData.trainingAddress1 || !formData.trainingCity || !formData.trainingState || !formData.trainingPostalCode)) {
      toast.error('Please fill in all required training address fields');
      return;
    }

    if (!formData.picName || !formData.picPhone || !formData.picEmail) {
      toast.error('Please fill in all PIC details');
      return;
    }

    if (!formData.expectedGoLiveDate) {
      toast.error('Please select an expected go live date');
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiService.post('/onboarding', formData);
      
      if (response.data) {
        toast.success(
          <div>
            <div className="font-medium">Merchant onboarding created successfully!</div>
            <div className="text-sm mt-1">
              Access Token: <span className="font-mono bg-gray-100 px-1 rounded">{response.data.accessToken}</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Token expires on: {new Date(response.data.tokenExpiryDate).toLocaleDateString()}
            </div>
          </div>,
          { duration: 8000 }
        );
        
        // Navigate back to dashboard
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Error creating merchant onboarding:', error);
      toast.error(error.response?.data?.message || 'Failed to create merchant onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Merchant Onboarding</h2>
        <p className="text-gray-600">Fill in the details to create a new merchant onboarding record</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Onboarding Types */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {onboardingTypeOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-white transition-colors">
                <input
                  type="checkbox"
                  checked={formData.onboardingTypes.includes(option.value)}
                  onChange={() => handleOnboardingTypeChange(option.value)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
              <input
                type="text"
                name="deliveryAddress1"
                value={formData.deliveryAddress1}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="123 Main Street"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
              <input
                type="text"
                name="deliveryAddress2"
                value={formData.deliveryAddress2}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Unit 5A, Floor 2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                name="deliveryCity"
                value={formData.deliveryCity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Kuala Lumpur"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <input
                type="text"
                name="deliveryState"
                value={formData.deliveryState}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Selangor"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
              <input
                type="text"
                name="deliveryPostalCode"
                value={formData.deliveryPostalCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="50000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <input
                type="text"
                name="deliveryCountry"
                value={formData.deliveryCountry}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Training Address */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Address</h3>
          
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="useSameAddressForTraining"
                checked={formData.useSameAddressForTraining}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Use same address as delivery address</span>
            </label>
          </div>

          {!formData.useSameAddressForTraining && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  name="trainingAddress1"
                  value={formData.trainingAddress1}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="456 Training Street"
                  required={!formData.useSameAddressForTraining}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <input
                  type="text"
                  name="trainingAddress2"
                  value={formData.trainingAddress2}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Floor 2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  name="trainingCity"
                  value={formData.trainingCity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Petaling Jaya"
                  required={!formData.useSameAddressForTraining}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <input
                  type="text"
                  name="trainingState"
                  value={formData.trainingState}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Selangor"
                  required={!formData.useSameAddressForTraining}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                <input
                  type="text"
                  name="trainingPostalCode"
                  value={formData.trainingPostalCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="47000"
                  required={!formData.useSameAddressForTraining}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                <input
                  type="text"
                  name="trainingCountry"
                  value={formData.trainingCountry}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required={!formData.useSameAddressForTraining}
                />
              </div>
            </div>
          )}
        </div>

        {/* PIC Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Person in Charge (PIC)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="picName"
                value={formData.picName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="picPhone"
                value={formData.picPhone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="+60123456789"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                name="picEmail"
                value={formData.picEmail}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="john.doe@merchant.com"
                required
              />
            </div>
          </div>
        </div>

        {/* Expected Go Live Date */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expected Go Live Date</h3>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">EGLD *</label>
            <input
              type="date"
              name="expectedGoLiveDate"
              value={formData.expectedGoLiveDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Merchant Onboarding'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMerchantForm; 