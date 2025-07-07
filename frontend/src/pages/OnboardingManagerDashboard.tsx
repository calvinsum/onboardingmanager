import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getMyOnboardingRecords, regenerateOnboardingToken } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const OnboardingManagerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
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

  return (
    <div className="container mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.fullName || 'Manager'}!</h1>
          <p className="text-gray-600">Onboarding Manager Dashboard</p>
        </div>
        <div>
          <Link
            to="/create-merchant"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mr-4"
          >
            Create Merchant
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">My Onboarding Records</h2>
        {loading ? (
          <p>Loading records...</p>
        ) : records.length === 0 ? (
          <p>No records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border-b text-left">PIC Name</th>
                  <th className="py-2 px-4 border-b text-left">PIC Email</th>
                  <th className="py-2 px-4 border-b text-left">Status</th>
                  <th className="py-2 px-4 border-b text-left">EGLD</th>
                  <th className="py-2 px-4 border-b text-left">Access Token</th>
                  <th className="py-2 px-4 border-b text-left">Expiry</th>
                  <th className="py-2 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{record.picName}</td>
                    <td className="py-2 px-4 border-b">{record.picEmail}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        record.status === 'completed' ? 'bg-green-200 text-green-800' : 
                        record.status === 'in_progress' ? 'bg-yellow-200 text-yellow-800' : 
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">{new Date(record.expectedGoLiveDate).toLocaleDateString()}</td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded border">
                          {record.accessToken}
                        </span>
                        <button
                          onClick={() => handleCopyToken(record.accessToken)}
                          className="text-blue-500 hover:text-blue-700 text-sm"
                          title="Copy token"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-4 border-b">{calculateExpiry(record.tokenExpiryDate)}</td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => navigate(`/view-onboarding/${record.id}`)} 
                          className="text-gray-600 hover:underline text-sm"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => navigate(`/edit-onboarding/${record.id}`)} 
                          className="text-blue-500 hover:underline text-sm"
                        >
                          Edit
                        </button>
                        <Link to={`/schedule-onboarding/${record.id}`} className="text-purple-500 hover:underline text-sm">
                          Schedule
                        </Link>
                        <button 
                          onClick={() => handleRegenerateToken(record.id)} 
                          className="text-green-500 hover:underline text-sm"
                        >
                          Regenerate
                        </button>
                        <button 
                          onClick={() => handleShareWithMerchant(record)} 
                          className="text-orange-500 hover:underline text-sm font-medium"
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
  );
};

export default OnboardingManagerDashboard; 