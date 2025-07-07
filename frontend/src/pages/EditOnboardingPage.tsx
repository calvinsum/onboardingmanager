import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getOnboardingRecordById, updateOnboardingRecord } from '../services/api';
import CreateMerchantForm from '../components/CreateMerchantForm'; // Reusing the form component

const EditOnboardingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchRecord = async () => {
      try {
        setLoading(true);
        const record = await getOnboardingRecordById(id);
        // Format date for the form input
        if (record.expectedGoLiveDate) {
          record.expectedGoLiveDate = new Date(record.expectedGoLiveDate).toISOString().split('T')[0];
        }
        setInitialData(record);
      } catch (error) {
        toast.error('Failed to fetch onboarding record details.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [id]);

  const handleSubmit = async (formData: any) => {
    if (!id) return;
    try {
      await updateOnboardingRecord(id, formData);
      toast.success('Onboarding record updated successfully!');
      navigate('/manager-dashboard');
    } catch (error) {
      toast.error('Failed to update onboarding record.');
      console.error(error);
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  if (!initialData) {
    return <div className="text-center mt-10">Record not found.</div>;
  }

  return (
    <div className="container mx-auto mt-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Onboarding Record</h1>
      <CreateMerchantForm
        onSubmit={handleSubmit}
        initialData={initialData}
        isEditMode={true}
      />
    </div>
  );
};

export default EditOnboardingPage; 