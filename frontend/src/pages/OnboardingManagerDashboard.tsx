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
                    <td className="py-2 px-4 border-b font-mono text-sm">{record.accessToken}</td>
                    <td className="py-2 px-4 border-b">{calculateExpiry(record.tokenExpiryDate)}</td>
                    <td className="py-2 px-4 border-b">
                      <button 
                        onClick={() => navigate(`/view-onboarding/${record.id}`)} 
                        className="text-gray-600 hover:underline mr-4"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => navigate(`/edit-onboarding/${record.id}`)} 
                        className="text-blue-500 hover:underline mr-4"
                      >
                        Edit
                      </button>
                      <button onClick={() => handleRegenerateToken(record.id)} className="text-green-500 hover:underline">
                        Regenerate Token
                      </button>
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