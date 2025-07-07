import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const [userType, setUserType] = useState<'merchant' | 'onboarding_manager'>('merchant');
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  const handleMerchantTokenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await auth.loginWithToken(accessToken);
      // Navigation is now handled by AuthRedirector
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Invalid or expired access token.');
    } finally {
      setLoading(false);
    }
  };

  const handleManagerLogin = () => {
    // Use the production URL when not in a local development environment.
    const isLocal = window.location.hostname === 'localhost';
    const backendBaseUrl = isLocal 
      ? (process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001')
      : 'https://onboardingmanager.onrender.com';

    window.location.href = `${backendBaseUrl}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to StoreHub</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Merchant Onboarding Platform</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700">I am a:</label>
            <div className="mt-2 flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600"
                  name="userType"
                  value="merchant"
                  checked={userType === 'merchant'}
                  onChange={() => setUserType('merchant')}
                />
                <span className="ml-2 text-gray-700">Merchant</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600"
                  name="userType"
                  value="onboarding_manager"
                  checked={userType === 'onboarding_manager'}
                  onChange={() => setUserType('onboarding_manager')}
                />
                <span className="ml-2 text-gray-700">Onboarding Manager</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {userType === 'merchant' ? (
            <form className="space-y-6" onSubmit={handleMerchantTokenLogin}>
              <div>
                <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700">
                  Access Token
                </label>
                <input
                  id="accessToken"
                  name="accessToken"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your access token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
                <p className="mt-2 text-xs text-gray-500">Your access token was provided by your onboarding manager.</p>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Accessing...' : 'Access My Onboarding'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <p className="text-sm text-center text-gray-600">
                Sign in with your @storehub.com email
              </p>
              <button
                onClick={handleManagerLogin}
                className="w-full mt-4 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.423 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.03-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.203 2.398.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.338 4.695-4.566 4.943.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.003 10.003 0 0020 10c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                </svg>
                Sign in with Google
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
