import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isOnboardingManager = user?.type === 'onboarding_manager';

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-light-100">
      {/* Header */}
      <header className="bg-dark-900 shadow-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* Logo placeholder - will be replaced with actual logo */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    StoreHub
                  </h1>
                  <p className="text-xs text-text-sidebar">
                    Merchant Onboarding
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {user?.fullName || user?.email}
                  </p>
                  <p className="text-xs text-text-sidebar">
                    {isOnboardingManager ? 'Onboarding Manager' : 'Merchant'}
                  </p>
                </div>
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-soft hover:shadow-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar (if needed) */}
      {isOnboardingManager && (
        <nav className="bg-white border-b border-divider shadow-soft">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <Link
                to="/onboarding-manager-dashboard"
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  location.pathname === '/onboarding-manager-dashboard'
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-text-muted hover:text-text-main hover:border-gray-300'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/create-merchant"
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  location.pathname === '/create-merchant'
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-text-muted hover:text-text-main hover:border-gray-300'
                }`}
              >
                Create Merchant
              </Link>
              <Link
                to="/training-schedules"
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  location.pathname === '/training-schedules'
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-text-muted hover:text-text-main hover:border-gray-300'
                }`}
              >
                Training Schedules
              </Link>
              <Link
                to="/trainer-management"
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  location.pathname === '/trainer-management'
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-text-muted hover:text-text-main hover:border-gray-300'
                }`}
              >
                Trainer Management
              </Link>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout; 