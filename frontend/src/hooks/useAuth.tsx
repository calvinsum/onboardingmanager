import React, { createContext, useContext, useEffect, useState } from 'react';
import apiService, { getOnboardingByToken } from '../services/api';

interface User {
  id: string;
  email: string;
  fullName?: string;
  businessName?: string;
  type: 'merchant' | 'onboarding_manager';
  role?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, userType: 'merchant' | 'onboarding_manager') => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const merchantToken = localStorage.getItem('merchantAccessToken');
    const userType = localStorage.getItem('userType') as 'merchant' | 'onboarding_manager';

    if (merchantToken && userType === 'merchant') {
      // Handle merchant token-based auth
      const onboardingRecord = localStorage.getItem('onboardingRecord');
      if (onboardingRecord) {
        const record = JSON.parse(onboardingRecord);
        setUser({
          id: record.id,
          email: record.picEmail,
          fullName: record.picName,
          type: 'merchant',
        });
      }
      setLoading(false);
    } else if (token && userType) {
      // Handle JWT-based auth for onboarding managers
      const fetchUserData = async () => {
        try {
          let userData;
          if (userType === 'merchant') {
            userData = await apiService.getMerchantProfile();
          } else {
            userData = await apiService.getOnboardingManagerProfile();
          }
          setUser({ ...userData, type: userType });
        } catch (error) {
          console.error('Error fetching user data:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('userType');
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, userType: 'merchant' | 'onboarding_manager') => {
    try {
      let response;
      if (userType === 'merchant') {
        response = await apiService.loginMerchant(email, password);
      } else {
        response = await apiService.loginOnboardingManager(email, password);
      }

      const { access_token, user: userData } = response;
      localStorage.setItem('authToken', access_token);
      localStorage.setItem('userType', userType);
      setUser({ ...userData, type: userType });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithToken = async (accessToken: string) => {
    // Clear any existing session first to prevent conflicts
    logout();
    
    // Call the API to verify the token and get the onboarding record
    const onboardingRecord = await getOnboardingByToken(accessToken);
    
    // Store the new session data in localStorage
    localStorage.setItem('merchantAccessToken', accessToken);
    localStorage.setItem('userType', 'merchant');
    localStorage.setItem('onboardingRecord', JSON.stringify(onboardingRecord));
    
    // CRITICAL: Set the user in the AuthProvider's state
    setUser({
      id: onboardingRecord.id,
      email: onboardingRecord.picEmail,
      fullName: onboardingRecord.picName,
      type: 'merchant',
    });
  };

  const register = async (email: string, password: string) => {
    try {
      await apiService.registerMerchant(email, password);
      // After successful registration, auto-login
      await login(email, password, 'merchant');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('merchantAccessToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('onboardingRecord');
    // Also clear debug items
    localStorage.removeItem('merchantLoginError');
    localStorage.removeItem('merchantRedirectReason');
    setUser(null);
  };

  const value = {
    user,
    login,
    loginWithToken,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 