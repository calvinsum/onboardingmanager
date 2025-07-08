import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isWeekend } from 'date-fns';
import { toast } from 'react-hot-toast';

interface AvailableSlot {
  timeSlot: string;
  availableTrainers: {
    id: string;
    name: string;
    languages: string[];
    locations: string[];
  }[];
}

interface TrainingSchedulerProps {
  onboardingRecord: any;
  onSlotSelected: (date: Date, timeSlot: string) => void; // Removed trainerId parameter
  disabled?: boolean;
  minDate?: Date;
  holidays?: Date[];
}

const TrainingScheduler: React.FC<TrainingSchedulerProps> = ({
  onboardingRecord,
  onSlotSelected,
  disabled = false,
  minDate,
  holidays = []
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

  // Determine training type and requirements from onboarding record
  const getTrainingRequirements = () => {
    const hasRemoteTraining = onboardingRecord?.onboardingTypes?.includes('remote_training');
    const hasOnsiteTraining = onboardingRecord?.onboardingTypes?.includes('onsite_training');
    
    // Default to remote if both are selected (user can choose)
    const trainingType = hasOnsiteTraining ? 'onsite_training' : 'remote_training';
    
    return {
      trainingType,
      location: trainingType === 'onsite_training' ? onboardingRecord?.trainingState : undefined,
      languages: onboardingRecord?.trainingPreferenceLanguages || [],
      hasRemoteOption: hasRemoteTraining,
      hasOnsiteOption: hasOnsiteTraining
    };
  };

  const [trainingMode, setTrainingMode] = useState<'remote_training' | 'onsite_training'>('remote_training');

  const requirements = getTrainingRequirements();

  useEffect(() => {
    // Set initial training mode based on available options
    if (requirements.hasOnsiteOption && !requirements.hasRemoteOption) {
      setTrainingMode('onsite_training');
    } else {
      setTrainingMode('remote_training');
    }
  }, [requirements.hasOnsiteOption, requirements.hasRemoteOption]);

  const fetchAvailableSlots = async (date: Date) => {
    if (!date) return;

    setLoading(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const location = trainingMode === 'onsite_training' ? requirements.location : undefined;
      const languages = requirements.languages.length > 0 ? requirements.languages.join(',') : undefined;
      
      const params = new URLSearchParams({
        date: dateStr,
        trainingType: trainingMode
      });
      
      if (location) params.append('location', location);
      if (languages) params.append('languages', languages);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/training-slots/availability?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
      }

      const slots = await response.json();
      setAvailableSlots(slots);
      setSelectedTimeSlot('');
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast.error('Failed to load available time slots');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      fetchAvailableSlots(date);
    } else {
      setAvailableSlots([]);
      setSelectedTimeSlot('');
    }
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
  };

  const handleConfirmBooking = () => {
    if (selectedDate && selectedTimeSlot) {
      onSlotSelected(selectedDate, selectedTimeSlot); // No trainerId passed
    }
  };

  const disabledDays = [
    (date: Date) => isWeekend(date),
    ...holidays
  ];

  const canSelectTrainingMode = requirements.hasRemoteOption && requirements.hasOnsiteOption;

  return (
    <div className="space-y-6">
      {/* Training Mode Selection */}
      {canSelectTrainingMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Training Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="remote_training"
                checked={trainingMode === 'remote_training'}
                onChange={(e) => {
                  setTrainingMode(e.target.value as 'remote_training');
                  if (selectedDate) fetchAvailableSlots(selectedDate);
                }}
                className="mr-2"
              />
              Remote Training
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="onsite_training"
                checked={trainingMode === 'onsite_training'}
                onChange={(e) => {
                  setTrainingMode(e.target.value as 'onsite_training');
                  if (selectedDate) fetchAvailableSlots(selectedDate);
                }}
                className="mr-2"
              />
              Onsite Training
            </label>
          </div>
        </div>
      )}

      {/* Training Requirements Display */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Training Requirements</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Type:</strong> {trainingMode === 'remote_training' ? 'Remote Training' : 'Onsite Training'}</p>
          {trainingMode === 'onsite_training' && requirements.location && (
            <p><strong>Location:</strong> {requirements.location}</p>
          )}
          {requirements.languages.length > 0 && (
            <p><strong>Languages:</strong> {requirements.languages.join(', ')}</p>
          )}
        </div>
      </div>

      {/* Auto-Assignment Notice */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-green-800">Automatic Trainer Assignment</h4>
            <p className="text-sm text-green-700">
              Our system will automatically assign the best available trainer based on your requirements and ensure fair distribution.
            </p>
          </div>
        </div>
      </div>

      {/* Date Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Training Date
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            fromDate={minDate || new Date()}
            disabled={disabledDays}
            className="mx-auto"
          />
        </div>
      </div>

      {/* Time Slot Selection */}
      {selectedDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Time Slots for {format(selectedDate, 'PPP')}
          </label>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading available slots...</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No available time slots for this date
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableSlots.map((slot) => (
                <button
                  key={slot.timeSlot}
                  onClick={() => handleTimeSlotSelect(slot.timeSlot)}
                  className={`p-3 rounded-lg border text-center ${
                    selectedTimeSlot === slot.timeSlot
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium">{slot.timeSlot}</div>
                  <div className="text-xs text-gray-500">
                    {slot.availableTrainers.length} trainer{slot.availableTrainers.length !== 1 ? 's' : ''} available
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm Booking Button */}
      {selectedDate && selectedTimeSlot && (
        <div className="pt-4">
          <button
            onClick={handleConfirmBooking}
            disabled={disabled}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Training Booking
            <div className="text-sm mt-1 opacity-90">
              System will automatically assign the best trainer
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default TrainingScheduler; 