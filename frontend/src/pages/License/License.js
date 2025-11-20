import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { licenseAPI } from '../../services/api';
import { getText } from '../../utils/textConfig';

function License() {
  const navigate = useNavigate();
  const [deviceNumber, setDeviceNumber] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const lastValidatedKey = useRef('');

  const formatLicenseKey = useCallback((value) => {
    // Remove all non-digits and limit to 16 digits
    const digits = value.replace(/\D/g, '').substring(0, 16);
    
    if (!digits) return '';
    
    // Format as 1111-2222-3333-4444
    const parts = [
      digits.substring(0, 4),
      digits.substring(4, 8),
      digits.substring(8, 12),
      digits.substring(12, 16)
    ].filter(Boolean);
    
    return parts.join('-');
  }, []);

  const validateLicense = useCallback(async (key) => {
    if (!deviceNumber || !key || lastValidatedKey.current === key) {
      return;
    }

    lastValidatedKey.current = key;
    setValidating(true);
    setError('');

    try {
      const response = await licenseAPI.validate(deviceNumber, key);
      
      if (response.success && response.valid) {
        // License is valid, wait for file write then navigate
        setTimeout(() => navigate('/login'), 500);
      } else {
        setError(getText('license.errors.invalid', ''));
        lastValidatedKey.current = '';
        setValidating(false);
      }
    } catch (err) {
      console.error('Error validating license:', err);
      setError(getText('license.errors.validation', ''));
      lastValidatedKey.current = '';
      setValidating(false);
    }
  }, [deviceNumber, navigate]);

  const checkLicense = useCallback(async () => {
    try {
      const response = await licenseAPI.check();
      if (response.success && response.valid) {
        navigate('/login');
      }
    } catch (err) {
      console.error('Error checking license:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchDeviceNumber = useCallback(async () => {
    try {
      const response = await licenseAPI.getDeviceNumber();
      if (response.success) {
        setDeviceNumber(response.data);
      }
    } catch (err) {
      console.error('Error fetching device number:', err);
      setError(getText('license.errors.deviceNumber', ''));
    }
  }, []);

  const isCompleteLicense = useCallback((key) => {
    return key.length === 19 && key.replace(/-/g, '').length === 16;
  }, []);

  const handleLicenseKeyChange = useCallback((event) => {
    const value = event.target.value;
    setError('');
    const formatted = formatLicenseKey(value);
    setLicenseKey(formatted);
  }, [formatLicenseKey]);

  const handlePaste = useCallback((event) => {
    event.preventDefault();
    const pastedValue = event.clipboardData.getData('text');
    const formatted = formatLicenseKey(pastedValue);
    setLicenseKey(formatted);
    setError('');
  }, [formatLicenseKey]);

  useEffect(() => {
    checkLicense();
    fetchDeviceNumber();
  }, [checkLicense, fetchDeviceNumber]);

  // Validate license key when complete
  useEffect(() => {
    if (!isCompleteLicense(licenseKey) || !deviceNumber || validating || lastValidatedKey.current === licenseKey) {
      return;
    }

    const timer = setTimeout(() => {
      validateLicense(licenseKey);
    }, 300);

    return () => clearTimeout(timer);
  }, [licenseKey, deviceNumber, validating, isCompleteLicense, validateLicense]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress sx={{ color: '#000000' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            {getText('license.title', '')}
          </Typography>

          <TextField
            fullWidth
            label={getText('license.deviceNumber', '')}
            value={deviceNumber}
            disabled
            variant="outlined"
            sx={{
              '& .MuiInputBase-input.Mui-disabled': {
                WebkitTextFillColor: '#000000',
                backgroundColor: '#f5f5f5',
              },
            }}
          />

          <TextField
            fullWidth
            label={getText('license.licenseKey', '')}
            value={licenseKey}
            onChange={handleLicenseKeyChange}
            onPaste={handlePaste}
            variant="outlined"
            placeholder={getText('license.placeholder', '')}
            disabled={validating}
            error={!!error}
            helperText={error || (validating ? getText('license.validating', '') : '')}
            inputProps={{
              maxLength: 19,
            }}
          />

          {validating && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default License;

