import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const DebugAuth: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (name: string, result: any, error?: any) => {
    const newResult = {
      name,
      timestamp: new Date().toISOString(),
      success: !error,
      result: error ? null : result,
      error: error ? error.message : null,
      status: error?.response?.status || 'success',
      url: error?.config?.url || 'N/A'
    };
    setResults(prev => [...prev, newResult]);
  };

  const testEndpoints = async () => {
    setLoading(true);
    setResults([]);

    // Test basic health check
    try {
      const health = await apiService.healthCheck();
      addResult('Health Check', health);
    } catch (error) {
      addResult('Health Check', null, error);
    }

    // Check localStorage
    const token = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');
    addResult('LocalStorage', { token: token ? 'exists' : 'missing', userType });

    // Test onboarding manager profile
    try {
      const profile = await apiService.getOnboardingManagerProfile();
      addResult('Onboarding Manager Profile', profile);
    } catch (error) {
      addResult('Onboarding Manager Profile', null, error);
    }

    // Test get all merchants
    try {
      const merchants = await apiService.getAllMerchants();
      addResult('Get All Merchants', merchants);
    } catch (error) {
      addResult('Get All Merchants', null, error);
    }

    setLoading(false);
  };

  useEffect(() => {
    testEndpoints();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>
      
      <div className="mb-4">
        <button
          onClick={testEndpoints}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Endpoints'}
        </button>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            }`}
          >
            <h3 className="font-semibold text-lg mb-2">
              {result.name} - {result.success ? '✅' : '❌'}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {result.timestamp} | Status: {result.status} | URL: {result.url}
            </p>
            
            {result.success && (
              <div className="bg-white p-3 rounded border">
                <h4 className="font-medium text-green-700">Success Result:</h4>
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </div>
            )}
            
            {!result.success && (
              <div className="bg-white p-3 rounded border">
                <h4 className="font-medium text-red-700">Error:</h4>
                <p className="text-sm">{result.error}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugAuth; 