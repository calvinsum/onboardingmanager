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
        const token = localStorage.getItem('authToken');
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
          localStorage.removeItem('authToken');
          localStorage.removeItem('userType');
          window.location.href = '/login';
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
  const response = await api.get('/onboarding/my-records');
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

export default api; 