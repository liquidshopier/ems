/**
 * Currency utility for formatting currency values with configured currency symbol
 */

import React from 'react';

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
 * Get currency symbol styling from localStorage
 * @returns {object} Currency symbol styling options
 */
export function getCurrencySymbolStyle() {
  try {
    const savedStyles = localStorage.getItem('app_styles');
    if (savedStyles) {
      const styles = JSON.parse(savedStyles);
      return {
        color: styles.currencySymbolColor || '#666666',
        fontWeight: styles.currencySymbolWeight || 'bold',
        fontSize: styles.currencySymbolSize || '1em',
      };
    }
  } catch (error) {
    console.error('Error loading currency symbol style:', error);
  }
  return {
    color: '#666666',
    fontWeight: 'bold',
    fontSize: '1em',
  };
}

/**
 * Format a number as currency with styled symbol
 * @param {number|string} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {JSX.Element} Formatted currency JSX with styled symbol
 */
export function formatCurrency(value, decimals = 2) {
  const symbol = getCurrencySymbol();
  const position = getCurrencyPosition();
  const symbolStyle = getCurrencySymbolStyle();
  const numValue = parseFloat(value) || 0;
  const formattedValue = numValue.toFixed(decimals);
  
  const styledSymbol = (
    <span 
      style={{
        color: symbolStyle.color,
        fontWeight: symbolStyle.fontWeight,
        fontSize: symbolStyle.fontSize,
      }}
    >
      {symbol}
    </span>
  );
  
  if (position === 'after') {
    return (
      <>
        {formattedValue} {styledSymbol}
      </>
    );
  } else {
    return (
      <>
        {styledSymbol} {formattedValue}
      </>
    );
  }
}

