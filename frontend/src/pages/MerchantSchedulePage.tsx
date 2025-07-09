import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { toast } from 'react-hot-toast';
import { format, isWeekend, set } from 'date-fns';
import { updateOnboardingByToken, getPublicHolidays, getAvailableTrainingSlots } from '../services/api';
import { DELIVERY_TIME_BY_STATE, calculateMinInstallationDate, calculateMinTrainingDate } from '../utils/constants';
import { bookMerchantTrainingSlot } from '../services/api'; // Added import for booking training slot

// Mobile-friendly Date Picker component
const MobileDatePicker = ({ 
  label, 
  selectedDate, 
  onDateChange, 
  minDate, 
  disabledDays, 
  disabled = false, 
  includeTime = false,
  onboardingRecord = null,
  checkAvailability = false
}: {
  label: string;
  selectedDate: Date | undefined;
  onDateChange: (date: Date) => void;
  minDate?: Date;
  disabledDays: any[];
  disabled?: boolean;
  includeTime?: boolean;
  onboardingRecord?: any;
  checkAvailability?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState('09:30');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const defaultTimeSlots = [
    '09:30', '12:00', '14:30', '17:00'
  ];

  // Check slot availability when date changes (only for training slots)
  useEffect(() => {
    if (checkAvailability && selectedDate && onboardingRecord) {
      checkSlotAvailability(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, checkAvailability, onboardingRecord]);

  const checkSlotAvailability = async (date: Date) => {
    if (!onboardingRecord) return;

    setLoadingSlots(true);
    setSlotError(null);

    try {
      // Determine training type based on onboarding record
      const hasRemoteTraining = onboardingRecord?.onboardingTypes?.includes('remote_training');
      const hasOnsiteTraining = onboardingRecord?.onboardingTypes?.includes('onsite_training');
      
      const trainingType = hasOnsiteTraining && !hasRemoteTraining ? 'onsite_training' : 'remote_training';
      const location = trainingType === 'onsite_training' ? onboardingRecord?.trainingState : undefined;
      const languages = onboardingRecord?.trainingPreferenceLanguages?.join(',') || '';

      const dateStr = format(date, 'yyyy-MM-dd');
      const slots = await getAvailableTrainingSlots(dateStr, trainingType, location, languages);
      
      setAvailableSlots(slots);
      
      if (slots.length === 0) {
        // Check if it's due to no trainers matching the criteria
        const allSlots = await getAvailableTrainingSlots(dateStr, trainingType);
        if (allSlots.length === 0) {
          setSlotError('No training slots available for the selected date. Please choose another date.');
        } else {
          setSlotError('No trainers available for your location and language preferences. Please contact your onboarding manager.');
        }
      }
    } catch (error) {
      console.error('Error checking slot availability:', error);
      setSlotError('Unable to check slot availability. Please try again.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const getTimeSlots = () => {
    if (!checkAvailability) {
      return defaultTimeSlots;
    }
    
    if (loadingSlots) {
      return [];
    }
    
    if (availableSlots.length === 0) {
      return [];
    }
    
    return availableSlots.map(slot => slot.timeSlot);
  };

  const handleDaySelect = (date: Date | undefined) => {
    if (date) {
      if (includeTime) {
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const dateWithTime = set(date, { hours, minutes, seconds: 0, milliseconds: 0 });
        onDateChange(dateWithTime);
      } else {
        onDateChange(date);
      }
    }
    setIsOpen(false);
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      const [hours, minutes] = time.split(':').map(Number);
      const dateWithTime = set(selectedDate, { hours, minutes, seconds: 0, milliseconds: 0 });
      onDateChange(dateWithTime);
    }
  };

  const timeSlots = getTimeSlots();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className={`w-full p-3 text-left border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-900 hover:bg-gray-50'
        }`}
      >
        {selectedDate ? (
          <div>
            <div className="font-medium">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </div>
            {includeTime && (
              <div className="text-sm text-gray-500 mt-1">
                {format(selectedDate, 'h:mm a')}
              </div>
            )}
          </div>
        ) : (
          <span className="text-gray-500">Select {label.toLowerCase()}</span>
        )}
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{label}</h3>
            </div>
            
            <div className="p-4">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDaySelect}
                fromDate={minDate || new Date()}
                disabled={disabledDays}
                initialFocus
                className="mx-auto"
              />
              
              {includeTime && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                  
                  {loadingSlots && (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-sm text-gray-600">Checking availability...</span>
                    </div>
                  )}
                  
                  {slotError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-red-500 mr-2">⚠️</span>
                        <span className="text-sm text-red-700">{slotError}</span>
                      </div>
                    </div>
                  )}
                  
                  {!loadingSlots && !slotError && timeSlots.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map(time => (
                        <button
                          key={time}
                          type="button"
                          className={`p-2 text-sm rounded-md border transition-colors ${
                            selectedTime === time
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => handleTimeChange(time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {!loadingSlots && !slotError && timeSlots.length === 0 && selectedDate && checkAvailability && (
                    <div className="text-center py-4">
                      <div className="text-gray-500 text-sm">
                        Please select a date first to view available time slots.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Delivery Confirmation Component
const DeliveryConfirmation = ({ 
  onboardingRecord, 
  onConfirm, 
  isConfirmed 
}: {
  onboardingRecord: any;
  onConfirm: () => void;
  isConfirmed: boolean;
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAddress, setEditedAddress] = useState({
    address1: onboardingRecord?.deliveryAddress1 || '',
    address2: onboardingRecord?.deliveryAddress2 || '',
    city: onboardingRecord?.deliveryCity || '',
    state: onboardingRecord?.deliveryState || '',
    postalCode: onboardingRecord?.deliveryPostalCode || '',
    country: onboardingRecord?.deliveryCountry || ''
  });

  const deliveryTime = DELIVERY_TIME_BY_STATE[onboardingRecord?.deliveryState] || { min: 3, max: 5 };
  const deliveryTimeText = deliveryTime.min === deliveryTime.max 
    ? `${deliveryTime.min} working day${deliveryTime.min > 1 ? 's' : ''}`
    : `${deliveryTime.min} - ${deliveryTime.max} working days`;

  const handleSaveAddress = () => {
    // Here you would typically save the address to the backend
    // For now, we'll just close the edit mode
    setIsEditing(false);
    toast.success('Address updated successfully!');
  };

  if (isConfirmed) {
    return (
      <div className="mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Delivery Confirmed</h3>
              <p className="text-sm text-green-700 mt-1">
                Your hardware will be delivered within {deliveryTimeText}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">Hardware Delivery</label>
      
      {!showDetails ? (
        <button
          type="button"
          className="w-full p-4 border-2 border-blue-300 rounded-lg text-left bg-blue-50 hover:bg-blue-100 transition-colors"
          onClick={() => setShowDetails(true)}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-blue-900">Click to Proceed Delivery</span>
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      ) : (
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
          {/* Delivery Address */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">Delivery Address</h3>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editedAddress.address1}
                  onChange={(e) => setEditedAddress({...editedAddress, address1: e.target.value})}
                  placeholder="Address Line 1"
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  value={editedAddress.address2}
                  onChange={(e) => setEditedAddress({...editedAddress, address2: e.target.value})}
                  placeholder="Address Line 2"
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editedAddress.city}
                    onChange={(e) => setEditedAddress({...editedAddress, city: e.target.value})}
                    placeholder="City"
                    className="p-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    value={editedAddress.postalCode}
                    onChange={(e) => setEditedAddress({...editedAddress, postalCode: e.target.value})}
                    placeholder="Postal Code"
                    className="p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAddress}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <p>{onboardingRecord?.deliveryAddress1}</p>
                {onboardingRecord?.deliveryAddress2 && <p>{onboardingRecord?.deliveryAddress2}</p>}
                <p>{onboardingRecord?.deliveryCity}, {onboardingRecord?.deliveryState} {onboardingRecord?.deliveryPostalCode}</p>
                <p>{onboardingRecord?.deliveryCountry}</p>
              </div>
            )}
          </div>

          {/* Delivery Time Estimation */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Estimated Delivery Time</h3>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-blue-900">
                  {deliveryTimeText}
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Based on delivery to {onboardingRecord?.deliveryState}
              </p>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={onConfirm}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Confirm Delivery
          </button>
        </div>
      )}
    </div>
  );
};

// Installation Confirmation Component
const InstallationConfirmation = ({ 
  onboardingRecord, 
  onConfirm, 
  isConfirmed,
  installationDate,
  disabled = false
}: {
  onboardingRecord: any;
  onConfirm: () => void;
  isConfirmed: boolean;
  installationDate: Date | undefined;
  disabled?: boolean;
}) => {
  if (isConfirmed) {
    return (
      <div className="mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Installation Confirmed</h3>
              <p className="text-sm text-green-700 mt-1">
                Hardware installation has been confirmed for {installationDate ? format(installationDate, 'PPP p') : 'the scheduled date'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!installationDate) {
    return (
      <div className="mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-800">Installation Date Required</h3>
              <p className="text-sm text-gray-600 mt-1">
                Please select an installation date and time first
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">Hardware Installation Confirmation</label>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Scheduled Installation</h3>
              <p className="text-sm text-gray-600">
                {format(installationDate, 'PPP p')}
              </p>
            </div>
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">Ready to Confirm</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Please confirm that you are ready for the hardware installation at the scheduled time.
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={onConfirm}
            disabled={disabled}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {disabled ? 'Confirming...' : 'Confirm Installation'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Training Confirmation Component
const TrainingConfirmation = ({ 
  onboardingRecord, 
  onConfirm, 
  isConfirmed,
  trainingDate,
  disabled = false
}: {
  onboardingRecord: any;
  onConfirm: () => void;
  isConfirmed: boolean;
  trainingDate: Date | undefined;
  disabled?: boolean;
}) => {
  if (isConfirmed) {
    return (
      <div className="mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Training Confirmed</h3>
              <p className="text-sm text-green-700 mt-1">
                Training has been confirmed for {trainingDate ? format(trainingDate, 'PPP p') : 'the scheduled date'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trainingDate) {
    return (
      <div className="mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-800">Training Date Required</h3>
              <p className="text-sm text-gray-600 mt-1">
                Please select a training date and time first
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">Training Confirmation</label>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Scheduled Training</h3>
              <p className="text-sm text-gray-600">
                {format(trainingDate, 'PPP p')}
              </p>
              {onboardingRecord?.trainingPreferenceLanguages?.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Languages: {onboardingRecord.trainingPreferenceLanguages.join(', ')}
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">Ready to Confirm</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Please confirm that the training session is ready to proceed at the scheduled time.
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={onConfirm}
            disabled={disabled}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {disabled ? 'Confirming...' : 'Confirm Training'}
          </button>
        </div>
      </div>
    </div>
  );
};

const MerchantSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const [onboardingRecord, setOnboardingRecord] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [hardwareDeliveryDate, setHardwareDeliveryDate] = useState<Date | undefined>();
  const [hardwareInstallationDate, setHardwareInstallationDate] = useState<Date | undefined>();
  const [trainingDate, setTrainingDate] = useState<Date | undefined>();
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);
  const [deliveryConfirmedDate, setDeliveryConfirmedDate] = useState<Date | undefined>();
  const [installationConfirmed, setInstallationConfirmed] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [installationConfirmedDate, setInstallationConfirmedDate] = useState<Date | undefined>();
  const [trainingConfirmed, setTrainingConfirmed] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [trainingConfirmedDate, setTrainingConfirmedDate] = useState<Date | undefined>();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('merchantAccessToken');
      const recordData = localStorage.getItem('onboardingRecord');
      
      if (!token || !recordData) {
        navigate('/login');
        return;
      }

      setAccessToken(token);
      const record = JSON.parse(recordData);
      setOnboardingRecord(record);

      try {
        setLoading(true);
        const fetchedHolidays = await getPublicHolidays(new Date().getFullYear(), '10');
        setHolidays(fetchedHolidays.map((h: any) => new Date(h.date)));

        // Set existing dates if available
        if (record.hardwareDeliveryDate) {
          setHardwareDeliveryDate(new Date(record.hardwareDeliveryDate));
        }
        if (record.hardwareInstallationDate) {
          setHardwareInstallationDate(new Date(record.hardwareInstallationDate));
        }
        if (record.trainingDate) {
          setTrainingDate(new Date(record.trainingDate));
        }
        
        // Check if delivery is already confirmed
        if (record.deliveryConfirmed) {
          setDeliveryConfirmed(true);
          // If delivery was confirmed previously, use the confirmation date from record or fallback to current date
          setDeliveryConfirmedDate(record.deliveryConfirmedDate ? new Date(record.deliveryConfirmedDate) : new Date());
        }
        
        // Check if installation is already confirmed
        if (record.installationConfirmed) {
          setInstallationConfirmed(true);
          // If installation was confirmed previously, use the confirmation date from record or fallback to current date
          setInstallationConfirmedDate(record.installationConfirmedDate ? new Date(record.installationConfirmedDate) : new Date());
        }
        
        // Check if training is already confirmed
        if (record.trainingConfirmed) {
          setTrainingConfirmed(true);
          // If training was confirmed previously, use the confirmation date from record or fallback to current date
          setTrainingConfirmedDate(record.trainingConfirmedDate ? new Date(record.trainingConfirmedDate) : new Date());
        }
      } catch (error) {
        console.error('Error fetching holidays:', error);
        toast.error('Failed to load calendar data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const disabledDays = [
    (date: Date) => isWeekend(date),
    ...holidays
  ];

  // Create disabled days for training date picker (includes dates before minimum training date)
  const getTrainingDisabledDays = () => {
    const minTrainingDate = getMinTrainingDate();
    const baseDisabledDays = [
      (date: Date) => isWeekend(date),
      ...holidays
    ];
    
    if (minTrainingDate) {
      // Disable all dates before the minimum training date
      baseDisabledDays.push((date: Date) => date < minTrainingDate);
    }
    
    return baseDisabledDays;
  };

  // Calculate minimum training date (next working day after installation confirmation)
  const getMinTrainingDate = (): Date | undefined => {
    if (!installationConfirmed || !hardwareInstallationDate) {
      return undefined;
    }
    // Training must be scheduled at least 1 working day after the actual installation date
    return calculateMinTrainingDate(hardwareInstallationDate, holidays);
  };

  // Additional validation to prevent training before installation
  const isTrainingDateValid = (trainingDate: Date | undefined): boolean => {
    if (!trainingDate || !hardwareInstallationDate) {
      return true; // Let other validations handle this
    }
    
    const minTrainingDate = getMinTrainingDate();
    if (!minTrainingDate) {
      return true;
    }
    
    // Training date must be on or after the minimum training date
    return trainingDate >= minTrainingDate;
  };

  const handleDeliveryConfirm = async () => {
    if (!accessToken) return;

    setSaving(true);
    try {
      const confirmationDate = new Date();
      const payload = {
        deliveryConfirmed: true,
        deliveryConfirmedDate: confirmationDate.toISOString(),
      };

      const updatedRecord = await updateOnboardingByToken(accessToken, payload);
      
      // Update local storage
      localStorage.setItem('onboardingRecord', JSON.stringify(updatedRecord));
      setOnboardingRecord(updatedRecord);
      setDeliveryConfirmed(true);
      setDeliveryConfirmedDate(confirmationDate);
      
      toast.success('Delivery confirmed successfully!');
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      if (error.response?.status === 404) {
        toast.error('Access token expired. Please contact your onboarding manager.');
        localStorage.removeItem('merchantAccessToken');
        localStorage.removeItem('onboardingRecord');
        navigate('/login');
      } else {
        toast.error('Failed to confirm delivery. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInstallationConfirm = async () => {
    if (!accessToken) return;

    setSaving(true);
    try {
      const confirmationDate = new Date();
      const payload = {
        installationConfirmed: true,
        installationConfirmedDate: confirmationDate.toISOString(),
        hardwareInstallationDate: hardwareInstallationDate?.toISOString(), // Add the installation date to the payload
      };

      const updatedRecord = await updateOnboardingByToken(accessToken, payload);
      
      // Update local storage
      localStorage.setItem('onboardingRecord', JSON.stringify(updatedRecord));
      setOnboardingRecord(updatedRecord);
      setInstallationConfirmed(true);
      setInstallationConfirmedDate(confirmationDate);
      
      toast.success('Installation confirmed successfully!');
    } catch (error: any) {
      console.error('Error confirming installation:', error);
      if (error.response?.status === 404) {
        toast.error('Access token expired. Please contact your onboarding manager.');
        localStorage.removeItem('merchantAccessToken');
        localStorage.removeItem('onboardingRecord');
        navigate('/login');
      } else {
        toast.error('Failed to confirm installation. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTrainingConfirm = async () => {
    if (!accessToken) return;

    // Validate training date before confirming
    if (!isTrainingDateValid(trainingDate)) {
      toast.error('Training date must be at least one working day after the installation date.');
      return;
    }

    setSaving(true);
    try {
      const confirmationDate = new Date();
      const payload = {
        trainingConfirmed: true,
        trainingConfirmedDate: confirmationDate.toISOString(),
        trainingDate: trainingDate?.toISOString(), // Add the training date to the payload
      };

      const updatedRecord = await updateOnboardingByToken(accessToken, payload);
      
      // If training date is set and we haven't booked a training slot yet, book it now
      if (trainingDate && onboardingRecord?.id) {
        try {
          // Determine training type based on onboarding record
          const hasRemoteTraining = onboardingRecord?.onboardingTypes?.includes('remote_training');
          const hasOnsiteTraining = onboardingRecord?.onboardingTypes?.includes('onsite_training');
          
          // Default to remote if both are selected, otherwise use the available option
          const trainingType = hasOnsiteTraining && !hasRemoteTraining ? 'onsite_training' : 'remote_training';
          
          // Extract time slot from training date
          const timeSlot = format(trainingDate, 'HH:mm');
          
          const bookingData = {
            onboardingId: onboardingRecord.id,
            date: trainingDate.toISOString().split('T')[0],
            timeSlot,
            trainingType,
            location: trainingType === 'onsite_training' ? onboardingRecord?.trainingState : undefined,
            languages: onboardingRecord?.trainingPreferenceLanguages || []
          };

          // Use the merchant-specific auto-assign booking endpoint
          await bookMerchantTrainingSlot(bookingData);
          
          toast.success('Training confirmed and slot booked successfully!');
        } catch (bookingError: any) {
          console.error('Error booking training slot:', bookingError);
          
          // Provide more specific error messages
          if (bookingError.response?.status === 400) {
            const errorMessage = bookingError.response?.data?.message || 'No trainers available for your requirements';
            if (typeof errorMessage === 'string') {
              if (errorMessage.includes('No trainers available')) {
                toast.error('No trainers available for your location and language preferences. Please contact your onboarding manager for assistance.');
              } else {
                toast.error(`Training booking failed: ${errorMessage}`);
              }
            } else if (Array.isArray(errorMessage)) {
              toast.error(`Training booking failed: ${errorMessage.join(', ')}`);
            } else {
              toast.error('Training booking failed: No trainers available for your location and time slot. Please contact your onboarding manager for assistance.');
            }
          } else if (bookingError.response?.status === 404) {
            toast.error('Training booking failed: Onboarding record not found');
          } else if (bookingError.response?.status === 401) {
            toast.error('Access token expired. Please contact your onboarding manager.');
            localStorage.removeItem('merchantAccessToken');
            localStorage.removeItem('onboardingRecord');
            navigate('/login');
          } else {
            toast.error('Training booking failed. Please contact your onboarding manager for assistance.');
          }
          
          // Don't mark training as confirmed if booking fails
          setSaving(false);
          return;
        }
      } else {
        toast.success('Training confirmed successfully!');
      }
      
      // Update local storage
      localStorage.setItem('onboardingRecord', JSON.stringify(updatedRecord));
      setOnboardingRecord(updatedRecord);
      setTrainingConfirmed(true);
      setTrainingConfirmedDate(confirmationDate);
      
    } catch (error: any) {
      console.error('Error confirming training:', error);
      if (error.response?.status === 404) {
        toast.error('Access token expired. Please contact your onboarding manager.');
        localStorage.removeItem('merchantAccessToken');
        localStorage.removeItem('onboardingRecord');
        navigate('/login');
      } else {
        toast.error('Failed to confirm training. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!accessToken) return;

    // Validate training date before saving
    if (trainingDate && !isTrainingDateValid(trainingDate)) {
      toast.error('Training date must be at least one working day after the installation date.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        hardwareDeliveryDate: hardwareDeliveryDate?.toISOString(),
        hardwareInstallationDate: hardwareInstallationDate?.toISOString(),
        trainingDate: trainingDate?.toISOString(),
      };

      const updatedRecord = await updateOnboardingByToken(accessToken, payload);
      
      // If training date is set and we haven't booked a training slot yet, book it now
      if (trainingDate && onboardingRecord?.id) {
        try {
          // Determine training type based on onboarding record
          const hasRemoteTraining = onboardingRecord?.onboardingTypes?.includes('remote_training');
          const hasOnsiteTraining = onboardingRecord?.onboardingTypes?.includes('onsite_training');
          
          // Default to remote if both are selected, otherwise use the available option
          const trainingType = hasOnsiteTraining && !hasRemoteTraining ? 'onsite_training' : 'remote_training';
          
          // Extract time slot from training date
          const timeSlot = format(trainingDate, 'HH:mm');
          
          const bookingData = {
            onboardingId: onboardingRecord.id,
            date: trainingDate.toISOString().split('T')[0],
            timeSlot,
            trainingType,
            location: trainingType === 'onsite_training' ? onboardingRecord?.trainingState : undefined,
            languages: onboardingRecord?.trainingPreferenceLanguages || []
          };

          // Use the merchant-specific auto-assign booking endpoint
          await bookMerchantTrainingSlot(bookingData);
          
          toast.success('Schedule updated and training slot booked successfully!');
        } catch (bookingError: any) {
          console.error('Error booking training slot:', bookingError);
          
          // Provide more specific error messages
          if (bookingError.response?.status === 400) {
            const errorMessage = bookingError.response?.data?.message || 'No trainers available for your requirements';
            if (typeof errorMessage === 'string') {
              if (errorMessage.includes('No trainers available')) {
                toast.error('No trainers available for your location and language preferences. Please contact your onboarding manager for assistance.');
              } else {
                toast.error(`Training booking failed: ${errorMessage}`);
              }
            } else if (Array.isArray(errorMessage)) {
              toast.error(`Training booking failed: ${errorMessage.join(', ')}`);
            } else {
              toast.error('Training booking failed: No trainers available for your location and time slot. Please contact your onboarding manager for assistance.');
            }
          } else if (bookingError.response?.status === 404) {
            toast.error('Training booking failed: Onboarding record not found');
          } else if (bookingError.response?.status === 401) {
            toast.error('Access token expired. Please contact your onboarding manager.');
            localStorage.removeItem('merchantAccessToken');
            localStorage.removeItem('onboardingRecord');
            navigate('/login');
          } else {
            toast.error('Schedule updated, but failed to book training slot. Please contact your onboarding manager for assistance.');
          }
          
          // Log detailed error information for debugging
          const hasOnsiteTraining = onboardingRecord?.trainingPreferenceMode?.includes('onsite_training');
          const hasRemoteTraining = onboardingRecord?.trainingPreferenceMode?.includes('remote_training');
          console.log('Training booking failed with requirements:', {
            trainingType: hasOnsiteTraining && !hasRemoteTraining ? 'onsite_training' : 'remote_training',
            location: (hasOnsiteTraining && !hasRemoteTraining) ? onboardingRecord?.trainingState : undefined,
            languages: onboardingRecord?.trainingPreferenceLanguages || [],
            timeSlot: format(trainingDate, 'HH:mm'),
            date: trainingDate.toISOString().split('T')[0]
          });
        }
      } else {
        toast.success('Schedule updated successfully!');
      }
      
      // Update local storage
      localStorage.setItem('onboardingRecord', JSON.stringify(updatedRecord));
      setOnboardingRecord(updatedRecord);
      
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      if (error.response?.status === 404) {
        toast.error('Access token expired. Please contact your onboarding manager.');
        localStorage.removeItem('merchantAccessToken');
        localStorage.removeItem('onboardingRecord');
        navigate('/login');
      } else {
        toast.error('Failed to save schedule. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('merchantAccessToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('onboardingRecord');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your onboarding details...</p>
        </div>
      </div>
    );
  }

  if (!onboardingRecord) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No onboarding record found</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">My Onboarding</h1>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Merchant Info */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact Information</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700">Account Name:</span>
              <span className="ml-2 text-gray-900">{onboardingRecord.accountName}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <span className="ml-2 text-gray-900">{onboardingRecord.picName}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <span className="ml-2 text-gray-900">{onboardingRecord.picEmail}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Phone:</span>
              <span className="ml-2 text-gray-900">{onboardingRecord.picPhone}</span>
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule Your Onboarding</h2>
          <p className="text-sm text-gray-600 mb-6">
            Please select your preferred dates and times for each step of your onboarding process.
          </p>

          <div className="space-y-4">
            <DeliveryConfirmation
              onboardingRecord={onboardingRecord}
              onConfirm={handleDeliveryConfirm}
              isConfirmed={deliveryConfirmed}
            />
            
            {!installationConfirmed ? (
              <MobileDatePicker
                label="Hardware Installation Date & Time"
                selectedDate={hardwareInstallationDate}
                onDateChange={setHardwareInstallationDate}
                minDate={deliveryConfirmed && deliveryConfirmedDate && onboardingRecord?.deliveryState 
                  ? calculateMinInstallationDate(deliveryConfirmedDate, onboardingRecord.deliveryState)
                  : undefined}
                disabledDays={disabledDays}
                disabled={!deliveryConfirmed}
                includeTime={true}
              />
            ) : null}
            
            <InstallationConfirmation
              onboardingRecord={onboardingRecord}
              onConfirm={handleInstallationConfirm}
              isConfirmed={installationConfirmed}
              installationDate={hardwareInstallationDate}
              disabled={saving}
            />
            
            {!trainingConfirmed ? (
              <>
                <MobileDatePicker
                  label="Training Date & Time"
                  selectedDate={trainingDate}
                  onDateChange={setTrainingDate}
                  minDate={getMinTrainingDate()}
                  disabledDays={getTrainingDisabledDays()}
                  disabled={!installationConfirmed}
                  includeTime={true}
                  onboardingRecord={onboardingRecord}
                  checkAvailability={true}
                />
                {trainingDate && !isTrainingDateValid(trainingDate) && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-red-500 mr-2">⚠️</span>
                      <span className="text-sm text-red-700">
                        Training date must be at least one working day after the installation date ({hardwareInstallationDate ? format(hardwareInstallationDate, 'PPP') : 'TBD'}).
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : null}
            
            <TrainingConfirmation
              onboardingRecord={onboardingRecord}
              onConfirm={handleTrainingConfirm}
              isConfirmed={trainingConfirmed}
              trainingDate={trainingDate}
              disabled={saving}
            />
          </div>

          <div className="mt-6 text-xs text-gray-500">
            <p>• Weekends and public holidays are not available</p>
            <p>• Confirm delivery before scheduling installation</p>
            <p>• Installation must be scheduled after delivery confirmation</p>
            <p>• Confirm installation before scheduling training</p>
            <p>• Training must be scheduled at least one working day after the installation date</p>
            <p>• Confirm training before completing the onboarding</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="sticky bottom-0 bg-white border-t p-4 -mx-4">
          <button
            onClick={handleSaveSchedule}
            disabled={saving || !deliveryConfirmed || !installationConfirmed || !trainingDate || !trainingConfirmed}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MerchantSchedulePage; 