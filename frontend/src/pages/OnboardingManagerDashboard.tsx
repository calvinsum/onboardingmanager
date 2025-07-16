import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getMyOnboardingRecords, regenerateOnboardingToken } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const OnboardingManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [attachmentModal, setAttachmentModal] = useState<{
    isOpen: boolean;
    attachments: any[];
    onboardingId: string;
  }>({
    isOpen: false,
    attachments: [],
    onboardingId: '',
  });

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const fetchedRecords = await getMyOnboardingRecords();
        setRecords(fetchedRecords);
      } catch (error) {
        toast.error('Failed to fetch onboarding records.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const calculateExpiry = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return <span className="text-red-600 font-semibold">Expired</span>;
    }
    return `${diffDays} days left`;
  };



  const handleRegenerateToken = async (id: string) => {
    try {
      const updatedRecord = await regenerateOnboardingToken(id);
      setRecords((prevRecords) =>
        prevRecords.map((rec) => (rec.id === id ? updatedRecord : rec))
      );
      toast.success(`New Token: ${updatedRecord.accessToken}`);
    } catch (error) {
      toast.error('Failed to regenerate token.');
      console.error(error);
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token).then(() => {
      toast.success('Access token copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy token to clipboard.');
    });
  };

  const handleShareWithMerchant = (record: any) => {
    const loginUrl = `${window.location.origin}/merchant-schedule`;
    const message = `Hi ${record.picName},

Your StoreHub onboarding is ready! Please use the following details to access your scheduling portal:

🔑 Access Token: ${record.accessToken}
🌐 Login URL: ${loginUrl}

Instructions:
1. Click the link above or go to ${loginUrl}
2. Select "Merchant" and enter your access token
3. Schedule your preferred dates for:
   - Hardware Delivery
   - Hardware Installation
   - Training Session
   - Product Setup
If you have any questions, please don't hesitate to reach out.

Best regards,
StoreHub Onboarding Team`;

    if (navigator.share) {
      navigator.share({
        title: 'StoreHub Onboarding Access',
        text: message,
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(message).then(() => {
          toast.success('Message copied to clipboard!');
        });
      });
    } else {
      navigator.clipboard.writeText(message).then(() => {
        toast.success('Message copied to clipboard!');
      }).catch(() => {
        toast.error('Failed to copy message.');
      });
    }
  };


  const handleViewAttachments = async (onboardingId: string) => {
    try {
      console.log('🔍 Fetching attachments for onboarding:', onboardingId);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://onboardingmanager.onrender.com/api'}/onboarding/${onboardingId}/attachments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const attachments = await response.json();
      console.log('📎 Received attachments:', attachments);
      console.log('📊 Number of attachments:', attachments.length);
      
      if (attachments.length === 0) {
        toast.error('No attachments found for this onboarding record.');
        return;
      }

      // Show attachments in modal
      setAttachmentModal({
        isOpen: true,
        attachments: attachments,
        onboardingId: onboardingId,
      });
      
      toast.success(`Found ${attachments.length} file(s)`);
      
    } catch (error) {
      console.error('❌ Error fetching attachments:', error);
      toast.error('Failed to view attachments.');
    }
  };

  const handleDownloadAttachment = (attachment: any) => {
    try {
      // Use our backend proxy endpoint for downloading
      const downloadUrl = `${process.env.REACT_APP_API_URL}/files/attachment/${attachment.id}/download`;
      
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attachment.originalName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Add authorization header by including it in the URL or using fetch
      const token = localStorage.getItem('authToken');
      if (token) {
        // Use fetch to handle the download with authorization
        fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = attachment.originalName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          toast.success(`Downloaded ${attachment.originalName}`);
        })
        .catch(error => {
          console.error('Error downloading file:', error);
          toast.error('Failed to download file. Please try again.');
        });
      } else {
        toast.error('Authentication required for download.');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file. Please try again.');
    }
  };

  const handleViewAttachment = (attachment: any) => {
    try {
      // Use our backend proxy endpoint for viewing
      const viewUrl = `${process.env.REACT_APP_API_URL}/files/attachment/${attachment.id}/download`;
      const token = localStorage.getItem('authToken');
      
      if (token) {
        // Open the proxy URL with authentication in a new tab
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.location.href = `${viewUrl}?token=${token}`;
        }
      } else {
        toast.error('Authentication required for viewing files.');
      }
    } catch (error) {
      console.error('Error viewing file:', error);
      toast.error('Failed to open file. Please try again.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const closeAttachmentModal = () => {
    setAttachmentModal({
      isOpen: false,
      attachments: [],
      onboardingId: '',
    });
  };
  // Statistics
  const totalRecords = records.length;
  const completedRecords = records.filter(r => r.status === 'completed').length;
  const inProgressRecords = records.filter(r => r.status === 'in_progress').length;
  const pendingRecords = records.filter(r => r.status === 'created').length;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="card">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-main">
              Welcome back, {user?.fullName || 'Manager'}!
            </h1>
            <p className="text-text-muted mt-2">
              Manage your merchant onboarding processes and track progress
            </p>
          </div>
          <div className="flex space-x-4">
            <Link
              to="/create-merchant"
              className="btn-primary"
            >
              + Create Merchant
            </Link>
            <Link
              to="/trainer-management"
              className="btn-secondary"
            >
              Trainer Management
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-primary-600 font-bold">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-muted">Total Records</p>
              <p className="text-2xl font-bold text-text-main">{totalRecords}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-muted">Completed</p>
              <p className="text-2xl font-bold text-text-main">{completedRecords}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 font-bold">⏳</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-muted">In Progress</p>
              <p className="text-2xl font-bold text-text-main">{inProgressRecords}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 font-bold">📋</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-muted">Pending</p>
              <p className="text-2xl font-bold text-text-main">{pendingRecords}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-bold text-text-main">Onboarding Records</h2>
          <p className="text-text-muted mt-1">Manage and track all merchant onboarding processes</p>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="ml-3 text-text-muted">Loading records...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-medium text-text-main mb-2">No records found</h3>
              <p className="text-text-muted mb-6">Get started by creating your first merchant onboarding record</p>
              <Link to="/create-merchant" className="btn-primary">
                Create First Record
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="table-header">
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Account</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">PIC Details</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">T&C Status</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Acknowledged By</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Delivery</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Installation</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Training</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Product Setup</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Go Live</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Attachments</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Access Token</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Expiry</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-divider">
                  {records.map((record) => (
                    <tr key={record.id} className="table-row">
                      <td className="py-4 px-4">
                        <div className="font-medium text-text-main">{record.accountName || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-text-main font-medium">{record.picName}</div>
                        <div className="text-text-muted text-sm">{record.picEmail}</div>
                        <div className="text-text-muted text-sm">{record.picPhone}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          record.status === 'completed' ? 'bg-green-100 text-green-800' :
                          record.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {record.termsAccepted ? (
                          <div className="flex items-center">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              ✓ Acknowledged
                            </span>
                            {record.termsAcknowledgedDate && (
                              <div className="text-text-muted text-xs ml-2">
                                {new Date(record.termsAcknowledgedDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            ✗ Pending
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-text-main text-sm">
                          {record.termsAcknowledgmentName || 'Not acknowledged'}
                        </div>
                        {record.acknowledgedTermsVersion && (
                          <div className="text-text-muted text-xs">
                            Version: {record.acknowledgedTermsVersion.version}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`status-badge ${
                          record.deliveryConfirmed ? 'status-confirmed' : 'status-pending'
                        }`}>
                          {record.deliveryConfirmed ? 'Confirmed' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`status-badge ${
                          record.installationConfirmed ? 'status-confirmed' : 'status-pending'
                        }`}>
                          {record.installationConfirmed ? 'Confirmed' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`status-badge ${
                          record.trainingConfirmed ? 'status-confirmed' : 'status-pending'
                        }`}>
                          {record.trainingConfirmed ? 'Confirmed' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`status-badge ${
                          record.productSetupConfirmed ? 'status-confirmed' : 'status-pending'
                        }`}>
                          {record.productSetupConfirmed ? 'Confirmed' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-text-main text-sm">
                          {new Date(record.expectedGoLiveDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {record.productSetupAttachments && record.productSetupAttachments.length > 0 ? (
                            <>
                              <span className="text-sm text-text-main">
                                {record.productSetupAttachments.length} file{record.productSetupAttachments.length > 1 ? 's' : ''}
                              </span>
                              <button
                                onClick={() => handleViewAttachments(record.id)}
                                className="text-blue-500 hover:text-blue-700 text-xs"
                                title="View all attachments"
                              >
                                👁️ View All
                              </button>
                            </>
                          ) : (
                            <span className="text-text-muted text-sm">No files</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-text-main text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {record.accessToken}
                          </span>
                          <button
                            onClick={() => handleCopyToken(record.accessToken)}
                            className="text-blue-500 hover:text-blue-700 text-xs"
                            title="Copy token"
                          >
                            📋 Copy
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-text-main text-sm">
                          {calculateExpiry(record.tokenExpiryDate)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => navigate(`/view-onboarding/${record.id}`)} 
                            className="text-text-muted hover:text-primary-500 text-sm font-medium transition-colors"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => navigate(`/edit-onboarding/${record.id}`)} 
                            className="text-primary-500 hover:text-primary-600 text-sm font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <Link 
                            to={`/schedule-onboarding/${record.id}`} 
                            className="text-primary-500 hover:text-primary-600 text-sm font-medium transition-colors"
                          >
                            Schedule
                          </Link>
                          <button 
                            onClick={() => handleRegenerateToken(record.id)} 
                            className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                          >
                            Regenerate
                          </button>
                          <button 
                            onClick={() => handleShareWithMerchant(record)} 
                            className="text-primary-500 hover:text-primary-600 text-sm font-medium transition-colors"
                          >
                            Share
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Attachment Modal */}
      {attachmentModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Uploaded Files</h2>
              <button
                onClick={closeAttachmentModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {attachmentModal.attachments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-2xl">📁</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Files Found</h3>
                  <p className="text-gray-500">No attachments have been uploaded for this onboarding record.</p>
                </div>
              ) : (
                attachmentModal.attachments.map((attachment, index) => (
                  <div
                    key={attachment.id || index}
                    className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold">
                          {attachment.mimeType?.includes('image') ? '🖼️' : 
                           attachment.mimeType?.includes('pdf') ? '📄' : 
                           attachment.mimeType?.includes('word') ? '📝' : '📎'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{attachment.originalName}</h3>
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
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewAttachment(attachment)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition-colors"
                        title="View file in new tab"
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => handleDownloadAttachment(attachment)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm transition-colors"
                        title="Download file"
                      >
                        📥 Download
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeAttachmentModal}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingManagerDashboard; 