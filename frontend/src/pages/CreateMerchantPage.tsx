import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import CreateMerchantForm from '../components/CreateMerchantForm';
import { createMerchantOnboarding } from '../services/api';

const CreateMerchantPage = () => {
  const navigate = useNavigate();

  const handleSubmit = async (formData: any) => {
    try {
      const newRecord = await createMerchantOnboarding(formData);
      toast.success(
        `Onboarding record created! Token: ${newRecord.accessToken}`,
        { duration: 6000 }
      );
      navigate('/onboarding-manager');
    } catch (error) {
      toast.error('Failed to create onboarding record.');
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto mt-10">
      <CreateMerchantForm onSubmit={handleSubmit} />
    </div>
  );
};

export default CreateMerchantPage; 