/**
 * Text Configuration Utility
 * Handles loading and merging text configurations from localStorage
 * with safe fallbacks to prevent errors
 */

import TEXT_CONFIG_DEFAULT from '../config/text.config';

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Get text configuration with localStorage overrides
 * Returns a merged configuration object
 */
export function getTextConfig() {
  try {
    const savedConfig = localStorage.getItem('text_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      return deepMerge(TEXT_CONFIG_DEFAULT, parsed);
    }
  } catch (error) {
    console.error('Error loading text config from localStorage:', error);
  }
  
  return TEXT_CONFIG_DEFAULT;
}

/**
 * Get a text value by path (e.g., 'dashboard.title' or 'common.rowsPerPage')
 * Returns the value or a fallback if path doesn't exist
 */
export function getText(path, fallback = '') {
  const config = getTextConfig();
  const keys = path.split('.');
  let value = config;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return fallback;
    }
  }
  
  return typeof value === 'string' || typeof value === 'number' ? value : fallback;
}

/**
 * Save text configuration to localStorage
 */
export function saveTextConfig(config) {
  try {
    localStorage.setItem('text_config', JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Error saving text config:', error);
    return false;
  }
}

/**
 * Reset text configuration to defaults
 */
export function resetTextConfig() {
  try {
    localStorage.removeItem('text_config');
    return true;
  } catch (error) {
    console.error('Error resetting text config:', error);
    return false;
  }
}

export default TEXT_CONFIG_DEFAULT;

