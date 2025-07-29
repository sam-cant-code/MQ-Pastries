import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { token, isInitializing } = useContext(StoreContext);
  const [authState, setAuthState] = useState({
    isLoading: true,
    isAuthenticated: false,
    userRole: null,
    error: null
  });

  // Verify authentication and role with the server
  const verifyAuth = async (authToken) => {
    try {
      // Use the environment variable for the backend URL
      const url = import.meta.env.VITE_BACKEND_URL;
      
      const response = await fetch(`${url}/api/user/verify-auth`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Authentication failed');
      }
      
      setAuthState({
        isLoading: false,
        isAuthenticated: true,
        userRole: data.user.role,
        error: null
      });
    } catch (error) {
      console.error('Auth verification failed:', error);
      
      // Clear invalid auth data
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      
      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        userRole: null,
        error: error.message
      });
    }
  };

  useEffect(() => {
    const currentToken = token || localStorage.getItem('token');

    if (!currentToken || currentToken === "null" || currentToken === "undefined") {
      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        userRole: null,
        error: 'No valid token'
      });
      return;
    }

    if (!isInitializing) {
      verifyAuth(currentToken);
    }
  }, [token, isInitializing]);

  // Show loading while verifying
  if (isInitializing || authState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!authState.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check admin access (role verified by server)
  if (adminOnly && authState.userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;