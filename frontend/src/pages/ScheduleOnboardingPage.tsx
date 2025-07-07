import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { toast } from 'react-hot-toast';
import { format, isWeekend, set } from 'date-fns';
import { getOnboardingRecordById, getPublicHolidays, updateOnboardingRecord } from '../services/api';

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

const ScheduleOnboardingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<any>(null);
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);

  const [hardwareDeliveryDate, setHardwareDeliveryDate] = useState<Date | undefined>();
  const [hardwareInstallationDate, setHardwareInstallationDate] = useState<Date | undefined>();
  const [trainingDate, setTrainingDate] = useState<Date | undefined>();

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

  const handleSaveSchedule = async () => {
    if (!id) return;
    try {
      const payload = { hardwareDeliveryDate, hardwareInstallationDate, trainingDate };
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
        <CustomDatePicker
          label="Hardware Delivery Date"
          selectedDate={hardwareDeliveryDate}
          onDateChange={setHardwareDeliveryDate}
          disabledDays={disabledDays}
          includeTime={false}
        />
        <CustomDatePicker
          label="Hardware Installation Date & Time"
          selectedDate={hardwareInstallationDate}
          onDateChange={setHardwareInstallationDate}
          minDate={hardwareDeliveryDate}
          disabledDays={disabledDays}
          disabled={!hardwareDeliveryDate}
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
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Save Schedule
        </button>
      </div>
    </div>
  );
};

export default ScheduleOnboardingPage; 