import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

const AuthRedirector = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // This effect runs when the user state changes.
    if (user) {
      if (user.type === 'merchant') {
        navigate('/merchant-schedule', { replace: true });
      } else if (user.type === 'onboarding_manager') {
        navigate('/onboarding-manager-dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  // This component does not render anything.
  return null;
};

export default AuthRedirector; 