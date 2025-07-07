import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { toast } from 'react-hot-toast';
import { format, isWeekend, set } from 'date-fns';
import { getOnboardingRecordById, getPublicHolidays, updateOnboardingRecord } from '../services/api';
import { DELIVERY_TIME_BY_STATE, calculateMinInstallationDate } from '../utils/constants';

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

      <div className="space-y-6">
        <DeliveryConfirmation
          onboardingRecord={record}
          onConfirm={handleDeliveryConfirm}
          isConfirmed={deliveryConfirmed}
        />
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
        <CustomDatePicker
          label="Training Date & Time"
          selectedDate={trainingDate}
          onDateChange={setTrainingDate}
          minDate={hardwareInstallationDate}
          disabledDays={disabledDays}
          disabled={!hardwareInstallationDate}
          includeTime={true}
        />
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
          disabled={!deliveryConfirmed || !hardwareInstallationDate || !trainingDate}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Schedule
        </button>
      </div>
    </div>
  );
};

export default ScheduleOnboardingPage; 