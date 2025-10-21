import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const RouteHandler = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If we're on /index.html, redirect to home
    if (location.pathname === '/index.html') {
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  return children;
};

export default RouteHandler;