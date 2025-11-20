import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Card,
  CardContent,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  RestartAlt as RestartAltIcon,
} from '@mui/icons-material';
import { getText } from '../../utils/textConfig';
import { formatDateTime as formatDateTimeUtil } from '../../utils/timezone';

const DEFAULT_STYLES = {
  fontFamily: 'Roboto, sans-serif',
  fontSize: '14',
  inputFontFamily: 'Roboto, sans-serif',
  inputFontSize: '14',
  headingFontFamily: 'Roboto, sans-serif',
  borderRadius: '4',
  primaryColor: '#1976d2',
  secondaryColor: '#dc004e',
  successColor: '#2e7d32',
  errorColor: '#d32f2f',
  warningColor: '#ed6c02',
  infoColor: '#0288d1',
  backgroundColor: '#f5f5f5',
  timezoneOffset: '9', // Default GMT+9
  currencySymbol: '$', // Default currency symbol
  currencyPosition: 'before', // Default: before (e.g., $100 or 100$)
  currencySymbolColor: '#666666', // Default currency symbol color
  currencySymbolWeight: 'bold', // Default currency symbol font weight
  currencySymbolSize: '1em', // Default currency symbol size (relative to number)
};

const COMMON_FONTS = [
  'Roboto, sans-serif',
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Times New Roman, serif',
  'Georgia, serif',
  'Courier New, monospace',
  'Verdana, sans-serif',
  'Tahoma, sans-serif',
  'Trebuchet MS, sans-serif',
  'Lucida Console, monospace',
  'Inter, sans-serif',
  'Poppins, sans-serif',
  'Montserrat, sans-serif',
  'Open Sans, sans-serif',
  'Lato, sans-serif',
];

function AppearanceConfiguration() {
  const [styles, setStyles] = useState(DEFAULT_STYLES);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    try {
      const savedStyles = localStorage.getItem('app_styles');
      if (savedStyles) {
        setStyles(JSON.parse(savedStyles));
      }
    } catch (error) {
      console.error('Error loading appearance config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply styles to the document
    document.documentElement.style.setProperty('--font-family', styles.fontFamily);
    document.documentElement.style.setProperty('--font-size', `${styles.fontSize}px`);
    document.documentElement.style.setProperty('--input-font-family', styles.inputFontFamily);
    document.documentElement.style.setProperty('--input-font-size', `${styles.inputFontSize}px`);
    document.documentElement.style.setProperty('--heading-font-family', styles.headingFontFamily);
    document.documentElement.style.setProperty('--border-radius', `${styles.borderRadius}px`);
    document.documentElement.style.setProperty('--primary-color', styles.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', styles.secondaryColor);
    document.documentElement.style.setProperty('--background-color', styles.backgroundColor);

    // Apply to MUI and global styles
    const styleEl = document.getElementById('custom-input-styles') || document.createElement('style');
    styleEl.id = 'custom-input-styles';
    styleEl.innerHTML = `
      .MuiInputBase-root,
      .MuiInputBase-input,
      .MuiTextField-root input,
      .MuiSelect-select {
        font-family: ${styles.inputFontFamily} !important;
        font-size: ${styles.inputFontSize}px !important;
      }
      .MuiTypography-h1,
      .MuiTypography-h2,
      .MuiTypography-h3,
      .MuiTypography-h4,
      .MuiTypography-h5,
      .MuiTypography-h6 {
        font-family: ${styles.headingFontFamily} !important;
      }
      body {
        font-family: ${styles.fontFamily} !important;
        font-size: ${styles.fontSize}px !important;
        background-color: ${styles.backgroundColor} !important;
      }
      .MuiPaper-root {
        border-radius: ${styles.borderRadius}px !important;
      }
      .MuiButton-root {
        border-radius: ${styles.borderRadius}px !important;
      }
      .MuiButton-containedPrimary {
        background-color: ${styles.primaryColor} !important;
      }
      .MuiButton-containedSecondary {
        background-color: ${styles.secondaryColor} !important;
      }
      .MuiChip-colorPrimary {
        background-color: ${styles.primaryColor} !important;
      }
      .MuiAppBar-colorPrimary {
        background-color: ${styles.primaryColor} !important;
      }
    `;
    if (!document.getElementById('custom-input-styles')) {
      document.head.appendChild(styleEl);
    }
  }, [styles]);

  const handleStyleChange = (key, value) => {
    setStyles((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    localStorage.setItem('app_styles', JSON.stringify(styles));
    setHasChanges(false);
    setSnackbar({
      open: true,
      message: getText('settings.appearanceConfig.saveSuccess', 'Appearance settings saved successfully!'),
      severity: 'success'
    });
    setSaving(false);
  };

  const handleReset = () => {
    localStorage.removeItem('app_styles');
    setStyles(DEFAULT_STYLES);
    setHasChanges(false);
    setSnackbar({
      open: true,
      message: getText('settings.appearanceConfig.resetSuccess', 'Appearance reset to defaults!'),
      severity: 'info'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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
          {getText('settings.appearanceConfig.title', 'Appearance & Styling')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
            color="warning"
            disabled={saving}
          >
            {getText('settings.appearanceConfig.resetButton', 'Reset to Default')}
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? getText('settings.appearanceConfig.savingButton', 'Saving...') : getText('settings.appearanceConfig.saveButton', 'Save Changes')}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Typography Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              {getText('settings.appearanceConfig.sections.typography', 'Typography')}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              {getText('settings.appearanceConfig.typography.subtitle', 'Customize fonts used throughout the application')}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label={getText('settings.appearanceConfig.typography.bodyFont', 'Body Font Family')}
                value={styles.fontFamily}
                onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                placeholder="e.g., Arial, Roboto, sans-serif"
                helperText={getText('settings.appearanceConfig.typography.bodyFontHelper', 'Enter any font name installed on your system')}
              />

              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                  {getText('settings.appearanceConfig.typography.commonFonts', 'Common fonts:')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {COMMON_FONTS.slice(0, 8).map((font) => (
                    <Button
                      key={font}
                      size="small"
                      variant="outlined"
                      onClick={() => handleStyleChange('fontFamily', font)}
                      sx={{ fontSize: '0.7rem', py: 0.5 }}
                    >
                      {font.split(',')[0]}
                    </Button>
                  ))}
                </Box>
              </Box>

              <TextField
                fullWidth
                type="number"
                label={getText('settings.appearanceConfig.typography.bodySize', 'Body Font Size (px)')}
                value={styles.fontSize}
                onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                InputProps={{ inputProps: { min: 10, max: 24 } }}
              />

              <Divider />

              <TextField
                fullWidth
                label={getText('settings.appearanceConfig.typography.headingFont', 'Heading Font Family')}
                value={styles.headingFontFamily}
                onChange={(e) => handleStyleChange('headingFontFamily', e.target.value)}
                placeholder="e.g., Georgia, Poppins, serif"
                helperText={getText('settings.appearanceConfig.typography.headingFontHelper', 'Custom font for titles and headings')}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Input Fields Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              {getText('settings.appearanceConfig.sections.inputFields', 'Input Fields')}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              {getText('settings.appearanceConfig.inputFields.subtitle', 'Customize the appearance of input fields')}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label={getText('settings.appearanceConfig.typography.inputFont', 'Input Font Family')}
                value={styles.inputFontFamily}
                onChange={(e) => handleStyleChange('inputFontFamily', e.target.value)}
                placeholder="e.g., Consolas, monospace"
                helperText={getText('settings.appearanceConfig.typography.inputFontHelper', 'Font for text input fields')}
              />

              <TextField
                fullWidth
                type="number"
                label={getText('settings.appearanceConfig.typography.inputSize', 'Input Font Size (px)')}
                value={styles.inputFontSize}
                onChange={(e) => handleStyleChange('inputFontSize', e.target.value)}
                InputProps={{ inputProps: { min: 10, max: 24 } }}
              />

              <TextField
                fullWidth
                type="number"
                label={getText('settings.appearanceConfig.typography.borderRadius', 'Border Radius (px)')}
                value={styles.borderRadius}
                onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                InputProps={{ inputProps: { min: 0, max: 20 } }}
                helperText={getText('settings.appearanceConfig.typography.borderRadiusHelper', 'Roundness of corners (0 = square, 20 = very round)')}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Color Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              {getText('settings.appearanceConfig.sections.colors', 'Colors')}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              {getText('settings.appearanceConfig.colors.subtitle', 'Customize the color scheme of your application')}
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {getText('settings.appearanceConfig.colors.primary', 'Primary Color')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={styles.primaryColor}
                      onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                      style={{
                        width: '60px',
                        height: '40px',
                        border: '2px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                    <TextField
                      size="small"
                      value={styles.primaryColor}
                      onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                      placeholder="#1976d2"
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {getText('settings.appearanceConfig.colors.primaryHelper', 'Main theme color')}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {getText('settings.appearanceConfig.colors.secondary', 'Secondary Color')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={styles.secondaryColor}
                      onChange={(e) => handleStyleChange('secondaryColor', e.target.value)}
                      style={{
                        width: '60px',
                        height: '40px',
                        border: '2px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                    <TextField
                      size="small"
                      value={styles.secondaryColor}
                      onChange={(e) => handleStyleChange('secondaryColor', e.target.value)}
                      placeholder="#dc004e"
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {getText('settings.appearanceConfig.colors.secondaryHelper', 'Accent color')}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {getText('settings.appearanceConfig.colors.success', 'Success Color')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={styles.successColor}
                      onChange={(e) => handleStyleChange('successColor', e.target.value)}
                      style={{
                        width: '60px',
                        height: '40px',
                        border: '2px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                    <TextField
                      size="small"
                      value={styles.successColor}
                      onChange={(e) => handleStyleChange('successColor', e.target.value)}
                      placeholder="#2e7d32"
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {getText('settings.appearanceConfig.colors.successHelper', 'Success messages')}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {getText('settings.appearanceConfig.colors.error', 'Error Color')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={styles.errorColor}
                      onChange={(e) => handleStyleChange('errorColor', e.target.value)}
                      style={{
                        width: '60px',
                        height: '40px',
                        border: '2px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                    <TextField
                      size="small"
                      value={styles.errorColor}
                      onChange={(e) => handleStyleChange('errorColor', e.target.value)}
                      placeholder="#d32f2f"
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {getText('settings.appearanceConfig.colors.errorHelper', 'Error messages')}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {getText('settings.appearanceConfig.colors.warning', 'Warning Color')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={styles.warningColor}
                      onChange={(e) => handleStyleChange('warningColor', e.target.value)}
                      style={{
                        width: '60px',
                        height: '40px',
                        border: '2px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                    <TextField
                      size="small"
                      value={styles.warningColor}
                      onChange={(e) => handleStyleChange('warningColor', e.target.value)}
                      placeholder="#ed6c02"
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {getText('settings.appearanceConfig.colors.warningHelper', 'Warning alerts')}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {getText('settings.appearanceConfig.colors.info', 'Info Color')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={styles.infoColor}
                      onChange={(e) => handleStyleChange('infoColor', e.target.value)}
                      style={{
                        width: '60px',
                        height: '40px',
                        border: '2px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                    <TextField
                      size="small"
                      value={styles.infoColor}
                      onChange={(e) => handleStyleChange('infoColor', e.target.value)}
                      placeholder="#0288d1"
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {getText('settings.appearanceConfig.colors.infoHelper', 'Info notifications')}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {getText('settings.appearanceConfig.colors.background', 'Background Color')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={styles.backgroundColor}
                      onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                      style={{
                        width: '60px',
                        height: '40px',
                        border: '2px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                    <TextField
                      size="small"
                      value={styles.backgroundColor}
                      onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                      placeholder="#f5f5f5"
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {getText('settings.appearanceConfig.colors.backgroundHelper', 'Page background')}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Timezone Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              {getText('settings.appearanceConfig.timezone.title', 'Timezone Settings')}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              {getText('settings.appearanceConfig.timezone.subtitle', 'Configure timezone offset for date and time display')}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
              <FormControl fullWidth>
                <InputLabel>{getText('settings.appearanceConfig.timezone.label', 'Timezone Offset')}</InputLabel>
                <Select
                  value={styles.timezoneOffset || '9'}
                  onChange={(e) => handleStyleChange('timezoneOffset', e.target.value)}
                  label={getText('settings.appearanceConfig.timezone.label', 'Timezone Offset')}
                >
                  {Array.from({ length: 25 }, (_, i) => {
                    const offset = i - 12; // GMT-12 to GMT+12
                    const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`;
                    return (
                      <MenuItem key={offset} value={offset.toString()}>
                        GMT{offsetStr}
                      </MenuItem>
                    );
                  })}
                </Select>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                  {getText('settings.appearanceConfig.timezone.helper', 'Select GMT offset (e.g., GMT+9)')}
                </Typography>
              </FormControl>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {getText('settings.appearanceConfig.timezone.currentTime', 'Current Time')}:
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatDateTimeUtil(new Date().toISOString())}
                  {' '}
                  <Typography component="span" variant="body2" color="textSecondary">
                    (GMT{parseInt(styles.timezoneOffset || '9', 10) >= 0 ? '+' : ''}{styles.timezoneOffset || '9'})
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Currency Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              {getText('settings.appearanceConfig.currency.title', 'Currency Settings')}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              {getText('settings.appearanceConfig.currency.subtitle', 'Configure currency symbol for all monetary values')}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
              <Box>
                <TextField
                  fullWidth
                  label={getText('settings.appearanceConfig.currency.label', 'Currency Symbol')}
                  value={styles.currencySymbol || '$'}
                  onChange={(e) => handleStyleChange('currencySymbol', e.target.value)}
                  placeholder="$"
                  helperText={getText('settings.appearanceConfig.currency.helper', 'Enter currency symbol (e.g., $, €, ¥, CNY, USD)')}
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleStyleChange('currencySymbol', '$')}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    $
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleStyleChange('currencySymbol', '¥')}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    ¥
                  </Button>
                </Box>
              </Box>
              
              <FormControl fullWidth>
                <InputLabel>{getText('settings.appearanceConfig.currency.positionLabel', 'Symbol Position')}</InputLabel>
                <Select
                  value={styles.currencyPosition || 'before'}
                  onChange={(e) => handleStyleChange('currencyPosition', e.target.value)}
                  label={getText('settings.appearanceConfig.currency.positionLabel', 'Symbol Position')}
                >
                  <MenuItem value="before">{getText('settings.appearanceConfig.currency.positionBefore', 'Before (e.g., $100)')}</MenuItem>
                  <MenuItem value="after">{getText('settings.appearanceConfig.currency.positionAfter', 'After (e.g., 100$)')}</MenuItem>
                </Select>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                  {getText('settings.appearanceConfig.currency.positionHelper', 'Choose where to display the currency symbol')}
                </Typography>
              </FormControl>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                {getText('settings.appearanceConfig.currency.styleTitle', 'Symbol Styling')}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {getText('settings.appearanceConfig.currency.styleSubtitle', 'Customize the appearance of the currency symbol')}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {getText('settings.appearanceConfig.currency.symbolColor', 'Symbol Color')}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <input
                        type="color"
                        value={styles.currencySymbolColor || '#666666'}
                        onChange={(e) => handleStyleChange('currencySymbolColor', e.target.value)}
                        style={{
                          width: '60px',
                          height: '40px',
                          border: '2px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      />
                      <TextField
                        size="small"
                        value={styles.currencySymbolColor || '#666666'}
                        onChange={(e) => handleStyleChange('currencySymbolColor', e.target.value)}
                        placeholder="#666666"
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>{getText('settings.appearanceConfig.currency.symbolWeight', 'Font Weight')}</InputLabel>
                    <Select
                      value={styles.currencySymbolWeight || 'bold'}
                      onChange={(e) => handleStyleChange('currencySymbolWeight', e.target.value)}
                      label={getText('settings.appearanceConfig.currency.symbolWeight', 'Font Weight')}
                    >
                      <MenuItem value="normal">{getText('settings.appearanceConfig.currency.weightNormal', 'Normal')}</MenuItem>
                      <MenuItem value="bold">{getText('settings.appearanceConfig.currency.weightBold', 'Bold')}</MenuItem>
                      <MenuItem value="lighter">{getText('settings.appearanceConfig.currency.weightLighter', 'Lighter')}</MenuItem>
                      <MenuItem value="bolder">{getText('settings.appearanceConfig.currency.weightBolder', 'Bolder')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={getText('settings.appearanceConfig.currency.symbolSize', 'Symbol Size')}
                    value={styles.currencySymbolSize || '1em'}
                    onChange={(e) => handleStyleChange('currencySymbolSize', e.target.value)}
                    placeholder="1em"
                    helperText={getText('settings.appearanceConfig.currency.symbolSizeHelper', 'Size relative to number (e.g., 1em, 0.9em, 1.2em)')}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {getText('settings.appearanceConfig.currency.preview', 'Preview')}:
                </Typography>
                <Typography 
                  variant="h6" 
                  fontWeight="bold"
                  sx={{
                    '& .currency-symbol': {
                      color: styles.currencySymbolColor || '#666666',
                      fontWeight: styles.currencySymbolWeight || 'bold',
                      fontSize: styles.currencySymbolSize || '1em',
                    }
                  }}
                >
                  {styles.currencyPosition === 'after' ? (
                    <>
                      1,234.56{' '}
                      <span className="currency-symbol">{styles.currencySymbol || '$'}</span>
                    </>
                  ) : (
                    <>
                      <span className="currency-symbol">{styles.currencySymbol || '$'}</span>
                      {' '}1,234.56
                    </>
                  )}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Preview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              {getText('settings.appearanceConfig.preview.title', 'Live Preview')}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      Heading Example
                    </Typography>
                    <Typography variant="body1" paragraph>
                      This is a preview of the body text with your selected font family and size.
                      The quick brown fox jumps over the lazy dog.
                    </Typography>
                    <TextField
                      fullWidth
                      label="Input Field Example"
                      defaultValue="Sample input text"
                      sx={{ mb: 2 }}
                    />
                    <Button variant="contained">Button Example</Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Current Settings:
                    </Typography>
                    <Typography variant="body2">
                      • Body Font: {styles.fontFamily.split(',')[0]}
                    </Typography>
                    <Typography variant="body2">
                      • Body Size: {styles.fontSize}px
                    </Typography>
                    <Typography variant="body2">
                      • Input Font: {styles.inputFontFamily.split(',')[0]}
                    </Typography>
                    <Typography variant="body2">
                      • Input Size: {styles.inputFontSize}px
                    </Typography>
                    <Typography variant="body2">
                      • Heading Font: {styles.headingFontFamily.split(',')[0]}
                    </Typography>
                    <Typography variant="body2">
                      • Border Radius: {styles.borderRadius}px
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

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

export default AppearanceConfiguration;

