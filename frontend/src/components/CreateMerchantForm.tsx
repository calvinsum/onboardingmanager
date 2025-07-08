import React, { useState, useEffect } from 'react';
import { MALAYSIA_STATES, TRAINER_LANGUAGES } from '../utils/constants';

interface CreateMerchantFormProps {
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  isEditMode?: boolean;
}

interface FormData {
  onboardingTypes: string[];
  accountName: string;
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
  trainingPreferenceLanguages: string[];
  picName: string;
  picPhone: string;
  picEmail: string;
  expectedGoLiveDate: string;
}

const CreateMerchantForm: React.FC<CreateMerchantFormProps> = ({ onSubmit, initialData, isEditMode = false }) => {
  const [formData, setFormData] = useState<FormData>({
    onboardingTypes: [],
    accountName: '',
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
    trainingPreferenceLanguages: [],
    picName: '',
    picPhone: '',
    picEmail: '',
    expectedGoLiveDate: '',
  });

  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        onboardingTypes: initialData.onboardingTypes || [],
        accountName: initialData.accountName || '',
        deliveryAddress1: initialData.deliveryAddress1 || '',
        deliveryAddress2: initialData.deliveryAddress2 || '',
        deliveryCity: initialData.deliveryCity || '',
        deliveryState: initialData.deliveryState || '',
        deliveryPostalCode: initialData.deliveryPostalCode || '',
        deliveryCountry: initialData.deliveryCountry || 'Malaysia',
        useSameAddressForTraining: initialData.useSameAddressForTraining || false,
        trainingAddress1: initialData.trainingAddress1 || '',
        trainingAddress2: initialData.trainingAddress2 || '',
        trainingCity: initialData.trainingCity || '',
        trainingState: initialData.trainingState || '',
        trainingPostalCode: initialData.trainingPostalCode || '',
        trainingCountry: initialData.trainingCountry || 'Malaysia',
        trainingPreferenceLanguages: initialData.trainingPreferenceLanguages || [],
        picName: initialData.picName || '',
        picPhone: initialData.picPhone || '',
        picEmail: initialData.picEmail || '',
        expectedGoLiveDate: initialData.expectedGoLiveDate || '',
      });
    }
  }, [initialData, isEditMode]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleOnboardingTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const newOnboardingTypes = checked
        ? [...prev.onboardingTypes, value]
        : prev.onboardingTypes.filter(type => type !== value);
      return { ...prev, onboardingTypes: newOnboardingTypes };
    });
  };

  const handleTrainingLanguageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const newLanguages = checked
        ? [...prev.trainingPreferenceLanguages, value]
        : prev.trainingPreferenceLanguages.filter(lang => lang !== value);
      return { ...prev, trainingPreferenceLanguages: newLanguages };
    });
  };

  // Check if training is selected (remote or onsite)
  const isTrainingSelected = formData.onboardingTypes.includes('remote_training') || 
                             formData.onboardingTypes.includes('onsite_training');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      // Error is handled by the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{isEditMode ? 'Edit Merchant Onboarding' : 'Create Merchant Onboarding'}</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Account Name */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Account Information</h3>
          <input
            type="text"
            name="accountName"
            value={formData.accountName}
            onChange={handleChange}
            placeholder="Account Name (e.g., ABC Trading Sdn Bhd)"
            required={!isEditMode}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Onboarding Types */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Onboarding Types</h3>
          <div className="grid grid-cols-2 gap-4">
            {['hardware_delivery', 'hardware_installation', 'remote_training', 'onsite_training'].map(type => (
              <label key={type} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="onboardingTypes"
                  value={type}
                  checked={formData.onboardingTypes.includes(type as never)}
                  onChange={handleOnboardingTypeChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">{type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Delivery Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" name="deliveryAddress1" value={formData.deliveryAddress1} onChange={handleChange} placeholder="Address Line 1" required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            <input type="text" name="deliveryAddress2" value={formData.deliveryAddress2} onChange={handleChange} placeholder="Address Line 2" className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            <input type="text" name="deliveryCity" value={formData.deliveryCity} onChange={handleChange} placeholder="City" required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            <select name="deliveryState" value={formData.deliveryState} onChange={handleChange} required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">Select State</option>
              {MALAYSIA_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <input type="text" name="deliveryPostalCode" value={formData.deliveryPostalCode} onChange={handleChange} placeholder="Postal Code" required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            <input type="text" name="deliveryCountry" value={formData.deliveryCountry} onChange={handleChange} placeholder="Country" required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
        </div>

        {/* Training Preferences - Only show if training is selected */}
        {isTrainingSelected && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Training Preferences</h3>
            
            {/* Training Preference Languages */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Training Languages * (Select all that apply)
              </label>
              <div className="grid grid-cols-3 gap-4">
                {TRAINER_LANGUAGES.map(language => (
                  <label key={language} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={language}
                      checked={formData.trainingPreferenceLanguages.includes(language)}
                      onChange={handleTrainingLanguageChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{language}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Training Address */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-4">Training Address</h4>
              <label className="flex items-center space-x-2 mb-4">
                <input 
                  type="checkbox" 
                  name="useSameAddressForTraining" 
                  checked={formData.useSameAddressForTraining} 
                  onChange={handleChange} 
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" 
                />
                <span>Same as Delivery Address</span>
              </label>
              {!formData.useSameAddressForTraining && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input 
                    type="text" 
                    name="trainingAddress1" 
                    value={formData.trainingAddress1} 
                    onChange={handleChange} 
                    placeholder="Address Line 1" 
                    required={isTrainingSelected && !formData.useSameAddressForTraining}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                  />
                  <input 
                    type="text" 
                    name="trainingAddress2" 
                    value={formData.trainingAddress2} 
                    onChange={handleChange} 
                    placeholder="Address Line 2" 
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                  />
                  <input 
                    type="text" 
                    name="trainingCity" 
                    value={formData.trainingCity} 
                    onChange={handleChange} 
                    placeholder="City" 
                    required={isTrainingSelected && !formData.useSameAddressForTraining}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                  />
                  <select 
                    name="trainingState" 
                    value={formData.trainingState} 
                    onChange={handleChange} 
                    required={isTrainingSelected && !formData.useSameAddressForTraining}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select State</option>
                    {MALAYSIA_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    name="trainingPostalCode" 
                    value={formData.trainingPostalCode} 
                    onChange={handleChange} 
                    placeholder="Postal Code" 
                    required={isTrainingSelected && !formData.useSameAddressForTraining}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                  />
                  <input 
                    type="text" 
                    name="trainingCountry" 
                    value={formData.trainingCountry} 
                    onChange={handleChange} 
                    placeholder="Country" 
                    required={isTrainingSelected && !formData.useSameAddressForTraining}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* PIC Details */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Person-in-Charge (PIC) Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input type="text" name="picName" value={formData.picName} onChange={handleChange} placeholder="PIC Name" required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            <input type="text" name="picPhone" value={formData.picPhone} onChange={handleChange} placeholder="PIC Phone" required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            <input type="email" name="picEmail" value={formData.picEmail} onChange={handleChange} placeholder="PIC Email" required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
        </div>

        {/* EGLD */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Expected Go-Live Date (EGLD)</h3>
          <input type="date" name="expectedGoLiveDate" value={formData.expectedGoLiveDate} onChange={handleChange} required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 max-w-xs" />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-400">
            {isSubmitting ? 'Submitting...' : (isEditMode ? 'Update Record' : 'Create Record')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMerchantForm; 