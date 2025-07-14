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
      // Verify the access token by fetching the onboarding record
      const onboardingRecord = await getOnboardingByToken(accessToken);
      
      // Store the access token for merchant access
      localStorage.setItem('merchantAccessToken', accessToken);
      localStorage.setItem('userType', 'merchant');
      localStorage.setItem('onboardingRecord', JSON.stringify(onboardingRecord));
      
      // Navigate to merchant dashboard
      navigate('/merchant-schedule');
    } catch (error: any) {
      setError('Invalid or expired access token. Please check your token and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center shadow-medium">
                <span className="text-white font-bold text-2xl">S</span>
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-text-main">StoreHub</h1>
                <p className="text-sm text-text-muted">Merchant Onboarding</p>
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-text-main">
            Welcome Back
          </h2>
          <p className="mt-2 text-text-muted">
            Sign in to access your onboarding portal
          </p>
        </div>

        {/* Main Login Card */}
        <div className="card">
          {/* Onboarding Manager Google Login */}
          {userType === 'onboarding_manager' && (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-divider" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-text-muted">Sign in with your @storehub.com email</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="group relative w-full flex justify-center items-center py-3 px-4 border border-divider text-sm font-semibold rounded-lg text-text-main bg-white hover:bg-light-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 shadow-soft hover:shadow-medium"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              
              <div className="text-center">
                <p className="text-xs text-text-muted">
                  Only @storehub.com email addresses are allowed
                </p>
              </div>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setUserType('merchant')}
                  className="text-xs text-text-muted hover:text-primary-600 underline"
                >
                  ← Back to merchant login
                </button>
              </div>
            </div>
          )}

          {/* Merchant Access Token Login */}
          {userType === 'merchant' && (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-divider" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-text-muted">Enter your access token</span>
                </div>
              </div>
              
              <form className="space-y-4" onSubmit={handleMerchantTokenLogin}>
                <div>
                  <label htmlFor="access-token" className="block text-sm font-semibold text-text-main mb-2">
                    Access Token
                  </label>
                  <input
                    id="access-token"
                    name="access-token"
                    type="text"
                    required
                    className="input-field"
                    placeholder="Enter your access token"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                  />
                  <p className="mt-2 text-sm text-text-muted">
                    🔑 Your access token was provided by your onboarding manager
                  </p>
                </div>

                {error && (
                  <div className="card border-red-200 bg-red-50">
                    <div className="flex items-center">
                      <span className="text-red-500 mr-2">❌</span>
                      <p className="text-red-800 text-sm font-medium">{error}</p>
                    </div>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      'Access My Onboarding'
                    )}
                  </button>
                </div>
              </form>
              
              <div className="text-center">
                <p className="text-xs text-text-muted">
                  Need help? Contact your onboarding manager.
                </p>
                <button
                  type="button"
                  onClick={() => setUserType('onboarding_manager')}
                  className="text-xs text-primary-600 hover:text-primary-700 underline mt-1"
                >
                  Onboarding manager sign in
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-text-muted">
            © 2024 StoreHub. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
