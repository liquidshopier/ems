import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
} from '@mui/icons-material';
import { 
  isSessionManagementEnabled, 
  setSessionManagementEnabled,
  getRemainingSessionTime,
  formatRemainingTime,
  getSessionStartTime,
  initSession
} from '../../utils/sessionManager';
import { getText } from '../../utils/textConfig';
import { useAuth } from '../../context/AuthContext';

function SessionSettings() {
  const { isAuthenticated } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [remainingTime, setRemainingTime] = useState(null);

  useEffect(() => {
    // Load current setting
    setEnabled(isSessionManagementEnabled());
    
    // Update remaining time if session is active
    if (isAuthenticated && isSessionManagementEnabled()) {
      updateRemainingTime();
      const interval = setInterval(() => {
        updateRemainingTime();
      }, 1000); // Update every second
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const updateRemainingTime = () => {
    const remaining = getRemainingSessionTime();
    setRemainingTime(remaining);
  };

  const handleToggle = (event) => {
    setEnabled(event.target.checked);
  };

  const handleSave = () => {
    setSaving(true);
    
    try {
      setSessionManagementEnabled(enabled);
      
      // If disabling, show info message
      // If enabling and user is logged in, initialize session
      if (enabled && isAuthenticated) {
        initSession();
        updateRemainingTime();
      }
      
      setSnackbar({
        open: true,
        message: enabled 
          ? getText('settings.session.messages.enabled', 'Session management enabled. Sessions will expire after 24 hours.')
          : getText('settings.session.messages.disabled', 'Session management disabled. Sessions will persist until manual logout.'),
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: getText('settings.session.messages.saveFailed', 'Failed to save session settings'),
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const sessionStartTime = getSessionStartTime();
  const sessionStartDate = sessionStartTime ? new Date(sessionStartTime) : null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          {getText('settings.session.title', 'Session Management')}
        </Typography>
        <Button
          variant="contained"
          startIcon={saving ? <SaveIcon /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? getText('settings.session.savingButton', 'Saving...') : getText('settings.session.saveButton', 'Save Changes')}
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          {getText('settings.session.subtitle', 'Configure session management settings. When enabled, sessions will automatically expire after 24 hours and will be cleared when the application is closed.')}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={enabled}
                  onChange={handleToggle}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {getText('settings.session.enableLabel', 'Enable Session Management')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {getText('settings.session.enableDescription', 'When enabled, user sessions will expire after 24 hours and be cleared on app close.')}
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Divider />

          {enabled && isAuthenticated && (
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {getText('settings.session.currentSession', 'Current Session')}
              </Typography>
              
              {sessionStartDate && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>{getText('settings.session.sessionStarted', 'Session Started:')}</strong>{' '}
                    {sessionStartDate.toLocaleString()}
                  </Typography>
                </Alert>
              )}
              
              {remainingTime !== null && remainingTime !== Infinity && (
                <Alert 
                  severity={remainingTime < 60 * 60 * 1000 ? 'warning' : 'info'} 
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2">
                    <strong>{getText('settings.session.remainingTime', 'Remaining Time:')}</strong>{' '}
                    {formatRemainingTime(remainingTime)}
                  </Typography>
                </Alert>
              )}
              
              {remainingTime === Infinity && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    {getText('settings.session.sessionUnlimited', 'Session management is disabled. Session will not expire.')}
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {enabled && !isAuthenticated && (
            <Alert severity="info">
              <Typography variant="body2">
                {getText('settings.session.notLoggedIn', 'Please log in to see session information.')}
              </Typography>
            </Alert>
          )}

          {!enabled && (
            <Alert severity="info">
              <Typography variant="body2">
                {getText('settings.session.disabledInfo', 'Session management is currently disabled. User sessions will persist until manual logout.')}
              </Typography>
            </Alert>
          )}
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SessionSettings;

