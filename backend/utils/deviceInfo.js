/**
 * Device Information Utility
 * Generates a unique device identifier
 */

const os = require('os');
const crypto = require('crypto');

/**
 * Get device number based on system information
 * Format: 1111-2222-3333-4444 (16 digits)
 * @returns {string} Device number
 */
function getDeviceNumber() {
  try {
    // Get system information
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    const cpus = os.cpus();
    
    // Create a unique string from system info
    const systemInfo = `${hostname}-${platform}-${arch}-${cpus.length}`;
    
    // Generate hash
    const hash = crypto.createHash('md5').update(systemInfo).digest('hex');
    
    // Take first 16 characters and format as device number
    const digits = hash.substring(0, 16).split('').map(char => {
      // Convert hex to decimal (0-9)
      const num = parseInt(char, 16);
      return num.toString();
    }).join('');
    
    // Format as 1111-2222-3333-4444
    return `${digits.substring(0, 4)}-${digits.substring(4, 8)}-${digits.substring(8, 12)}-${digits.substring(12, 16)}`;
  } catch (error) {
    console.error('Error generating device number:', error);
    // Fallback device number
    return '0000-0000-0000-0000';
  }
}

module.exports = {
  getDeviceNumber
};

