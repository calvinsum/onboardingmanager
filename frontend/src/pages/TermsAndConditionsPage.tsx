import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { acknowledgeTerms, checkTermsAcknowledgment } from '../services/api';

interface TermsConditions {
  id: string;
  version: string;
  content: string;
  effectiveDate: string;
  isActive: boolean;
}

const TermsAndConditionsPage: React.FC = () => {
  const [termsConditions, setTermsConditions] = useState<TermsConditions | null>(null);
  const [fullName, setFullName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTermsAndCheckStatus = async () => {
      const accessToken = localStorage.getItem('merchantAccessToken');
      
      if (!accessToken) {
        navigate('/login');
        return;
      }

      try {
        // Check if terms are already acknowledged
        const acknowledgmentStatus = await checkTermsAcknowledgment(accessToken);
        
        if (acknowledgmentStatus.acknowledged) {
          // Already acknowledged current terms, redirect to scheduling
          navigate('/merchant-schedule');
          return;
        }

        // Get current terms to display
        const currentTerms = acknowledgmentStatus.currentTerms;
        if (currentTerms) {
          setTermsConditions(currentTerms);
        } else {
          // Temporary workaround: If no T&C available, redirect to scheduling after 5 seconds
          setError('No terms and conditions are currently active. Redirecting to scheduling in 5 seconds...');
          setTimeout(() => {
            navigate('/merchant-schedule');
          }, 5000);
        }
      } catch (error: any) {
        console.error('Error fetching terms:', error);
        
        // Check if this is a 404 error (no terms found)
        if (error.response?.status === 404) {
          setError('Terms and conditions are being set up. Redirecting to scheduling in 5 seconds...');
          setTimeout(() => {
            navigate('/merchant-schedule');
          }, 5000);
        } else {
          setError('Failed to load terms and conditions. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTermsAndCheckStatus();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreed) {
      toast.error('You must agree to the terms and conditions to proceed.');
      return;
    }

    if (!fullName.trim()) {
      toast.error('Please enter your full name.');
      return;
    }

    if (!termsConditions) {
      toast.error('Terms and conditions not loaded.');
      return;
    }

    const accessToken = localStorage.getItem('merchantAccessToken');
    if (!accessToken) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await acknowledgeTerms(accessToken, {
        name: fullName.trim(),
        termsVersionId: termsConditions.id,
      });

      toast.success('Terms and conditions acknowledged successfully!');
      
      // Redirect to scheduling page
      navigate('/merchant-schedule');
    } catch (error: any) {
      console.error('Error acknowledging terms:', error);
      
      if (error.response?.status === 404) {
        toast.error('Access token expired. Please contact your onboarding manager.');
        localStorage.removeItem('merchantAccessToken');
        localStorage.removeItem('onboardingRecord');
        navigate('/login');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to acknowledge terms and conditions. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('merchantAccessToken');
    localStorage.removeItem('onboardingRecord');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading terms and conditions...</p>
        </div>
      </div>
    );
  }

  if (error && !termsConditions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mr-2"
          >
            Retry
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/StoreHub_logo.png" 
                alt="StoreHub Logo" 
                className="h-8 w-8"
              />
              <h1 className="text-xl font-bold text-gray-900">Merchant Onboarding</h1>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Terms and Conditions</h2>
            <p className="text-gray-600">
              Please read and acknowledge the following terms and conditions before proceeding with your onboarding.
            </p>
            {termsConditions && (
              <div className="mt-2 text-sm text-gray-500">
                Version: {termsConditions.version} | 
                Effective Date: {new Date(termsConditions.effectiveDate).toLocaleDateString()}
              </div>
            )}
          </div>

          {termsConditions && (
            <>
              {/* Terms Content */}
              <div className="mb-6">
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="prose prose-sm max-w-none">
                    <div 
                      className="whitespace-pre-wrap text-gray-700"
                      dangerouslySetInnerHTML={{ __html: termsConditions.content }}
                    />
                  </div>
                </div>
              </div>

              {/* Acknowledgment Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="agreed"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={submitting}
                  />
                  <label htmlFor="agreed" className="text-sm text-gray-700">
                    I have read and agree to the terms and conditions outlined above. 
                    I understand that this acknowledgment is required to proceed with the onboarding process.
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!agreed || !fullName.trim() || submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Submitting...' : 'Agree and Continue'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage; 