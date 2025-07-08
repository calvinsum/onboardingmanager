import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

interface MerchantTrainingSlot {
  id: string;
  date: string;
  timeSlot: string;
  trainingType: string;
  location: string;
  languages: string[];
  status: string;
  isAssigned: boolean;
  accountName?: string;
  trainingConfirmed: boolean;
}

interface MerchantTrainingScheduleProps {
  onboardingId: string;
}

const MerchantTrainingSchedule: React.FC<MerchantTrainingScheduleProps> = ({ onboardingId }) => {
  const [trainingSlots, setTrainingSlots] = useState<MerchantTrainingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrainingSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(
        `/merchant-training-schedules/onboarding/${onboardingId}`
      );
      
      setTrainingSlots(response.data);
    } catch (err) {
      setError('Failed to fetch training schedule');
      console.error('Error fetching training schedule:', err);
    } finally {
      setLoading(false);
    }
  }, [onboardingId]);

  useEffect(() => {
    fetchTrainingSchedule();
  }, [fetchTrainingSchedule]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeSlot: string) => {
    return timeSlot;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      BOOKED: { color: 'bg-blue-100 text-blue-800', icon: '📅', label: 'Scheduled' },
      COMPLETED: { color: 'bg-green-100 text-green-800', icon: '✅', label: 'Completed' },
      CANCELLED: { color: 'bg-red-100 text-red-800', icon: '❌', label: 'Cancelled' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: 'bg-gray-100 text-gray-800',
      icon: '❓',
      label: status
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getTrainingTypeBadge = (type: string) => {
    const typeConfig = {
      ONLINE: { color: 'bg-purple-100 text-purple-800', icon: '💻', label: 'Online Training' },
      ONSITE: { color: 'bg-orange-100 text-orange-800', icon: '🏢', label: 'Onsite Training' }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || {
      color: 'bg-gray-100 text-gray-800',
      icon: '📚',
      label: type
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-red-600">
          <div className="text-4xl mb-2">⚠️</div>
          <div className="font-medium">{error}</div>
          <button
            onClick={fetchTrainingSchedule}
            className="mt-4 btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-text-primary">Training Schedule</h2>
        <p className="text-text-muted mt-1">
          Your scheduled training sessions
        </p>
      </div>

      <div className="p-6">
        {trainingSlots.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <div className="text-xl font-medium text-text-primary mb-2">
              No training sessions scheduled
            </div>
            <div className="text-text-muted">
              Your training sessions will appear here once they are scheduled by your onboarding manager.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {trainingSlots.map((slot) => (
              <div
                key={slot.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="text-lg font-medium text-text-primary">
                        {formatDate(slot.date)}
                      </div>
                      <div className="text-lg font-medium text-primary-500">
                        {formatTime(slot.timeSlot)}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {getTrainingTypeBadge(slot.trainingType)}
                      {getStatusBadge(slot.status)}
                    </div>

                    <div className="space-y-2">
                      {slot.location && (
                        <div className="flex items-center text-sm text-text-muted">
                          <span className="mr-2">📍</span>
                          <span>Location: {slot.location}</span>
                        </div>
                      )}
                      
                      {slot.languages.length > 0 && (
                        <div className="flex items-center text-sm text-text-muted">
                          <span className="mr-2">🗣️</span>
                          <span>Languages: {slot.languages.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 md:ml-6">
                    <div className="flex flex-col items-end space-y-2">
                      <div className="text-sm text-text-muted">
                        Trainer Assignment
                      </div>
                      <div className="flex items-center">
                        {slot.isAssigned ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <span className="mr-1">✓</span>
                            Assigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <span className="mr-1">⏳</span>
                            Pending
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-text-muted">
                        Training Confirmation
                      </div>
                      <div className="flex items-center">
                        {slot.trainingConfirmed ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <span className="mr-1">✓</span>
                            Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <span className="mr-1">⏳</span>
                            Pending Confirmation
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Training Instructions */}
                {slot.status === 'BOOKED' && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <div className="font-medium mb-1">📋 Training Instructions:</div>
                      <ul className="space-y-1 text-xs">
                        <li>• A trainer has been automatically assigned to your session</li>
                        <li>• You will receive training details closer to the scheduled date</li>
                        <li>• Please ensure you have the necessary equipment for {slot.trainingType.toLowerCase()} training</li>
                        {slot.trainingType === 'ONLINE' && (
                          <li>• Make sure you have a stable internet connection and a quiet environment</li>
                        )}
                        {slot.trainingType === 'ONSITE' && (
                          <li>• The trainer will visit your location at the scheduled time</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantTrainingSchedule; 