// Permission utility functions based on user permissions array

/**
 * Check if user has a specific permission
 * @param {array} userPermissions - User's permissions array
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if user has permission
 */
export const hasPermission = (userPermissions, permission) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  
  // Check if user has the exact permission
  if (userPermissions.includes(permission)) return true;
  
  // Check for parent permission (e.g., 'settings' covers 'settings.units')
  if (permission.includes('.')) {
    const parent = permission.split('.')[0];
    if (userPermissions.includes(parent)) return true;
  }
  
  return false;
};

/**
 * Check if user is admin (has all permissions)
 * @param {array} userPermissions - User's permissions array
 * @returns {boolean}
 */
export const isAdmin = (userPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  
  const adminPermissions = [
    'dashboard', 'products', 'sales', 'customers',
    'settings.units', 'settings.users', 'settings.textConfig', 'settings.appearance'
  ];
  
  return adminPermissions.every(perm => userPermissions.includes(perm));
};

/**
 * Get allowed menu items based on user permissions
 * @param {array} userPermissions - User's permissions array
 * @returns {array} - Array of menu item paths user can access
 */
export const getAllowedMenuItems = (userPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return [];
  
  const menuItems = [];
  
  if (hasPermission(userPermissions, 'dashboard')) {
    menuItems.push('/dashboard');
  }
  
  if (hasPermission(userPermissions, 'products')) {
    menuItems.push('/products');
  }
  
  if (hasPermission(userPermissions, 'sales')) {
    menuItems.push('/sales');
  }
  
  if (hasPermission(userPermissions, 'customers')) {
    menuItems.push('/customers');
  }
  
  // Show settings if user has any settings permissions
  const hasAnySettingsPermission = userPermissions.some(p => p.startsWith('settings'));
  if (hasAnySettingsPermission) {
    menuItems.push('/settings');
  }
  
  return menuItems;
};

/**
 * Get allowed settings tabs based on user permissions
 * @param {array} userPermissions - User's permissions array
 * @returns {object} - Object with tab permissions
 */
export const getAllowedSettingsTabs = (userPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return {
      units: false,
      users: false,
      textConfig: false,
      appearance: false,
    };
  }
  
  return {
    units: hasPermission(userPermissions, 'settings.units'),
    users: hasPermission(userPermissions, 'settings.users'),
    textConfig: hasPermission(userPermissions, 'settings.textConfig'),
    appearance: hasPermission(userPermissions, 'settings.appearance'),
  };
};

/**
 * Check if user can access a specific route
 * @param {array} userPermissions - User's permissions array
 * @param {string} path - Route path to check
 * @returns {boolean}
 */
export const canAccessRoute = (userPermissions, path) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Check if user has permission for this route
  if (cleanPath === 'dashboard') return hasPermission(userPermissions, 'dashboard');
  if (cleanPath === 'products') return hasPermission(userPermissions, 'products');
  if (cleanPath === 'sales') return hasPermission(userPermissions, 'sales');
  if (cleanPath === 'customers') return hasPermission(userPermissions, 'customers');
  if (cleanPath === 'logs') return hasPermission(userPermissions, 'logs');
  if (cleanPath === 'settings') {
    // Allow access to settings if user has any settings permission
    return userPermissions.some(p => p.startsWith('settings'));
  }
  
  // Allow login page always
  if (cleanPath === 'login' || cleanPath === '') return true;
  
  return false;
};

const permissionsUtil = {
  hasPermission,
  isAdmin,
  getAllowedMenuItems,
  getAllowedSettingsTabs,
  canAccessRoute,
};

export default permissionsUtil;
