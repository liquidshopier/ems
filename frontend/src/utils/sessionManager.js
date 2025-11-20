/**
 * Session Management Utility
 * Handles session expiration, storage, and cleanup
 */

const SESSION_START_KEY = 'session_start_time';
const SESSION_ENABLED_KEY = 'session_management_enabled';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Check if session management is enabled
 */
export const isSessionManagementEnabled = () => {
  const enabled = localStorage.getItem(SESSION_ENABLED_KEY);
  return enabled === 'true';
};

/**
 * Enable or disable session management
 */
export const setSessionManagementEnabled = (enabled) => {
  localStorage.setItem(SESSION_ENABLED_KEY, enabled ? 'true' : 'false');
  
  // If disabling, clear only session start time (don't log user out)
  if (!enabled) {
    localStorage.removeItem(SESSION_START_KEY);
  }
};

/**
 * Initialize session (call on login)
 */
export const initSession = () => {
  if (!isSessionManagementEnabled()) {
    return;
  }
  
  const sessionStart = Date.now();
  localStorage.setItem(SESSION_START_KEY, sessionStart.toString());
};

/**
 * Check if session has expired
 */
export const isSessionExpired = () => {
  if (!isSessionManagementEnabled()) {
    return false; // If disabled, session never expires
  }
  
  const sessionStart = localStorage.getItem(SESSION_START_KEY);
  
  if (!sessionStart) {
    return true; // No session start time means expired
  }
  
  const startTime = parseInt(sessionStart, 10);
  const currentTime = Date.now();
  const elapsed = currentTime - startTime;
  
  return elapsed >= SESSION_DURATION;
};

/**
 * Get remaining session time in milliseconds
 */
export const getRemainingSessionTime = () => {
  if (!isSessionManagementEnabled()) {
    return Infinity; // If disabled, session never expires
  }
  
  const sessionStart = localStorage.getItem(SESSION_START_KEY);
  
  if (!sessionStart) {
    return 0;
  }
  
  const startTime = parseInt(sessionStart, 10);
  const currentTime = Date.now();
  const elapsed = currentTime - startTime;
  const remaining = SESSION_DURATION - elapsed;
  
  return remaining > 0 ? remaining : 0;
};

/**
 * Clear session data
 */
export const clearSession = () => {
  localStorage.removeItem(SESSION_START_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Get session start time
 */
export const getSessionStartTime = () => {
  const sessionStart = localStorage.getItem(SESSION_START_KEY);
  return sessionStart ? parseInt(sessionStart, 10) : null;
};

/**
 * Format remaining time for display
 */
export const formatRemainingTime = (milliseconds) => {
  if (milliseconds === Infinity) {
    return 'Unlimited';
  }
  
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

