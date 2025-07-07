import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { toast } from 'react-hot-toast';
import { format, isWeekend, set } from 'date-fns';
import { updateOnboardingByToken, getPublicHolidays } from '../services/api';

// Mobile-friendly Date Picker component
const MobileDatePicker = ({ 
  label, 
  selectedDate, 
  onDateChange, 
  minDate, 
  disabledDays, 
  disabled = false, 
  includeTime = false 
}: {
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
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <button
        ref={buttonRef}
        type="button"
        className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
          disabled 
            ? 'bg-gray-100 border-gray-200 text-gray-400' 
            : 'bg-white border-gray-300 hover:border-blue-500 focus:border-blue-500'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        {selectedDate ? (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{format(selectedDate, 'PPP')}</span>
            {includeTime && (
              <span className="text-sm text-blue-600 mt-1">{format(selectedDate, 'HH:mm')}</span>
            )}
          </div>
        ) : (
          <span className="text-gray-500">
            {disabled ? 'Please select previous date first' : `Select ${includeTime ? 'date & time' : 'date'}`}
          </span>
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
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <button
                type="button"
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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

  const handleSaveSchedule = async () => {
    if (!accessToken) return;

    setSaving(true);
    try {
      const payload = {
        hardwareDeliveryDate: hardwareDeliveryDate?.toISOString(),
        hardwareInstallationDate: hardwareInstallationDate?.toISOString(),
        trainingDate: trainingDate?.toISOString(),
      };

      const updatedRecord = await updateOnboardingByToken(accessToken, payload);
      
      // Update local storage
      localStorage.setItem('onboardingRecord', JSON.stringify(updatedRecord));
      setOnboardingRecord(updatedRecord);
      
      toast.success('Schedule updated successfully!');
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
            <MobileDatePicker
              label="Hardware Delivery Date"
              selectedDate={hardwareDeliveryDate}
              onDateChange={setHardwareDeliveryDate}
              disabledDays={disabledDays}
              includeTime={false}
            />
            
            <MobileDatePicker
              label="Hardware Installation Date & Time"
              selectedDate={hardwareInstallationDate}
              onDateChange={setHardwareInstallationDate}
              minDate={hardwareDeliveryDate}
              disabledDays={disabledDays}
              disabled={!hardwareDeliveryDate}
              includeTime={true}
            />
            
            <MobileDatePicker
              label="Training Date & Time"
              selectedDate={trainingDate}
              onDateChange={setTrainingDate}
              minDate={hardwareInstallationDate}
              disabledDays={disabledDays}
              disabled={!hardwareInstallationDate}
              includeTime={true}
            />
          </div>

          <div className="mt-6 text-xs text-gray-500">
            <p>• Weekends and public holidays are not available</p>
            <p>• Installation must be scheduled after delivery</p>
            <p>• Training must be scheduled after installation</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="sticky bottom-0 bg-white border-t p-4 -mx-4">
          <button
            onClick={handleSaveSchedule}
            disabled={saving || !hardwareDeliveryDate || !hardwareInstallationDate || !trainingDate}
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