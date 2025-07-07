import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOnboardingByToken } from '../services/api';

const LoginPage: React.FC = () => {
  const [accessToken, setAccessToken] = useState('');
  const [userType, setUserType] = useState<'merchant' | 'onboarding_manager'>('merchant');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleMerchantTokenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Clear any existing authentication data first
      localStorage.removeItem('authToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('onboardingRecord');
      localStorage.removeItem('merchantAccessToken');
      
      // Verify the access token by fetching the onboarding record
      const onboardingRecord = await getOnboardingByToken(accessToken);
      
      // Store the access token for merchant access
      localStorage.setItem('merchantAccessToken', accessToken);
      localStorage.setItem('userType', 'merchant');
      localStorage.setItem('onboardingRecord', JSON.stringify(onboardingRecord));
      
      // Verify data was stored correctly
      const storedToken = localStorage.getItem('merchantAccessToken');
      const storedRecord = localStorage.getItem('onboardingRecord');
      const storedUserType = localStorage.getItem('userType');
      
      if (!storedToken || !storedRecord || storedUserType !== 'merchant') {
        throw new Error(`Failed to store data correctly. Token: ${!!storedToken}, Record: ${!!storedRecord}, UserType: ${storedUserType}`);
      }
      
      // Navigate to merchant schedule page
      navigate('/merchant-schedule');
      
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid access token');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to StoreHub
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Merchant Onboarding Platform
          </p>
        </div>

        {/* User Type Selection */}
        <div>
          <fieldset>
            <legend className="text-sm font-medium text-gray-900">I am a:</legend>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  id="merchant"
                  name="user-type"
                  type="radio"
                  value="merchant"
                  checked={userType === 'merchant'}
                  onChange={(e) => setUserType(e.target.value as 'merchant')}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <label htmlFor="merchant" className="ml-3 block text-sm font-medium text-gray-700">
                  Merchant
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="onboarding-manager"
                  name="user-type"
                  type="radio"
                  value="onboarding_manager"
                  checked={userType === 'onboarding_manager'}
                  onChange={(e) => setUserType(e.target.value as 'onboarding_manager')}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <label htmlFor="onboarding-manager" className="ml-3 block text-sm font-medium text-gray-700">
                  Onboarding Manager
                </label>
              </div>
            </div>
          </fieldset>
        </div>

        {/* Onboarding Manager Google Login */}
        {userType === 'onboarding_manager' && (
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Sign in with your @storehub.com email</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        )}

        {/* Merchant Access Token Login */}
        {userType === 'merchant' && (
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Enter your access token</span>
              </div>
            </div>
            
            <form className="space-y-4" onSubmit={handleMerchantTokenLogin}>
              <div>
                <label htmlFor="access-token" className="block text-sm font-medium text-gray-700">
                  Access Token
                </label>
                <input
                  id="access-token"
                  name="access-token"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your access token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
                <p className="mt-2 text-sm text-gray-600">
                  Your access token was provided by your onboarding manager.
                </p>
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Access My Onboarding'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
