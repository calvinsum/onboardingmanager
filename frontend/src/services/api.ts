import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://onboardingmanager.onrender.com/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    console.log('API Service initialized with base URL:', API_BASE_URL);
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        // Check for both authToken (for managers) and merchantAccessToken (for merchants)
        const token = localStorage.getItem('authToken') || localStorage.getItem('merchantAccessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data
        });
        
        if (error.response?.status === 401) {
          // Only auto-redirect for manager authentication, not for merchant
          const userType = localStorage.getItem('userType');
          if (userType === 'manager') {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userType');
            window.location.href = '/login';
          }
          // For merchants, let the component handle the error
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async loginMerchant(email: string, password: string) {
    const response = await this.api.post('/auth/merchant/login', { email, password });
    return response.data;
  }

  async registerMerchant(email: string, password: string) {
    const response = await this.api.post('/auth/merchant/register', { email, password });
    return response.data;
  }

  async loginOnboardingManager(email: string, password: string) {
    const response = await this.api.post('/auth/onboarding-manager/login', { email, password });
    return response.data;
  }

  async refreshToken() {
    const response = await this.api.post('/auth/refresh');
    return response.data;
  }

  // Merchant methods
  async getMerchantProfile() {
    const response = await this.api.get('/merchants/profile');
    return response.data;
  }

  async updateMerchantProfile(data: any) {
    const response = await this.api.put('/merchants/profile', data);
    return response.data;
  }

  async getAllMerchants() {
    const response = await this.api.get('/merchants');
    return response.data;
  }

  async getMerchant(id: string) {
    const response = await this.api.get(`/merchants/${id}`);
    return response.data;
  }

  async updateMerchantStatus(id: string, status: string) {
    const response = await this.api.put(`/merchants/${id}/status`, { status });
    return response.data;
  }

  // Onboarding Manager methods
  async getOnboardingManagerProfile() {
    const response = await this.api.get('/onboarding-managers/profile');
    return response.data;
  }

  async updateOnboardingManagerProfile(data: any) {
    const response = await this.api.put('/onboarding-managers/profile', data);
    return response.data;
  }

  async getAllOnboardingManagers() {
    const response = await this.api.get('/onboarding-managers');
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Generic methods
  private handleApiError(error: any) {
    console.error("API Error:", error.response?.data || error.message);
    // You could add more robust error handling here, e.g., logging service
  }
  
  async get(endpoint: string) {
    try {
      const response = await this.api.get(endpoint);
      return response;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async post(endpoint: string, data: any) {
    try {
      const response = await this.api.post(endpoint, data);
      return response;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async put(url: string, data?: any) {
    const response = await this.api.put(url, data);
    return response.data;
  }

  async delete(url: string) {
    const response = await this.api.delete(url);
    return response.data;
  }

  async patch(endpoint: string, data: any) {
    try {
      const response = await this.api.patch(endpoint, data);
      return response;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async setAuthToken(token: string | null) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }
}

const api = new ApiService();

export const createMerchantOnboarding = async (data: any) => {
  const response = await api.post('/onboarding', data);
  return response.data;
};

export const getMyOnboardingRecords = async () => {
  const response = await api.get('/onboarding');
  return response.data;
};

export const getOnboardingRecordById = async (id: string) => {
  const response = await api.get(`/onboarding/${id}`);
  return response.data;
};

export const getOnboardingByToken = async (token: string) => {
  const response = await api.get(`/merchant-onboarding/access/${token}`);
  return response.data;
};

export const updateOnboardingRecord = async (id: string, data: any) => {
  const response = await api.patch(`/onboarding/${id}`, data);
  return response.data;
};

export const regenerateOnboardingToken = async (id: string) => {
  const response = await api.post(`/onboarding/${id}/regenerate-token`, {});
  return response.data;
};

export const getPublicHolidays = async (year: number, state?: string) => {
  const response = await api.get(`/schedule/holidays/${year}${state ? `?state=${state}` : ''}`);
  return response.data;
};

export const updateOnboardingByToken = async (token: string, data: any) => {
  const response = await api.patch(`/merchant-onboarding/update/${token}`, data);
  return response.data;
};

export const checkTokenExpiry = async (token: string) => {
  const response = await api.get(`/merchant-onboarding/check-token/${token}`);
  return response.data;
};

// Trainer API functions
export const createTrainer = async (data: any) => {
  const response = await api.post('/trainers', data);
  return response.data;
};

export const getAllTrainers = async () => {
  const response = await api.get('/trainers');
  return response.data;
};

export const getMyTrainers = async () => {
  const response = await api.get('/trainers/my-trainers');
  return response.data;
};

export const getTrainerById = async (id: string) => {
  const response = await api.get(`/trainers/${id}`);
  return response.data;
};

export const updateTrainer = async (id: string, data: any) => {
  const response = await api.patch(`/trainers/${id}`, data);
  return response.data;
};

export const toggleTrainerStatus = async (id: string) => {
  const response = await api.patch(`/trainers/${id}/toggle-status`, {});
  return response.data;
};

export const deleteTrainer = async (id: string) => {
  const response = await api.delete(`/trainers/${id}`);
  return response.data;
};

export const getAvailableTrainers = async (location?: string, language?: string) => {
  const params = new URLSearchParams();
  if (location) params.append('location', location);
  if (language) params.append('language', language);
  
  const response = await api.get(`/trainers/available?${params.toString()}`);
  return response.data;
};

// Training Slot API functions
export const getAvailableTrainingSlots = async (
  date: string,
  trainingType: string,
  location?: string,
  languages?: string
) => {
  const params = new URLSearchParams({
    date,
    trainingType
  });
  if (location) params.append('location', location);
  if (languages) params.append('languages', languages);
  
  const response = await api.get(`/training-slots/availability?${params.toString()}`);
  return response.data;
};

export const getTrainingAvailabilityRange = async (
  startDate: string,
  endDate: string,
  trainingType: string,
  location?: string,
  languages?: string
) => {
  const params = new URLSearchParams({
    startDate,
    endDate,
    trainingType
  });
  if (location) params.append('location', location);
  if (languages) params.append('languages', languages);
  
  const response = await api.get(`/training-slots/availability/range?${params.toString()}`);
  return response.data;
};

export const bookTrainingSlot = async (bookingData: {
  onboardingId: string;
  trainerId: string;
  date: string;
  timeSlot: string;
  trainingType: string;
  location?: string;
  languages?: string[];
}) => {
  const response = await api.post('/training-slots/book', bookingData);
  return response.data;
};

export const getTrainingSlotsByOnboarding = async (onboardingId: string) => {
  const response = await api.get(`/training-slots/onboarding/${onboardingId}`);
  return response.data;
};

export const cancelTrainingSlot = async (slotId: string) => {
  const response = await api.patch(`/training-slots/${slotId}/cancel`, {});
  return response.data;
};

export const completeTrainingSlot = async (slotId: string) => {
  const response = await api.patch(`/training-slots/${slotId}/complete`, {});
  return response.data;
};

// Training Schedule API functions
export const getMyTrainingSchedules = async (filters?: {
  startDate?: string;
  endDate?: string;
  trainerId?: string;
  status?: string;
  trainingType?: string;
  location?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await api.get(`/training-schedules/my-schedules?${params.toString()}`);
  return response.data;
};

export const getAllTrainingSchedules = async (filters?: {
  startDate?: string;
  endDate?: string;
  trainerId?: string;
  status?: string;
  trainingType?: string;
  location?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await api.get(`/training-schedules?${params.toString()}`);
  return response.data;
};

export const getTrainingSchedulesForManager = async (managerId: string, filters?: {
  startDate?: string;
  endDate?: string;
  trainerId?: string;
  status?: string;
  trainingType?: string;
  location?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await api.get(`/training-schedules/manager/${managerId}?${params.toString()}`);
  return response.data;
};

export const bookTrainingSlotAutoAssign = async (bookingData: {
  onboardingId: string;
  date: string;
  timeSlot: string;
  trainingType: string;
  location?: string;
  languages?: string[];
}) => {
  const response = await api.post('/training-schedules/book-auto-assign', bookingData);
  return response.data;
};

export const getTrainerWorkloadStats = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await api.get(`/training-schedules/trainer-workload?${params.toString()}`);
  return response.data;
};

// Merchant Training Schedule API functions (privacy-focused)
export const getMerchantTrainingSchedule = async (onboardingId: string) => {
  const response = await api.get(`/merchant-training-schedules/onboarding/${onboardingId}`);
  return response.data;
};

export const bookMerchantTrainingSlot = async (bookingData: {
  onboardingId: string;
  date: string;
  timeSlot: string;
  trainingType: string;
  location?: string;
  languages?: string[];
}) => {
  const response = await api.post('/merchant-training-schedules/book-auto-assign', bookingData);
  return response.data;
};

// Terms and Conditions API functions
export const getActiveTermsConditions = async () => {
  const response = await axios.get(`${API_BASE_URL}/merchant-onboarding/terms-conditions/active`);
  return response.data;
};

export const checkTermsAcknowledgment = async (token: string) => {
  const response = await axios.get(`${API_BASE_URL}/merchant-onboarding/terms-conditions/check/${token}`);
  return response.data;
};

export const acknowledgeTerms = async (token: string, data: { name: string; termsVersionId: string }) => {
  const response = await axios.post(`${API_BASE_URL}/merchant-onboarding/terms-conditions/acknowledge/${token}`, data);
  return response.data;
};

// Manager-only functions for Terms and Conditions management
export const createTermsConditions = async (data: { version: string; content: string; effectiveDate: string }) => {
  const response = await axios.post(`${API_BASE_URL}/onboarding/terms-conditions`, data, {
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
  });
  return response.data;
};

export const getAllTermsConditions = async () => {
  const response = await axios.get(`${API_BASE_URL}/onboarding/terms-conditions`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
  });
  return response.data;
};

export const updateTermsConditions = async (id: string, data: { content: string }) => {
  const response = await axios.patch(`${API_BASE_URL}/onboarding/terms-conditions/${id}`, data, {
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
  });
  return response.data;
};

export const activateTermsConditions = async (id: string) => {
  const response = await axios.patch(`${API_BASE_URL}/onboarding/terms-conditions/${id}/activate`, {}, {
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
  });
  return response.data;
};

export default api; 