import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MerchantDashboard from './pages/MerchantDashboard';
import OnboardingManagerDashboard from './pages/OnboardingManagerDashboard';
import CreateMerchantPage from './pages/CreateMerchantPage';
import GoogleCallback from './pages/GoogleCallback';
import DebugAuth from './pages/DebugAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import EditOnboardingPage from './pages/EditOnboardingPage';
import ViewOnboardingPage from './pages/ViewOnboardingPage';
import ScheduleOnboardingPage from './pages/ScheduleOnboardingPage';
import MerchantSchedulePage from './pages/MerchantSchedulePage';
import TrainerManagementPage from './pages/TrainerManagementPage';
import TrainingScheduleListPage from './pages/TrainingScheduleListPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import './App.css';

// Force frontend redeployment to pick up new API URL environment variables
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<GoogleCallback />} />
            <Route path="/debug" element={<DebugAuth />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
            
            {/* Merchant token-based route (no auth required) */}
            <Route path="/merchant-schedule" element={<MerchantSchedulePage />} />
            
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
            
            <Route 
              path="/create-merchant" 
              element={
                <ProtectedRoute userType="onboarding_manager">
                  <CreateMerchantPage />
                </ProtectedRoute>
              } 
            />
            
            <Route
              path="/edit-onboarding/:id"
              element={
                <ProtectedRoute userType="onboarding_manager">
                  <EditOnboardingPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/view-onboarding/:id"
              element={
                <ProtectedRoute userType="onboarding_manager">
                  <ViewOnboardingPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/schedule-onboarding/:id"
              element={
                <ProtectedRoute userType="onboarding_manager">
                  <ScheduleOnboardingPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/trainer-management"
              element={
                <ProtectedRoute userType="onboarding_manager">
                  <TrainerManagementPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/training-schedules"
              element={
                <ProtectedRoute userType="onboarding_manager">
                  <Layout>
                    <TrainingScheduleListPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route path="/merchant-dashboard" element={<MerchantDashboard />} />
            
            {/* Dashboard redirect */}
            <Route 
              path="/dashboard" 
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
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
