import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import OnboardingManagerDashboard from './pages/OnboardingManagerDashboard';
import CreateMerchantPage from './pages/CreateMerchantPage';
import MerchantSchedulePage from './pages/MerchantSchedulePage';
import ProtectedRoute from './components/ProtectedRoute';
import GoogleCallback from './pages/GoogleCallback';
import AuthRedirector from './hooks/AuthRedirector';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <Router>
        <AuthRedirector />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<GoogleCallback />} />
          
          <Route 
            path="/onboarding-manager-dashboard" 
            element={
              <ProtectedRoute userType={'onboarding_manager'}>
                <OnboardingManagerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-merchant" 
            element={
              <ProtectedRoute userType={'onboarding_manager'}>
                <CreateMerchantPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/merchant-schedule" 
            element={
              <ProtectedRoute userType={'merchant'}>
                <MerchantSchedulePage />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
