/**
 * Currency utility for formatting currency values with configured currency symbol
 */

/**
 * Get currency symbol from localStorage
 * @returns {string} Currency symbol (e.g., '$', 'CNY', '€')
 */
export function getCurrencySymbol() {
  try {
    const savedStyles = localStorage.getItem('app_styles');
    if (savedStyles) {
      const styles = JSON.parse(savedStyles);
      return styles.currencySymbol || '$'; // Default to $
    }
  } catch (error) {
    console.error('Error loading currency symbol:', error);
  }
  return '$'; // Default to $
}

/**
 * Get currency position from localStorage
 * @returns {string} Currency position ('before' or 'after')
 */
export function getCurrencyPosition() {
  try {
    const savedStyles = localStorage.getItem('app_styles');
    if (savedStyles) {
      const styles = JSON.parse(savedStyles);
      return styles.currencyPosition || 'before'; // Default to before
    }
  } catch (error) {
    console.error('Error loading currency position:', error);
  }
  return 'before'; // Default to before
}

/**
 * Format a number as currency
 * @param {number|string} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, decimals = 2) {
  const symbol = getCurrencySymbol();
  const position = getCurrencyPosition();
  const numValue = parseFloat(value) || 0;
  const formattedValue = numValue.toFixed(decimals);
  
  if (position === 'after') {
    return `${formattedValue}${symbol}`;
  } else {
    return `${symbol}${formattedValue}`;
  }
}

