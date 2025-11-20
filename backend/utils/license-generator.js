/**
 * License Generator Module
 * Generates and validates license keys based on device numbers
 */

/**
 * Generate a license key from a device number
 * @param {string} deviceNumber - Device number in format 1111-2222-3333-4444
 * @returns {string} License key or empty string if invalid
 */
function generate(deviceNumber) {
  // Remove dashes and validate format
  const cleaned = deviceNumber.replace(/-/g, '');
  
  if (!/^\d{16}$/.test(cleaned)) {
    return '';
  }
  
  // Split into 4 groups of 4 digits
  const groups = [
    cleaned.substring(0, 4),
    cleaned.substring(4, 8),
    cleaned.substring(8, 12),
    cleaned.substring(12, 16)
  ];
  
  // Prime numbers for each position in a group
  const primes = [7, 11, 13, 17];
  
  // Transform each group
  const transformedGroups = groups.map((group, groupIndex) => {
    return group.split('').map((digit, position) => {
      const num = parseInt(digit, 10);
      const prime = primes[position];
      const offset = groupIndex * 3 + position * 2;
      const result = (num * prime + offset) % 10;
      return result.toString();
    }).join('');
  });
  
  // Join groups with dashes
  return transformedGroups.join('-');
}

/**
 * Validate if a license key matches a device number
 * @param {string} deviceNumber - Device number
 * @param {string} licenseKey - License key to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validate(deviceNumber, licenseKey) {
  if (!deviceNumber || !licenseKey) {
    return false;
  }
  
  const generated = generate(deviceNumber);
  
  if (!generated) {
    return false;
  }
  
  // Normalize both keys (remove dashes and compare)
  const normalizedGenerated = generated.replace(/-/g, '');
  const normalizedLicense = licenseKey.replace(/-/g, '');
  
  return normalizedGenerated === normalizedLicense;
}

module.exports = {
  generate,
  validate
};

