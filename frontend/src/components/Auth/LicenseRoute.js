import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { licenseAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';

const LicenseRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [hasValidLicense, setHasValidLicense] = useState(false);
  const location = useLocation();

  const checkLicense = useCallback(async () => {
    try {
      const response = await licenseAPI.check();
      setHasValidLicense(response.success && response.valid === true);
    } catch (error) {
      console.error('Error checking license:', error);
      setHasValidLicense(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkLicense();
  }, [checkLicense, location.pathname]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Allow access to license page without validation
  if (location.pathname === '/license') {
    return children;
  }

  // Redirect to license page if license is not valid
  if (!hasValidLicense) {
    return <Navigate to="/license" replace />;
  }

  return children;
};

export default LicenseRoute;

