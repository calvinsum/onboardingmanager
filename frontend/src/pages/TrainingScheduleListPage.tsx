import React, { useState, useEffect, useCallback } from 'react';
import { getAllTrainingSchedules, getTrainerWorkloadStats, getAllTrainers } from '../services/api';

interface TrainingSlot {
  id: string;
  date: string;
  timeSlot: string;
  trainingType: string;
  location: string;
  languages: string[];
  status: string;
  trainer: {
    id: string;
    name: string;
    languages: string[];
    locations: string[];
    status: string;
  };
  onboarding: {
    id: string;
    accountName: string;
    picName: string;
    picEmail: string;
    picPhone: string;
    trainingConfirmed: boolean;
    deliveryState: string;
    trainingState: string;
    // Training address fields
    useSameAddressForTraining: boolean;
    trainingAddress1?: string;
    trainingAddress2?: string;
    trainingCity?: string;
    trainingPostalCode?: string;
    trainingCountry?: string;
    // Delivery address fields (for when useSameAddressForTraining is true)
    deliveryAddress1?: string;
    deliveryAddress2?: string;
    deliveryCity?: string;
    deliveryPostalCode?: string;
    deliveryCountry?: string;
  };
}

interface TrainerWorkload {
  trainerId: string;
  trainerName: string;
  assignmentCount: number;
  languages: string[];
  locations: string[];
  status: string;
}

interface Trainer {
  id: string;
  name: string;
  languages: string[];
  locations: string[];
  status: string;
}

const TrainingScheduleListPage: React.FC = () => {
  const [trainingSlots, setTrainingSlots] = useState<TrainingSlot[]>([]);
  const [trainerWorkload, setTrainerWorkload] = useState<TrainerWorkload[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showWorkload, setShowWorkload] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    trainerId: '',
    status: '',
    trainingType: '',
    location: '',
    limit: 10
  });

  const fetchTrainingSchedules = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = {
        page,
        limit: filters.limit,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.trainerId && { trainerId: filters.trainerId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.trainingType && { trainingType: filters.trainingType }),
        ...(filters.location && { location: filters.location })
      };

      const response = await getAllTrainingSchedules(filterParams);

      setTrainingSlots(response.trainingSlots);
      setTotal(response.total);
      setCurrentPage(response.page);
      setTotalPages(Math.ceil(response.total / response.limit));
    } catch (err) {
      setError('Failed to fetch training schedules');
      console.error('Error fetching training schedules:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchTrainerWorkload = useCallback(async () => {
    try {
      const response = await getTrainerWorkloadStats();
      setTrainerWorkload(response);
    } catch (err) {
      console.error('Error fetching trainer workload:', err);
    }
  }, []);

  const fetchTrainers = useCallback(async () => {
    try {
      const response = await getAllTrainers();
      setTrainers(response);
    } catch (err) {
      console.error('Error fetching trainers:', err);
    }
  }, []);

  useEffect(() => {
    fetchTrainingSchedules(1);
    fetchTrainerWorkload();
    fetchTrainers();
  }, [fetchTrainingSchedules, fetchTrainerWorkload, fetchTrainers]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTrainingSchedules(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeSlot: string) => {
    return timeSlot;
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      BOOKED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  const getTrainingTypeBadge = (type: string) => {
    const typeColors = {
      ONLINE: 'bg-purple-100 text-purple-800',
      ONSITE: 'bg-orange-100 text-orange-800'
    };
    return typeColors[type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800';
  };

  const formatTrainingAddress = (slot: TrainingSlot) => {
    const { onboarding } = slot;
    
    // If using same address for training, show complete delivery address
    if (onboarding.useSameAddressForTraining) {
      const deliveryAddressParts = [
        onboarding.deliveryAddress1,
        onboarding.deliveryAddress2,
        onboarding.deliveryCity,
        onboarding.deliveryState,
        onboarding.deliveryPostalCode,
        onboarding.deliveryCountry
      ].filter(Boolean);
      
      return (
        <div className="text-xs text-text-muted">
          <div className="text-sm font-medium text-text-primary mb-1">Training Address (Same as Delivery)</div>
          <div>{deliveryAddressParts.join(', ')}</div>
        </div>
      );
    }
    
    // Show training address if available
    if (onboarding.trainingAddress1 || onboarding.trainingCity) {
      const addressParts = [
        onboarding.trainingAddress1,
        onboarding.trainingAddress2,
        onboarding.trainingCity,
        onboarding.trainingState,
        onboarding.trainingPostalCode,
        onboarding.trainingCountry
      ].filter(Boolean);
      
      return (
        <div className="text-xs text-text-muted">
          <div className="text-sm font-medium text-text-primary mb-1">Training Address</div>
          <div>{addressParts.join(', ')}</div>
        </div>
      );
    }
    
    // Fallback to just the state
    return (
      <div className="text-xs text-text-muted">
        <div className="text-sm font-medium text-text-primary mb-1">Location</div>
        <div>{slot.location || onboarding.trainingState || 'N/A'}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Training Schedules</h1>
          <p className="text-text-muted">
            Manage and monitor training sessions with automatic trainer assignments
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-text-primary mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field"
              >
                <option value="">All Statuses</option>
                <option value="BOOKED">Booked</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Training Type
              </label>
              <select
                name="trainingType"
                value={filters.trainingType}
                onChange={(e) => handleFilterChange(e.target.name, e.target.value)}
                className="input-field"
              >
                <option value="">All Types</option>
                <option value="remote_training">Online</option>
                <option value="onsite_training">Onsite</option>
              </select>
            </div>
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Trainer
              </label>
              <select
                value={filters.trainerId}
                onChange={(e) => handleFilterChange('trainerId', e.target.value)}
                className="input-field"
              >
                <option value="">All Trainers</option>
                {trainers.map(trainer => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowWorkload(!showWorkload)}
              className="btn-outline"
            >
              {showWorkload ? 'Hide' : 'Show'} Trainer Workload
            </button>
            <div className="text-sm text-text-muted">
              Total: {total} training sessions
            </div>
          </div>
        </div>

        {/* Trainer Workload Section */}
        {showWorkload && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Trainer Workload Distribution
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trainerWorkload.map((trainer) => (
                <div key={trainer.trainerId} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-text-primary">{trainer.trainerName}</h3>
                    <span className="text-2xl font-bold text-primary-500">
                      {trainer.assignmentCount}
                    </span>
                  </div>
                  <div className="text-sm text-text-muted mb-2">
                    <div>Languages: {trainer.languages.join(', ')}</div>
                    <div>Locations: {trainer.locations.join(', ')}</div>
                  </div>
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    trainer.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {trainer.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Training Schedules Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Date & Time</th>
                  <th className="table-header">Merchant</th>
                  <th className="table-header">Trainer</th>
                  <th className="table-header">Type & Training Address</th>
                  <th className="table-header">Languages</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Training Confirmed</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trainingSlots.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                      <div className="flex flex-col items-center">
                        <div className="text-6xl mb-4">📅</div>
                        <div className="text-xl font-medium mb-2">No training sessions found</div>
                        <div className="text-sm">
                          {Object.values(filters).some(v => v) 
                            ? 'Try adjusting your filters to see more results.'
                            : 'Training sessions will appear here once scheduled.'
                          }
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  trainingSlots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text-primary">
                          {formatDate(slot.date)}
                        </div>
                        <div className="text-sm text-text-muted">
                          {formatTime(slot.timeSlot)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-text-primary">
                          {slot.onboarding.accountName}
                        </div>
                        <div className="text-sm text-text-muted">
                          {slot.onboarding.picName}
                        </div>
                        <div className="text-xs text-text-muted">
                          {slot.onboarding.picEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-text-primary">
                          {slot.trainer.name}
                        </div>
                        <div className="text-xs text-text-muted">
                          {slot.trainer.locations.join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mb-1 ${getTrainingTypeBadge(slot.trainingType)}`}>
                          {slot.trainingType}
                        </div>
                        {formatTrainingAddress(slot)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-text-primary">
                          {slot.languages.join(', ') || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(slot.status)}`}>
                          {slot.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {slot.onboarding.trainingConfirmed ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Confirmed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              ⏳ Pending
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-text-muted">
              Showing {((currentPage - 1) * filters.limit) + 1} to {Math.min(currentPage * filters.limit, total)} of {total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-text-primary border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    page === currentPage
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-text-primary border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-text-primary border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingScheduleListPage; 