import React, { useState, useEffect } from 'react';
import { getOnboardingByToken } from '../services/api';

const DebugAuth: React.FC = () => {
  const [localStorageData, setLocalStorageData] = useState<any>({});
  const [testToken, setTestToken] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check localStorage data
    const data = {
      merchantAccessToken: localStorage.getItem('merchantAccessToken'),
      userType: localStorage.getItem('userType'),
      onboardingRecord: localStorage.getItem('onboardingRecord'),
      authToken: localStorage.getItem('authToken'),
    };
    setLocalStorageData(data);
  }, []);

  const handleTestToken = async () => {
    if (!testToken) return;
    
    setLoading(true);
    setTestResult(null);
    
    try {
      const result = await getOnboardingByToken(testToken);
      setTestResult({ success: true, data: result });
    } catch (error: any) {
      setTestResult({ 
        success: false, 
        error: error.message,
        status: error.response?.status,
        data: error.response?.data 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearStorage = () => {
    localStorage.clear();
    setLocalStorageData({});
    setTestResult(null);
  };

  const handleSetTestData = () => {
    const testData = {
      id: 'test-id',
      picName: 'Test User',
      picEmail: 'test@example.com',
      businessName: 'Test Business'
    };
    
    localStorage.setItem('merchantAccessToken', 'test-token');
    localStorage.setItem('userType', 'merchant');
    localStorage.setItem('onboardingRecord', JSON.stringify(testData));
    
    // Refresh the display
    const data = {
      merchantAccessToken: localStorage.getItem('merchantAccessToken'),
      userType: localStorage.getItem('userType'),
      onboardingRecord: localStorage.getItem('onboardingRecord'),
      authToken: localStorage.getItem('authToken'),
    };
    setLocalStorageData(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Debug Authentication</h1>
          
          {/* LocalStorage Debug */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">LocalStorage Data</h2>
            <div className="bg-gray-100 p-4 rounded-md">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(localStorageData, null, 2)}
              </pre>
            </div>
            <div className="mt-4 space-x-4">
              <button
                onClick={handleClearStorage}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Clear Storage
              </button>
              <button
                onClick={handleSetTestData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Set Test Data
              </button>
            </div>
          </div>

          {/* Token Test */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Test Token API</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Token
                </label>
                <input
                  type="text"
                  value={testToken}
                  onChange={(e) => setTestToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter a token to test"
                />
              </div>
              <button
                onClick={handleTestToken}
                disabled={loading || !testToken}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Token'}
              </button>
            </div>
            
            {testResult && (
              <div className="mt-4">
                <h3 className="text-md font-medium text-gray-800 mb-2">Test Result</h3>
                <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Environment Info */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Environment Info</h2>
            <div className="bg-gray-100 p-4 rounded-md">
              <pre className="text-sm text-gray-700">
                API URL: {process.env.REACT_APP_API_URL || 'https://onboardingmanager.onrender.com/api'}
                {'\n'}User Agent: {navigator.userAgent}
                {'\n'}Local Storage Available: {typeof(Storage) !== "undefined" ? 'Yes' : 'No'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugAuth; 