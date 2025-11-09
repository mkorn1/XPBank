import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const useAuthRedirect = (requireAuth: boolean = true) => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !currentUser) {
      navigate('/login', { replace: true });
    } else if (!requireAuth && currentUser) {
      navigate('/photos', { replace: true });
    }
  }, [currentUser, loading, navigate, requireAuth]);
};

