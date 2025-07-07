import axios, { AxiosInstance, AxiosResponse } from 'axios';

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
}

export default new ApiService(); 