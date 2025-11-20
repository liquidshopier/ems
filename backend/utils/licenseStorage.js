/**
 * License Storage Utility
 * Handles reading and writing license files
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Determine license file path based on OS
// Windows: C:/EMS-license.txt
// Linux/Mac: /tmp/EMS-license.txt (or user's home directory)
function getLicenseFilePath() {
  const platform = os.platform();
  
  if (platform === 'win32') {
    // Windows: Save to C:/EMS-license.txt
    return 'C:/EMS-license.txt';
  } else if (platform === 'darwin') {
    // macOS: Save to user's home directory
    return path.join(os.homedir(), 'EMS-license.txt');
  } else {
    // Linux: Save to user's home directory
    return path.join(os.homedir(), 'EMS-license.txt');
  }
}

const LICENSE_FILE_PATH = getLicenseFilePath();

/**
 * Read license from file
 * @returns {string|null} License key or null if not found
 */
function readLicense() {
  try {
    if (fs.existsSync(LICENSE_FILE_PATH)) {
      const license = fs.readFileSync(LICENSE_FILE_PATH, 'utf8').trim();
      return license || null;
    }
    return null;
  } catch (error) {
    console.error('Error reading license file:', error);
    return null;
  }
}

/**
 * Write license to file
 * @param {string} licenseKey - License key to save
 * @returns {boolean} True if successful, false otherwise
 */
function writeLicense(licenseKey) {
  try {
    fs.writeFileSync(LICENSE_FILE_PATH, licenseKey, 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing license file:', error);
    return false;
  }
}

/**
 * Check if license file exists
 * @returns {boolean}
 */
function licenseExists() {
  return fs.existsSync(LICENSE_FILE_PATH);
}

/**
 * Delete license file
 * @returns {boolean} True if successful, false otherwise
 */
function deleteLicense() {
  try {
    if (fs.existsSync(LICENSE_FILE_PATH)) {
      fs.unlinkSync(LICENSE_FILE_PATH);
    }
    return true;
  } catch (error) {
    console.error('Error deleting license file:', error);
    return false;
  }
}

module.exports = {
  readLicense,
  writeLicense,
  licenseExists,
  deleteLicense
};

