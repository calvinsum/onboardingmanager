import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getOnboardingRecordById } from '../services/api';

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
  <div className="py-2">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900">{value || '-'}</dd>
  </div>
);

const AddressDetails = ({ title, address }: { title: string, address: any }) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-2">{title}</h3>
    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
      <DetailItem label="Address Line 1" value={address.address1} />
      <DetailItem label="Address Line 2" value={address.address2} />
      <DetailItem label="City" value={address.city} />
      <DetailItem label="State" value={address.state} />
      <DetailItem label="Postal Code" value={address.postalCode} />
      <DetailItem label="Country" value={address.country} />
    </dl>
  </div>
);

const ViewOnboardingPage = () => {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchRecord = async () => {
      try {
        setLoading(true);
        const fetchedRecord = await getOnboardingRecordById(id);
        setRecord(fetchedRecord);
      } catch (error) {
        toast.error('Failed to fetch record details.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [id]);

  if (loading) {
    return <div className="text-center mt-20">Loading record...</div>;
  }

  if (!record) {
    return <div className="text-center mt-20">Record not found.</div>;
  }
  
  const deliveryAddress = {
    address1: record.deliveryAddress1,
    address2: record.deliveryAddress2,
    city: record.deliveryCity,
    state: record.deliveryState,
    postalCode: record.deliveryPostalCode,
    country: record.deliveryCountry,
  };

  const trainingAddress = record.useSameAddressForTraining ? deliveryAddress : {
    address1: record.trainingAddress1,
    address2: record.trainingAddress2,
    city: record.trainingCity,
    state: record.trainingState,
    postalCode: record.trainingPostalCode,
    country: record.trainingCountry,
  };

  return (
    <div className="container mx-auto mt-10 p-8 bg-white rounded-lg shadow-xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Onboarding Record Details</h1>
          <p className="text-gray-500">Record ID: {record.id}</p>
        </div>
        <Link to="/manager-dashboard" className="text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="space-y-8">
        {/* Main Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-2">Key Information</h3>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
            <DetailItem label="Status" value={<span className={`px-2 py-1 text-xs font-semibold rounded-full ${ record.status === 'completed' ? 'bg-green-200 text-green-800' : record.status === 'in_progress' ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-800' }`}>{record.status}</span>} />
            <DetailItem label="Expected Go-Live Date" value={new Date(record.expectedGoLiveDate).toLocaleDateString()} />
            <DetailItem label="Created On" value={new Date(record.createdAt).toLocaleString()} />
            <DetailItem label="Access Token" value={<span className="font-mono bg-gray-100 px-2 py-1 rounded">{record.accessToken}</span>} />
            <DetailItem label="Token Expires On" value={new Date(record.tokenExpiryDate).toLocaleString()} />
          </dl>
        </div>
        
        {/* Onboarding Types */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-2">Onboarding Services</h3>
          <div className="flex flex-wrap gap-2">
            {record.onboardingTypes.map((type: string) => (
              <span key={type} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            ))}
          </div>
        </div>

        {/* PIC Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-2">Person-in-Charge (PIC)</h3>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
            <DetailItem label="Name" value={record.picName} />
            <DetailItem label="Email" value={record.picEmail} />
            <DetailItem label="Phone" value={record.picPhone} />
          </dl>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AddressDetails title="Delivery Address" address={deliveryAddress} />
            <AddressDetails title="Training Address" address={trainingAddress} />
        </div>
        
        {record.createdByManager && (
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-2">Created By</h3>
                <DetailItem label="Manager" value={`${record.createdByManager.fullName} (${record.createdByManager.email})`} />
            </div>
        )}

      </div>
    </div>
  );
};

export default ViewOnboardingPage; 