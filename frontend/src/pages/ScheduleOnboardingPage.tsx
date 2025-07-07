import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { toast } from 'react-hot-toast';
import { format, isWeekend } from 'date-fns';
import { getOnboardingRecordById, getPublicHolidays, updateOnboardingRecord } from '../services/api';

// A reusable Date Picker component
const CustomDatePicker = ({ label, selectedDate, onDateChange, minDate, disabledDays, disabled = false }: {
  label: string;
  selectedDate: Date | undefined;
  onDateChange: (date: Date) => void;
  minDate?: Date;
  disabledDays: any[];
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleDaySelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
    }
    setIsOpen(false);
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
        {selectedDate ? format(selectedDate, 'PPP') : <span className="text-gray-500">Select date</span>}
      </button>
      {isOpen && (
        <div 
          className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg"
          // Simple way to handle clicks outside
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
      await updateOnboardingRecord(id, payload);
      toast.success('Schedule updated successfully!');
      navigate('/onboarding-manager');
    } catch (error) {
      toast.error('Failed to save schedule.');
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
        />
        <CustomDatePicker
          label="Hardware Installation Date"
          selectedDate={hardwareInstallationDate}
          onDateChange={setHardwareInstallationDate}
          minDate={hardwareDeliveryDate}
          disabledDays={disabledDays}
          disabled={!hardwareDeliveryDate}
        />
        <CustomDatePicker
          label="Training Date"
          selectedDate={trainingDate}
          onDateChange={setTrainingDate}
          minDate={hardwareInstallationDate}
          disabledDays={disabledDays}
          disabled={!hardwareInstallationDate}
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