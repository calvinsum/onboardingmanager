import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getOnboardingRecordById } from '../services/api';
import { getFileTypeIcon } from '../components/Icons';

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
  const [attachments, setAttachments] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchRecord = async () => {
      try {
        setLoading(true);
        const fetchedRecord = await getOnboardingRecordById(id);
        setRecord(fetchedRecord);
        
        // Fetch attachments if they exist
        if (fetchedRecord.productSetupAttachments?.length > 0) {
          setAttachments(fetchedRecord.productSetupAttachments);
        }
      } catch (error) {
        toast.error('Failed to fetch record details.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [id]);

  const calculateAgingDays = (record: any) => {
    const today = new Date();
    const createdAt = new Date(record.createdAt);
    
    // Get required services based on onboarding types
    const requiredServices = [];
    if (record.onboardingTypes?.includes('hardware_delivery')) {
      requiredServices.push({
        confirmed: record.deliveryConfirmed,
        confirmedDate: record.deliveryConfirmedDate
      });
    }
    if (record.onboardingTypes?.includes('hardware_installation')) {
      requiredServices.push({
        confirmed: record.installationConfirmed,
        confirmedDate: record.installationConfirmedDate
      });
    }
    if (record.onboardingTypes?.includes('remote_training') || record.onboardingTypes?.includes('onsite_training')) {
      requiredServices.push({
        confirmed: record.trainingConfirmed,
        confirmedDate: record.trainingConfirmedDate
      });
    }
    if (record.onboardingTypes?.includes('product_setup')) {
      requiredServices.push({
        confirmed: record.productSetupConfirmed,
        confirmedDate: record.productSetupConfirmedDate
      });
    }

    // If no required services, return 0 aging days
    if (requiredServices.length === 0) {
      return 0;
    }

    // Check if all required services are confirmed
    const allConfirmed = requiredServices.every(service => service.confirmed);
    if (allConfirmed) {
      return 0;
    }

    // Find the latest confirmation date among confirmed services
    const confirmedServices = requiredServices.filter(service => service.confirmed && service.confirmedDate);
    
    let referenceDate = createdAt;
    if (confirmedServices.length > 0) {
      // Use the latest confirmation date
      const latestConfirmationDate = confirmedServices
        .map(service => new Date(service.confirmedDate))
        .reduce((latest, current) => current > latest ? current : latest);
      referenceDate = latestConfirmationDate;
    }

    // Calculate aging days
    const diffTime = today.getTime() - referenceDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const formatAgingDays = (agingDays: number) => {
    if (agingDays === 0) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          Completed
        </span>
      );
    } else if (agingDays <= 3) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          {agingDays} {agingDays === 1 ? 'day' : 'days'}
        </span>
      );
    } else if (agingDays <= 7) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
          {agingDays} days
        </span>
      );
    } else {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          {agingDays} days
        </span>
      );
    }
  };

  const formatConfirmationStatus = (
    isConfirmed: boolean, 
    confirmedDate?: string, 
    onboardingTypes?: string[], 
    requiredType?: string | string[]
  ) => {
    // Check if this service is required based on onboarding types
    const isRequired = () => {
      if (!onboardingTypes || !requiredType) return true; // Default to required if data missing
      
      if (Array.isArray(requiredType)) {
        // For training, check if either remote_training or onsite_training is selected
        return requiredType.some(type => onboardingTypes.includes(type));
      } else {
        // For other services, check if the specific type is selected
        return onboardingTypes.includes(requiredType);
      }
    };

    // If service is not required, show "Not Required"
    if (!isRequired()) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
          Not Required
        </span>
      );
    }

    // If required but not confirmed, show "Pending"
    if (!isConfirmed) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          Pending
        </span>
      );
    }
    
    // If confirmed, show "Confirmed" with date
    return (
      <div className="space-y-1">
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          Confirmed
        </span>
        {confirmedDate && (
          <div className="text-xs text-gray-500">
            {new Date(confirmedDate).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </div>
        )}
      </div>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
            <DetailItem label="Account Name" value={record.accountName} />
            <DetailItem label="Status" value={<span className={`px-2 py-1 text-xs font-semibold rounded-full ${ record.status === 'completed' ? 'bg-green-200 text-green-800' : record.status === 'in_progress' ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-800' }`}>{record.status}</span>} />
            <DetailItem label="Expected Go-Live Date" value={new Date(record.expectedGoLiveDate).toLocaleDateString()} />
            <DetailItem label="Created On" value={new Date(record.createdAt).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })} />
            <DetailItem label="Access Token" value={<span className="font-mono bg-gray-100 px-2 py-1 rounded">{record.accessToken}</span>} />
            <DetailItem label="Token Expires On" value={new Date(record.tokenExpiryDate).toLocaleString()} />
            <DetailItem label="Aging Days" value={formatAgingDays(calculateAgingDays(record))} />
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

        {/* Service Confirmation Status */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-2">Service Status</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
            <DetailItem 
              label="Delivery" 
              value={formatConfirmationStatus(record.deliveryConfirmed, record.deliveryConfirmedDate, record.onboardingTypes, 'hardware_delivery')} 
            />
            <DetailItem 
              label="Installation" 
              value={formatConfirmationStatus(record.installationConfirmed, record.installationConfirmedDate, record.onboardingTypes, 'hardware_installation')} 
            />
            <DetailItem 
              label="Training" 
              value={formatConfirmationStatus(record.trainingConfirmed, record.trainingConfirmedDate, record.onboardingTypes, ['remote_training', 'onsite_training'])} 
            />
            <DetailItem 
              label="Product Setup" 
              value={formatConfirmationStatus(record.productSetupConfirmed, record.productSetupConfirmedDate, record.onboardingTypes, 'product_setup')} 
            />
          </dl>
        </div>

        {/* Terms & Conditions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-2">Terms & Conditions</h3>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
            <DetailItem 
              label="T&C Status" 
              value={record.termsAccepted ? (
                <div className="flex items-center">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    ✓ Acknowledged
                  </span>
                  {record.termsAcknowledgedDate && (
                    <div className="text-gray-500 text-xs ml-2">
                      {new Date(record.termsAcknowledgedDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ) : (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                  ✗ Pending
                </span>
              )}
            />
            <DetailItem label="Acknowledged By" value={record.termsAcknowledgmentName || 'Not acknowledged'} />
            <DetailItem 
              label="Terms Version" 
              value={record.acknowledgedTermsVersion ? 
                `Version ${record.acknowledgedTermsVersion.version}` : 
                'Not acknowledged'
              } 
            />
          </dl>
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
        
        {/* Attachments */}
        {record.productSetupAttachments && record.productSetupAttachments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-2">Uploaded Files</h3>
            <div className="space-y-3">
              {record.productSetupAttachments.map((attachment: any, index: number) => (
                <div
                  key={attachment.id || index}
                  className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        {React.createElement(getFileTypeIcon(attachment.mimeType), { className: "text-blue-600 font-bold" })}
                      </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{attachment.originalName}</h4>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(attachment.fileSize)} • {attachment.mimeType}
                      </p>
                      {attachment.createdAt && (
                        <p className="text-xs text-gray-400">
                          Uploaded: {new Date(attachment.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
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