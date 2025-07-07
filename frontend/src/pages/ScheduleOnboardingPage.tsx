import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { default as DatePicker } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-hot-toast';
import { getOnboardingRecordById, getPublicHolidays, updateOnboardingRecord } from '../services/api';
import { isWeekend } from 'date-fns';

const ScheduleOnboardingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<any>(null);
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);

  // Schedule dates
  const [hardwareDeliveryDate, setHardwareDeliveryDate] = useState<Date | null>(null);
  const [hardwareInstallationDate, setHardwareInstallationDate] = useState<Date | null>(null);
  const [trainingDate, setTrainingDate] = useState<Date | null>(null);

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

        // Initialize dates from record if they exist
        if (fetchedRecord.hardwareDeliveryDate) {
          setHardwareDeliveryDate(new Date(fetchedRecord.hardwareDeliveryDate));
        }
        if (fetchedRecord.hardwareInstallationDate) {
          setHardwareInstallationDate(new Date(fetchedRecord.hardwareInstallationDate));
        }
        if (fetchedRecord.trainingDate) {
          setTrainingDate(new Date(fetchedRecord.trainingDate));
        }

      } catch (error) {
        toast.error('Failed to fetch data.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const isHoliday = (date: Date) => {
    return holidays.some(holiday => holiday.toDateString() === date.toDateString());
  };

  const filterNonWorkdays = (date: Date) => {
    return !isWeekend(date) && !isHoliday(date);
  };

  const handleSaveSchedule = async () => {
    if (!id) return;
    try {
      const payload = {
        hardwareDeliveryDate,
        hardwareInstallationDate,
        trainingDate,
      };
      await updateOnboardingRecord(id, payload);
      toast.success('Schedule updated successfully!');
      navigate('/onboarding-manager');
    } catch (error) {
      toast.error('Failed to save schedule.');
      console.error(error);
    }
  };

  if (loading) {
    return <div className="container mx-auto mt-10 p-6">Loading...</div>;
  }

  if (!record) {
    return <div className="container mx-auto mt-10 p-6">Record not found.</div>;
  }

  return (
    <div className="container mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Schedule Onboarding for {record.picName}</h1>
      <p className="text-gray-600 mb-6">PIC Email: {record.picEmail}</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hardware Delivery Date</label>
          <DatePicker
            selected={hardwareDeliveryDate}
            onChange={(date: Date | null) => setHardwareDeliveryDate(date)}
            filterDate={filterNonWorkdays}
            minDate={new Date()} // Can't schedule in the past
            placeholderText="Select delivery date"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hardware Installation Date</label>
          <DatePicker
            selected={hardwareInstallationDate}
            onChange={(date: Date | null) => setHardwareInstallationDate(date)}
            filterDate={filterNonWorkdays}
            minDate={hardwareDeliveryDate || new Date()} // Must be after delivery
            disabled={!hardwareDeliveryDate}
            placeholderText="Select installation date"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Training Date</label>
          <DatePicker
            selected={trainingDate}
            onChange={(date: Date | null) => setTrainingDate(date)}
            filterDate={filterNonWorkdays}
            minDate={hardwareInstallationDate || new Date()} // Must be after installation
            disabled={!hardwareInstallationDate}
            placeholderText="Select training date"
            className="w-full p-2 border border-gray-300 rounded-md"
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
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Save Schedule
        </button>
      </div>
    </div>
  );
};

export default ScheduleOnboardingPage; 