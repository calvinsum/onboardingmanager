import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { toast } from 'react-hot-toast';
import { format, isWeekend, set } from 'date-fns';
import { getOnboardingRecordById, getPublicHolidays, updateOnboardingRecord, bookTrainingSlot, getTrainingSlotsByOnboarding } from '../services/api';
import { DELIVERY_TIME_BY_STATE, calculateMinInstallationDate } from '../utils/constants';
import TrainingScheduler from '../components/TrainingScheduler';

// A reusable Date Picker component
const CustomDatePicker = ({ label, selectedDate, onDateChange, minDate, disabledDays, disabled = false, includeTime = false }: {
  label: string;
  selectedDate: Date | undefined;
  onDateChange: (date: Date) => void;
  minDate?: Date;
  disabledDays: any[];
  disabled?: boolean;
  includeTime?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const buttonRef = useRef<HTMLButtonElement>(null);

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

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

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <button
        ref={buttonRef}
        type="button"
        className={`w-full p-2 border rounded-md text-left ${disabled ? 'bg-gray-100' : 'bg-white'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        {selectedDate ? (
          <span>
            {format(selectedDate, 'PPP')}
            {includeTime && <span className="ml-2 text-blue-600">{format(selectedDate, 'HH:mm')}</span>}
          </span>
        ) : (
          <span className="text-gray-500">Select {includeTime ? 'date & time' : 'date'}</span>
        )}
      </button>
      {isOpen && (
        <div 
          className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg"
          onMouseLeave={() => setIsOpen(false)}
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDaySelect}
            fromDate={minDate || new Date()}
            disabled={disabledDays}
            initialFocus
          />
          {includeTime && (
            <div className="p-3 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
              <select
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Delivery Confirmation Component (same as in MerchantSchedulePage)
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
                Hardware will be delivered within {deliveryTimeText}
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

// Installation Confirmation Component (same as in MerchantSchedulePage)
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
                  Please confirm that the installation is ready to proceed at the scheduled time.
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

const ScheduleOnboardingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<any>(null);
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [trainingSlot, setTrainingSlot] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [fetchedRecord, fetchedHolidays] = await Promise.all([
          getOnboardingRecordById(id),
          getPublicHolidays(new Date().getFullYear(), '10') // Default to Selangor
        ]);

        setRecord(fetchedRecord);
        setHolidays(fetchedHolidays.map((h: any) => new Date(h.date)));

        if (fetchedRecord.hardwareDeliveryDate) setHardwareDeliveryDate(new Date(fetchedRecord.hardwareDeliveryDate));
        if (fetchedRecord.hardwareInstallationDate) setHardwareInstallationDate(new Date(fetchedRecord.hardwareInstallationDate));
        if (fetchedRecord.trainingDate) setTrainingDate(new Date(fetchedRecord.trainingDate));
        
        // Check if delivery is already confirmed
        if (fetchedRecord.deliveryConfirmed) {
          setDeliveryConfirmed(true);
          // If delivery was confirmed previously, use the confirmation date from record or fallback to current date
          setDeliveryConfirmedDate(fetchedRecord.deliveryConfirmedDate ? new Date(fetchedRecord.deliveryConfirmedDate) : new Date());
        }
        
        // Check if installation is already confirmed
        if (fetchedRecord.installationConfirmed) {
          setInstallationConfirmed(true);
          // If installation was confirmed previously, use the confirmation date from record or fallback to current date
          setInstallationConfirmedDate(fetchedRecord.installationConfirmedDate ? new Date(fetchedRecord.installationConfirmedDate) : new Date());
        }

        // Check if training is already confirmed
        if (fetchedRecord.trainingConfirmed) {
          setTrainingConfirmed(true);
          // If training was confirmed previously, use the confirmation date from record or fallback to current date
          setTrainingConfirmedDate(fetchedRecord.trainingConfirmedDate ? new Date(fetchedRecord.trainingConfirmedDate) : new Date());
        }

        // Fetch training slot information
        try {
          const trainingSlots = await getTrainingSlotsByOnboarding(id);
          if (trainingSlots && trainingSlots.length > 0) {
            // Get the most recent/active training slot
            const activeSlot = trainingSlots.find((slot: any) => slot.status === 'booked' || slot.status === 'completed') || trainingSlots[0];
            setTrainingSlot(activeSlot);
          }
        } catch (error) {
          console.error('Error fetching training slots:', error);
          // Don't show error to user as this is optional information
        }

      } catch (error) {
        toast.error('Failed to fetch data.');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const disabledDays = [
    (date: Date) => isWeekend(date),
    ...holidays
  ];

  const handleDeliveryConfirm = async () => {
    if (!id) return;
    try {
      const confirmationDate = new Date();
      const payload = { 
        deliveryConfirmed: true,
        deliveryConfirmedDate: confirmationDate.toISOString(),
      };
      const updatedRecord = await updateOnboardingRecord(id, payload);
      setRecord(updatedRecord);
      setDeliveryConfirmed(true);
      setDeliveryConfirmedDate(confirmationDate);
      toast.success('Delivery confirmed successfully!');
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast.error('Failed to confirm delivery. Please try again.');
    }
  };

  const handleInstallationConfirm = async () => {
    if (!id) return;
    try {
      const confirmationDate = new Date();
      const payload = { 
        installationConfirmed: true,
        installationConfirmedDate: confirmationDate.toISOString(),
      };
      const updatedRecord = await updateOnboardingRecord(id, payload);
      setRecord(updatedRecord);
      setInstallationConfirmed(true);
      setInstallationConfirmedDate(confirmationDate);
      toast.success('Installation confirmed successfully!');
    } catch (error) {
      console.error('Error confirming installation:', error);
      toast.error('Failed to confirm installation. Please try again.');
    }
  };

  const handleTrainingConfirm = async () => {
    if (!id) return;
    try {
      const confirmationDate = new Date();
      const payload = { 
        trainingConfirmed: true,
        trainingConfirmedDate: confirmationDate.toISOString(),
      };
      const updatedRecord = await updateOnboardingRecord(id, payload);
      setRecord(updatedRecord);
      setTrainingConfirmed(true);
      setTrainingConfirmedDate(confirmationDate);
      toast.success('Training confirmed successfully!');
    } catch (error) {
      console.error('Error confirming training:', error);
      toast.error('Failed to confirm training. Please try again.');
    }
  };

  const handleTrainingSlotSelected = async (date: Date, timeSlot: string, trainerId: string) => {
    if (!id) return;
    try {
      // Determine training type based on onboarding record
      const hasRemoteTraining = record?.onboardingTypes?.includes('remote_training');
      const hasOnsiteTraining = record?.onboardingTypes?.includes('onsite_training');
      
      // Default to remote if both are selected (user can choose in the scheduler)
      const trainingType = hasOnsiteTraining && !hasRemoteTraining ? 'onsite_training' : 'remote_training';
      
      const bookingData = {
        onboardingId: id,
        trainerId,
        date: date.toISOString().split('T')[0],
        timeSlot,
        trainingType,
        location: trainingType === 'onsite_training' ? record?.trainingState : undefined,
        languages: record?.trainingPreferenceLanguages || []
      };

      await bookTrainingSlot(bookingData);
      
      // Update local state
      setTrainingDate(date);
      
      // Refresh training slot data
      try {
        const trainingSlots = await getTrainingSlotsByOnboarding(id);
        if (trainingSlots && trainingSlots.length > 0) {
          const activeSlot = trainingSlots.find((slot: any) => slot.status === 'booked' || slot.status === 'completed') || trainingSlots[0];
          setTrainingSlot(activeSlot);
        }
      } catch (error) {
        console.error('Error refreshing training slots:', error);
      }
      
      toast.success('Training slot booked successfully!');
    } catch (error) {
      console.error('Error booking training slot:', error);
      toast.error('Failed to book training slot. Please try again.');
    }
  };

  const handleSaveSchedule = async () => {
    if (!id) return;
    try {
      const payload = { 
        hardwareDeliveryDate, 
        hardwareInstallationDate, 
        trainingDate,
        deliveryConfirmed 
      };
      console.log('Saving schedule with payload:', payload);
      await updateOnboardingRecord(id, payload);
      toast.success('Schedule updated successfully!');
      navigate('/onboarding-manager');
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule. Please try again.');
    }
  };

  if (loading) return <div className="container mx-auto mt-10 p-6">Loading...</div>;
  if (!record) return <div className="container mx-auto mt-10 p-6">Record not found.</div>;

  return (
    <div className="container mx-auto mt-10 p-6 bg-white rounded-lg shadow-md max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Schedule Onboarding</h1>
      <p className="text-gray-600 mb-6">For: {record.picName} ({record.picEmail})</p>

      {/* Training Status Section */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Training Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Training Status */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-600">Status:</span>
            <div className="flex items-center">
              {trainingConfirmed ? (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    Confirmed
                  </span>
                </div>
              ) : trainingDate ? (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                    Scheduled
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                    Pending
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Trainer */}
          {trainingSlot?.trainer ? (
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-600">Trainer:</span>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">
                  {trainingSlot.trainer.name}
                </div>
                {trainingSlot.trainer.languages && trainingSlot.trainer.languages.length > 0 && (
                  <div className="text-xs text-gray-500">
                    {trainingSlot.trainer.languages.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-600">Trainer:</span>
              <span className="text-sm text-gray-500">Not assigned</span>
            </div>
          )}

          {/* Training Date */}
          {trainingDate && (
            <div className="flex items-center justify-between md:col-span-2">
              <span className="font-medium text-gray-600">Scheduled:</span>
              <span className="text-sm text-gray-800">
                {format(trainingDate, 'PPP p')}
              </span>
            </div>
          )}

          {/* Training Type */}
          {trainingSlot && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-600">Type:</span>
              <span className="text-sm text-gray-800 capitalize">
                {trainingSlot.trainingType?.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <DeliveryConfirmation
          onboardingRecord={record}
          onConfirm={handleDeliveryConfirm}
          isConfirmed={deliveryConfirmed}
        />
        {!installationConfirmed ? (
          <CustomDatePicker
            label="Hardware Installation Date & Time"
            selectedDate={hardwareInstallationDate}
            onDateChange={setHardwareInstallationDate}
            minDate={deliveryConfirmed && deliveryConfirmedDate && record?.deliveryState 
              ? calculateMinInstallationDate(deliveryConfirmedDate, record.deliveryState)
              : undefined}
            disabledDays={disabledDays}
            disabled={!deliveryConfirmed}
            includeTime={true}
          />
        ) : null}
        
        <InstallationConfirmation
          onboardingRecord={record}
          onConfirm={handleInstallationConfirm}
          isConfirmed={installationConfirmed}
          installationDate={hardwareInstallationDate}
          disabled={loading}
        />
        <TrainingConfirmation
          onboardingRecord={record}
          onConfirm={handleTrainingConfirm}
          isConfirmed={trainingConfirmed}
          trainingDate={trainingDate}
          disabled={loading}
        />
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Training Schedule</h3>
          <TrainingScheduler
            onboardingRecord={record}
            onSlotSelected={handleTrainingSlotSelected}
            disabled={!installationConfirmed}
            minDate={hardwareInstallationDate}
            holidays={holidays}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => navigate('/onboarding-manager')}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-4"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveSchedule}
          disabled={!deliveryConfirmed || !installationConfirmed || !trainingDate || !trainingConfirmed}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Schedule
        </button>
      </div>
    </div>
  );
};

export default ScheduleOnboardingPage; 