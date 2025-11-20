// API configuration
// Detect if running in Electron
const isElectron = window.electronAPI?.isElectron || false;

// Determine API base URL
// In Electron, backend runs on localhost:5000
// In web dev, use environment variable or default to localhost:5000
const getBaseURL = () => {
  if (isElectron) {
    // In Electron, backend is always on localhost:5000
    return 'http://localhost:5000/api';
  }
  // Web mode - use environment variable or default
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

export const API_CONFIG = {
  baseURL: getBaseURL(),
  timeout: 30000,
};

export default API_CONFIG;

