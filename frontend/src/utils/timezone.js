/**
 * Timezone utility for formatting dates with configured timezone offset
 */

/**
 * Get timezone offset from localStorage
 * @returns {number} Timezone offset (e.g., 9 for GMT+9)
 */
export function getTimezoneOffset() {
  try {
    const savedStyles = localStorage.getItem('app_styles');
    if (savedStyles) {
      const styles = JSON.parse(savedStyles);
      return parseInt(styles.timezoneOffset, 10) || 9; // Default to GMT+9
    }
  } catch (error) {
    console.error('Error loading timezone offset:', error);
  }
  return 9; // Default to GMT+9
}

/**
 * Normalize date string to ensure UTC parsing
 * SQLite returns dates in format "YYYY-MM-DD HH:MM:SS" which JS interprets as local time
 * We need to ensure it's parsed as UTC
 */
function normalizeDateString(dateString) {
  if (!dateString) return null;
  
  // If it's already a Date object, return as-is
  if (dateString instanceof Date) {
    return dateString;
  }
  
  // If it's in SQLite format "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DD"
  // Append 'Z' to force UTC interpretation, or use UTC parsing
  let normalized = dateString.toString().trim();
  
  // If it doesn't have timezone info and has a space (SQLite format)
  if (normalized.includes(' ') && !normalized.includes('Z') && !normalized.includes('+') && !normalized.includes('-', 10)) {
    // Replace space with 'T' and append 'Z' to force UTC
    normalized = normalized.replace(' ', 'T') + 'Z';
  } else if (!normalized.includes('Z') && !normalized.includes('+') && !normalized.match(/\d{4}-\d{2}-\d{2}T/)) {
    // If it's just a date like "YYYY-MM-DD", add T00:00:00Z
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      normalized = normalized + 'T00:00:00Z';
    }
  }
  
  return normalized;
}

/**
 * Format a date string with the configured timezone
 * @param {string|Date} dateString - Date string or Date object
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDateWithTimezone(dateString, options = {}) {
  if (!dateString) return '';
  
  // Normalize the date string to ensure UTC parsing
  const normalizedDate = normalizeDateString(dateString);
  const date = new Date(normalizedDate);
  
  if (isNaN(date.getTime())) {
    console.warn('Invalid date:', dateString);
    return '';
  }
  
  const offset = getTimezoneOffset();
  
  // Get UTC components (database stores UTC)
  const utcYear = date.getUTCFullYear();
  const utcMonth = date.getUTCMonth();
  const utcDay = date.getUTCDate();
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  
  // Apply timezone offset to hours
  let adjustedHours = utcHours + offset;
  let adjustedDay = utcDay;
  let adjustedMonth = utcMonth;
  let adjustedYear = utcYear;
  
  // Handle day overflow (next day)
  if (adjustedHours >= 24) {
    adjustedHours -= 24;
    adjustedDay += 1;
    // Check for month overflow
    const daysInMonth = new Date(Date.UTC(adjustedYear, adjustedMonth + 1, 0)).getUTCDate();
    if (adjustedDay > daysInMonth) {
      adjustedDay = 1;
      adjustedMonth += 1;
      // Check for year overflow
      if (adjustedMonth >= 12) {
        adjustedMonth = 0;
        adjustedYear += 1;
      }
    }
  }
  
  // Handle day underflow (previous day)
  if (adjustedHours < 0) {
    adjustedHours += 24;
    adjustedDay -= 1;
    // Check for month underflow
    if (adjustedDay < 1) {
      adjustedMonth -= 1;
      // Check for year underflow
      if (adjustedMonth < 0) {
        adjustedMonth = 11;
        adjustedYear -= 1;
      }
      const daysInMonth = new Date(Date.UTC(adjustedYear, adjustedMonth + 1, 0)).getUTCDate();
      adjustedDay = daysInMonth;
    }
  }
  
  // Determine if time should be included
  const includeTime = !options.dateOnly;
  
  if (includeTime) {
    // Format with date and time
    const monthStr = String(adjustedMonth + 1).padStart(2, '0');
    const dayStr = String(adjustedDay).padStart(2, '0');
    const hoursStr = String(adjustedHours).padStart(2, '0');
    const minutesStr = String(utcMinutes).padStart(2, '0');
    return `${monthStr}/${dayStr}/${adjustedYear} ${hoursStr}:${minutesStr}`;
  } else {
    // Format date only
    const monthStr = String(adjustedMonth + 1).padStart(2, '0');
    const dayStr = String(adjustedDay).padStart(2, '0');
    return `${monthStr}/${dayStr}/${adjustedYear}`;
  }
}

/**
 * Format date and time with timezone
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(dateString) {
  return formatDateWithTimezone(dateString, { dateOnly: false });
}

/**
 * Format date only with timezone
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string
 */
export function formatDateOnly(dateString) {
  return formatDateWithTimezone(dateString, { dateOnly: true });
}

