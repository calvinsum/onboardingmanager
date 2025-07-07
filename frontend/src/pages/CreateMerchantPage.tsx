import React from 'react';
import CreateMerchantForm from '../components/CreateMerchantForm';
import Layout from '../components/Layout';

const CreateMerchantPage: React.FC = () => {
  return (
    <Layout>
      <div className="p-6">
        <CreateMerchantForm />
      </div>
    </Layout>
  );
};

export default CreateMerchantPage; 