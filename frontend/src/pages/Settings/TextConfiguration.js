import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  RestartAlt as RestartAltIcon,
} from '@mui/icons-material';
import { getTextConfig, saveTextConfig, resetTextConfig } from '../../utils/textConfig';
import TEXT_CONFIG_DEFAULT from '../../config/text.config';
import { getText } from '../../utils/textConfig';

function TextConfiguration() {
  const [textConfig, setTextConfig] = useState(() => getTextConfig());
  const [hasChanges, setHasChanges] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load saved configuration on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    try {
      const config = getTextConfig();
      setTextConfig(config);
    } catch (error) {
      console.error('Error loading text config:', error);
      setTextConfig(TEXT_CONFIG_DEFAULT);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (path, value) => {
    const newConfig = JSON.parse(JSON.stringify(textConfig)); // Deep clone
    
    // Navigate to the nested property and update it
    const keys = path.split('.');
    let current = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      // Create nested object if it doesn't exist
      if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setTextConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = () => {
    setSaving(true);
    if (saveTextConfig(textConfig)) {
      setHasChanges(false);
        setSnackbar({
          open: true,
          message: getText('settings.textConfiguration.messages.saveSuccess', 'Text configuration saved successfully!'),
          severity: 'success'
        });
    } else {
        setSnackbar({
          open: true,
          message: getText('settings.textConfiguration.messages.saveFailed', 'Failed to save configuration'),
          severity: 'error'
        });
    }
    setSaving(false);
  };

  const handleReset = () => {
    setSaving(true);
    if (resetTextConfig()) {
      const defaultConfig = getTextConfig();
      setTextConfig(defaultConfig);
      setHasChanges(false);
        setSnackbar({
          open: true,
          message: getText('settings.textConfiguration.messages.resetSuccess', 'Configuration reset to defaults!'),
          severity: 'info'
        });
      setTimeout(() => window.location.reload(), 1500);
    } else {
        setSnackbar({
          open: true,
          message: getText('settings.textConfiguration.messages.resetFailed', 'Failed to reset configuration'),
          severity: 'error'
        });
    }
    setSaving(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Recursive function to render nested fields
  const renderField = (path, label, value, level = 0) => {
    // Skip if value is undefined or null
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return (
        <Grid item xs={12} sm={6} key={path}>
          <TextField
            fullWidth
            label={label}
            value={value}
            onChange={(e) => handleTextChange(path, e.target.value)}
            size="small"
            multiline={String(value).length > 50}
            rows={String(value).length > 50 ? 2 : 1}
          />
        </Grid>
      );
    }

    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return null;
      }

      return (
        <Grid item xs={12} key={path}>
          <Box sx={{ pl: level * 2, mt: level > 0 ? 2 : 0 }}>
            <Divider sx={{ mb: 1 }} />
            <Typography 
              variant={level === 0 ? "subtitle1" : "subtitle2"} 
              color="primary" 
              gutterBottom
              fontWeight="bold"
            >
              {label}
            </Typography>
            <Grid container spacing={2}>
              {entries.map(([key, val]) => {
                const fieldLabel = key.replace(/([A-Z])/g, ' $1').trim();
                const fieldPath = `${path}.${key}`;
                const field = renderField(fieldPath, fieldLabel, val, level + 1);
                return field;
              }).filter(Boolean)}
            </Grid>
          </Box>
        </Grid>
      );
    }

    return null;
  };

  const renderSection = (title, sectionKey, sectionData) => {
    // Skip if sectionData is undefined, null, or not an object
    if (!sectionData || typeof sectionData !== 'object' || Array.isArray(sectionData)) {
      return null;
    }

    const entries = Object.entries(sectionData);
    if (entries.length === 0) {
      return null;
    }

    if (typeof sectionData === 'string' || typeof sectionData === 'number') {
      return renderField(sectionKey, title, sectionData);
    }

    return (
      <Accordion key={sectionKey} defaultExpanded={false}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight="bold" variant="h6">{title}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {entries.map(([key, value]) => {
              const fieldLabel = key.replace(/([A-Z])/g, ' $1').trim();
              const fieldPath = `${sectionKey}.${key}`;
              const field = renderField(fieldPath, fieldLabel, value, 0);
              return field;
            }).filter(Boolean)}
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          {getText('settings.textConfiguration.title', 'Text Configuration')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
            color="warning"
            disabled={saving}
          >
            {getText('settings.textConfiguration.resetButton', 'Reset to Default')}
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? getText('settings.textConfiguration.savingButton', 'Saving...') : getText('settings.textConfiguration.saveButton', 'Save Changes')}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          {getText('settings.textConfiguration.subtitle', 'Customize all text labels and messages used throughout the application. Changes will be saved locally and applied immediately.')}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* App Name and Basic Info */}
          {textConfig.appName !== undefined && textConfig.appFullName !== undefined && (
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight="bold">{getText('settings.textConfiguration.sections.appInfo', 'Application Info')}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="App Name"
                      value={textConfig.appName || ''}
                      onChange={(e) => handleTextChange('appName', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="App Full Name"
                      value={textConfig.appFullName || ''}
                      onChange={(e) => handleTextChange('appFullName', e.target.value)}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Navigation */}
          {textConfig.nav && renderSection(getText('settings.textConfiguration.sections.navigation', 'Navigation'), 'nav', textConfig.nav)}

          {/* Dashboard */}
          {textConfig.dashboard && renderSection(getText('settings.textConfiguration.sections.dashboard', 'Dashboard'), 'dashboard', textConfig.dashboard)}

          {/* Products */}
          {textConfig.products && renderSection(getText('settings.textConfiguration.sections.products', 'Products'), 'products', textConfig.products)}

          {/* Sales */}
          {textConfig.sales && renderSection(getText('settings.textConfiguration.sections.sales', 'Sales'), 'sales', textConfig.sales)}

          {/* Customers */}
          {textConfig.customers && renderSection(getText('settings.textConfiguration.sections.customers', 'Customers'), 'customers', textConfig.customers)}

          {/* Settings */}
          {textConfig.settings && renderSection(getText('settings.textConfiguration.sections.settings', 'Settings'), 'settings', textConfig.settings)}

          {/* Authentication */}
          {textConfig.auth && renderSection(getText('settings.textConfiguration.sections.auth', 'Authentication'), 'auth', textConfig.auth)}

          {/* User Management */}
          {textConfig.userManagement && renderSection(getText('settings.textConfiguration.sections.userManagement', 'User Management'), 'userManagement', textConfig.userManagement)}

          {/* Text Configuration */}
          {textConfig.textConfig && renderSection(getText('settings.textConfiguration.sections.textConfig', 'Text Configuration'), 'textConfig', textConfig.textConfig)}

          {/* Appearance Configuration */}
          {textConfig.appearanceConfig && renderSection(getText('settings.textConfiguration.sections.appearance', 'Appearance'), 'appearanceConfig', textConfig.appearanceConfig)}

          {/* Log History */}
          {textConfig.logs && renderSection(getText('settings.textConfiguration.sections.logs', 'Log History'), 'logs', textConfig.logs)}

          {/* Common */}
          {textConfig.common && renderSection(getText('settings.textConfiguration.sections.common', 'Common Elements'), 'common', textConfig.common)}
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

export default TextConfiguration;

