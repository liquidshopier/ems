const express = require('express');
const router = express.Router();
const licenseGenerator = require('../utils/license-generator');
const deviceInfo = require('../utils/deviceInfo');
const licenseStorage = require('../utils/licenseStorage');

// Get device number
router.get('/device-number', (req, res) => {
  try {
    const deviceNumber = deviceInfo.getDeviceNumber();
    res.json({ success: true, data: deviceNumber });
  } catch (error) {
    console.error('Error getting device number:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validate license
router.post('/validate', (req, res) => {
  try {
    const { deviceNumber, licenseKey } = req.body;
    
    if (!deviceNumber || !licenseKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Device number and license key are required' 
      });
    }
    
    const isValid = licenseGenerator.validate(deviceNumber, licenseKey);
    
    if (isValid) {
      // Save license to file
      const saved = licenseStorage.writeLicense(licenseKey);
      if (!saved) {
        console.error('Failed to save license to file');
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to save license file' 
        });
      }
      console.log('License saved successfully to file');
    }
    
    res.json({ success: true, valid: isValid });
  } catch (error) {
    console.error('Error validating license:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check if license is valid (for app startup)
router.get('/check', (req, res) => {
  try {
    const deviceNumber = deviceInfo.getDeviceNumber();
    const storedLicense = licenseStorage.readLicense();
    
    if (!storedLicense) {
      return res.json({ success: true, valid: false, hasLicense: false });
    }
    
    const isValid = licenseGenerator.validate(deviceNumber, storedLicense);
    
    res.json({ 
      success: true, 
      valid: isValid, 
      hasLicense: true,
      deviceNumber 
    });
  } catch (error) {
    console.error('Error checking license:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

