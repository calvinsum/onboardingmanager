import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';

interface Merchant {
  id: string;
  email: string;
  businessName: string;
  contactPersonName: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

const OnboardingManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const data = await apiService.getAllMerchants();
      setMerchants(data);
    } catch (error) {
      console.error('Error fetching merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (merchantId: string, newStatus: string) => {
    setUpdating(true);
    try {
      await apiService.updateMerchantStatus(merchantId, newStatus);
      setMerchants(prev => 
        prev.map(merchant => 
          merchant.id === merchantId 
            ? { ...merchant, status: newStatus as any }
            : merchant
        )
      );
      setShowModal(false);
      setSelectedMerchant(null);
    } catch (error) {
      console.error('Error updating merchant status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const openMerchantModal = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusCounts = () => {
    return merchants.reduce((counts, merchant) => {
      counts[merchant.status] = (counts[merchant.status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Onboarding Manager Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/create-merchant')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Create Merchant
            </button>
            <div className="text-sm text-gray-500">
              Welcome, {user?.email}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">Total Merchants</h3>
            <p className="text-2xl font-bold text-blue-700">{merchants.length}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900">Pending</h3>
            <p className="text-2xl font-bold text-yellow-700">{statusCounts.pending || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Approved</h3>
            <p className="text-2xl font-bold text-green-700">{statusCounts.approved || 0}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-900">Rejected</h3>
            <p className="text-2xl font-bold text-red-700">{statusCounts.rejected || 0}</p>
          </div>
        </div>

        {/* Merchants Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Person
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {merchants.map((merchant) => (
                <tr key={merchant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {merchant.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {merchant.businessName || 'Not set'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {merchant.contactPersonName || 'Not set'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(merchant.status)}`}>
                      {merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(merchant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openMerchantModal(merchant)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {merchants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No merchants found.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedMerchant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Merchant Details
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Email:</span> {selectedMerchant.email}
                </div>
                <div>
                  <span className="font-medium">Business Name:</span> {selectedMerchant.businessName || 'Not set'}
                </div>
                <div>
                  <span className="font-medium">Contact Person:</span> {selectedMerchant.contactPersonName || 'Not set'}
                </div>
                <div>
                  <span className="font-medium">Current Status:</span>{' '}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedMerchant.status)}`}>
                    {selectedMerchant.status.charAt(0).toUpperCase() + selectedMerchant.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-3">Update Status:</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStatusUpdate(selectedMerchant.id, 'approved')}
                    disabled={updating || selectedMerchant.status === 'approved'}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedMerchant.id, 'rejected')}
                    disabled={updating || selectedMerchant.status === 'rejected'}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedMerchant.id, 'suspended')}
                    disabled={updating || selectedMerchant.status === 'suspended'}
                    className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                  >
                    Suspend
                  </button>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingManagerDashboard; 