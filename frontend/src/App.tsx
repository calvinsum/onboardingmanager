import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MerchantDashboard from './pages/MerchantDashboard';
import OnboardingManagerDashboard from './pages/OnboardingManagerDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected routes */}
            <Route 
              path="/merchant" 
              element={
                <ProtectedRoute userType="merchant">
                  <Layout>
                    <MerchantDashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/onboarding-manager" 
              element={
                <ProtectedRoute userType="onboarding_manager">
                  <Layout>
                    <OnboardingManagerDashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
