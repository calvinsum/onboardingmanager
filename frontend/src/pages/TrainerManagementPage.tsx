import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  getMyTrainers, 
  createTrainer, 
  updateTrainer, 
  deleteTrainer, 
  toggleTrainerStatus 
} from '../services/api';
import { TRAINER_LANGUAGES, MALAYSIA_STATES, TRAINER_STATUS } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';

interface Trainer {
  id: string;
  name: string;
  languages: string[];
  locations: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  createdByManager: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface TrainerFormData {
  name: string;
  languages: string[];
  locations: string[];
}

const TrainerManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [formData, setFormData] = useState<TrainerFormData>({
    name: '',
    languages: [],
    locations: []
  });

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const data = await getMyTrainers();
      setTrainers(data);
    } catch (error) {
      console.error('Error fetching trainers:', error);
      toast.error('Failed to fetch trainers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Trainer name is required');
      return;
    }
    
    if (formData.languages.length === 0) {
      toast.error('At least one language must be selected');
      return;
    }
    
    if (formData.locations.length === 0) {
      toast.error('At least one location must be selected');
      return;
    }

    try {
      setLoading(true);
      
      if (editingTrainer) {
        await updateTrainer(editingTrainer.id, formData);
        toast.success('Trainer updated successfully');
      } else {
        await createTrainer(formData);
        toast.success('Trainer created successfully');
      }
      
      setShowForm(false);
      setEditingTrainer(null);
      setFormData({ name: '', languages: [], locations: [] });
      fetchTrainers();
    } catch (error) {
      console.error('Error saving trainer:', error);
      toast.error('Failed to save trainer');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setFormData({
      name: trainer.name,
      languages: trainer.languages,
      locations: trainer.locations
    });
    setShowForm(true);
  };

  const handleDelete = async (trainerId: string, trainerName: string) => {
    if (!window.confirm(`Are you sure you want to delete trainer "${trainerName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteTrainer(trainerId);
      toast.success('Trainer deleted successfully');
      fetchTrainers();
    } catch (error) {
      console.error('Error deleting trainer:', error);
      toast.error('Failed to delete trainer');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (trainerId: string) => {
    try {
      setLoading(true);
      await toggleTrainerStatus(trainerId);
      toast.success('Trainer status updated successfully');
      fetchTrainers();
    } catch (error) {
      console.error('Error toggling trainer status:', error);
      toast.error('Failed to update trainer status');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (language: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      languages: checked 
        ? [...prev.languages, language]
        : prev.languages.filter(l => l !== language)
    }));
  };

  const handleLocationChange = (location: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      locations: checked 
        ? [...prev.locations, location]
        : prev.locations.filter(l => l !== location)
    }));
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingTrainer(null);
    setFormData({ name: '', languages: [], locations: [] });
  };

  return (
    <div className="container mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Trainer Management</h1>
          <p className="text-gray-600">Manage your training team</p>
        </div>
        <div>
          <button
            onClick={() => navigate('/onboarding-manager')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-4"
          >
            Back to Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {!showForm && (
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Add New Trainer
          </button>
        </div>
      )}

      {showForm && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            {editingTrainer ? 'Edit Trainer' : 'Add New Trainer'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trainer Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter trainer name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages * (Select all that apply)
              </label>
              <div className="grid grid-cols-3 gap-4">
                {TRAINER_LANGUAGES.map(language => (
                  <label key={language} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.languages.includes(language)}
                      onChange={(e) => handleLanguageChange(language, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{language}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Locations * (Select all that apply)
              </label>
              <div className="grid grid-cols-4 gap-4 max-h-48 overflow-y-auto p-4 border border-gray-200 rounded-md">
                {MALAYSIA_STATES.map(state => (
                  <label key={state} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.locations.includes(state)}
                      onChange={(e) => handleLocationChange(state, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{state}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingTrainer ? 'Update Trainer' : 'Create Trainer'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Trainers List</h2>
        
        {loading && !showForm ? (
          <p>Loading trainers...</p>
        ) : trainers.length === 0 ? (
          <p className="text-gray-500">No trainers found. Create your first trainer!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 border-b text-left">Name</th>
                  <th className="py-3 px-4 border-b text-left">Languages</th>
                  <th className="py-3 px-4 border-b text-left">Locations</th>
                  <th className="py-3 px-4 border-b text-left">Status</th>
                  <th className="py-3 px-4 border-b text-left">Created</th>
                  <th className="py-3 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trainers.map((trainer) => (
                  <tr key={trainer.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b font-medium">{trainer.name}</td>
                    <td className="py-3 px-4 border-b">
                      <div className="flex flex-wrap gap-1">
                        {trainer.languages.map(lang => (
                          <span key={lang} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b">
                      <div className="flex flex-wrap gap-1">
                        {trainer.locations.slice(0, 3).map(location => (
                          <span key={location} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {location}
                          </span>
                        ))}
                        {trainer.locations.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                            +{trainer.locations.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b">
                      <button
                        onClick={() => handleToggleStatus(trainer.id)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          trainer.status === TRAINER_STATUS.ACTIVE
                            ? 'bg-green-200 text-green-800 hover:bg-green-300'
                            : 'bg-red-200 text-red-800 hover:bg-red-300'
                        } transition-colors`}
                      >
                        {trainer.status === TRAINER_STATUS.ACTIVE ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4 border-b text-sm text-gray-600">
                      {new Date(trainer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 border-b">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(trainer)}
                          className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(trainer.id, trainer.name)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
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

export default TrainerManagementPage; 