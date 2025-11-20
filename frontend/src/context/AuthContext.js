import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { authAPI } from '../services/api';
import { 
  isSessionManagementEnabled, 
  isSessionExpired, 
  initSession, 
  clearSession
} from '../utils/sessionManager';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionCheckInterval = useRef(null);

  const logout = useCallback(() => {
    // Clear session data
    clearSession();
    setUser(null);
    
    // Clear session check interval
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
      sessionCheckInterval.current = null;
    }
  }, []);

  // Start periodic session expiration check
  const startSessionCheck = useCallback(() => {
    if (!isSessionManagementEnabled()) {
      return;
    }

    // Clear any existing interval
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
    }

    // Check every minute
    sessionCheckInterval.current = setInterval(() => {
      if (isSessionExpired()) {
        // Session expired, logout user
        logout();
        // Optionally show a message or redirect
        window.location.href = '/login';
      }
    }, 60 * 1000); // Check every minute
  }, [logout]);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      // Check session expiration if session management is enabled
      if (isSessionManagementEnabled() && isSessionExpired()) {
        // Session expired, clear everything
        clearSession();
        setLoading(false);
        return;
      }
      
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      authAPI.verify()
        .then(() => {
          setLoading(false);
          // Start session expiration check if enabled
          startSessionCheck();
        })
        .catch(() => {
          logout();
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    // Cleanup on unmount
    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [startSessionCheck, logout]);

  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      // Initialize session if session management is enabled
      if (isSessionManagementEnabled()) {
        initSession();
        startSessionCheck();
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.toString() };
    }
  };


  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const value = {
    user,
    login,
    logout,
    isAdmin,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

