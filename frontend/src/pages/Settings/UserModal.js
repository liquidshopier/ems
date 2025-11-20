import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  OutlinedInput,
  Chip,
  Box,
} from '@mui/material';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getText } from '../../utils/textConfig';

function UserModal({ open, mode, data, onClose, onSuccess, onError }) {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    permissions: ['products', 'sales', 'customers'],
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  
  const isAdminUser = mode === 'edit' && data?.username === 'admin';
  const isDevUser = mode === 'edit' && data?.username === 'dev';
  const isCurrentUserAdmin = currentUser?.username === 'admin';
  const isCurrentUserDev = currentUser?.username === 'dev';
  const isProtectedUser = isAdminUser || isDevUser;

  // Available permissions
  const availablePermissions = [
    { value: 'dashboard', label: getText('settings.userManagement.permissions.dashboard', 'Dashboard') },
    { value: 'products', label: getText('settings.userManagement.permissions.products', 'Products') },
    { value: 'sales', label: getText('settings.userManagement.permissions.sales', 'Sales') },
    { value: 'customers', label: getText('settings.userManagement.permissions.customers', 'Customers') },
    { value: 'logs', label: getText('settings.userManagement.permissions.logs', 'Log History') },
    { value: 'settings.units', label: getText('settings.userManagement.permissions.settings.units', 'Settings - Units') },
    { value: 'settings.users', label: getText('settings.userManagement.permissions.settings.users', 'Settings - User Management') },
    { value: 'settings.textConfig', label: getText('settings.userManagement.permissions.settings.textConfig', 'Settings - Text Configuration') },
    { value: 'settings.appearance', label: getText('settings.userManagement.permissions.settings.appearance', 'Settings - Appearance') },
  ];

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && data) {
        setFormData({
          username: data.username,
          password: '',
          full_name: data.full_name,
          permissions: data.permissions || ['products', 'sales', 'customers'],
          is_active: data.is_active === 1,
        });
      } else {
        setFormData({
          username: '',
          password: '',
          full_name: '',
          permissions: ['products', 'sales', 'customers'],
          is_active: true,
        });
      }
    }
  }, [open, mode, data]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.username || !formData.full_name) {
      onError(getText('settings.userManagement.modal.fillRequiredFields', 'Please fill in all required fields'));
      return;
    }

    if (mode === 'add' && !formData.password) {
      onError(getText('settings.userManagement.modal.passwordRequired', 'Password is required for new users'));
      return;
    }

    // Validate password length if provided (for both add and edit)
    if (formData.password && formData.password.trim().length > 0 && formData.password.trim().length < 6) {
      onError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const payload = { ...formData };
      // Don't send password if it's empty or whitespace-only during edit
      if (mode === 'edit') {
        if (!payload.password || payload.password.trim().length === 0) {
          delete payload.password;
        } else {
          // Trim whitespace from password
          payload.password = payload.password.trim();
        }
      }

      if (mode === 'add') {
        await usersAPI.create(payload);
        onSuccess(getText('settings.userManagement.modal.createSuccess', 'User created successfully'));
      } else {
        await usersAPI.update(data.id, payload);
        onSuccess(getText('settings.userManagement.modal.updateSuccess', 'User updated successfully'));
      }
      onClose(true);
    } catch (error) {
      // Extract error message properly
      const errorMessage = typeof error === 'string' 
        ? error 
        : error?.response?.data?.error 
        || error?.message 
        || 'An error occurred while saving the user';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'add' ? getText('settings.userManagement.modal.addTitle', 'Add New User') : getText('settings.userManagement.modal.editTitle', 'Edit User')}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={getText('settings.userManagement.modal.username', 'Username')}
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              required
              disabled={mode === 'edit'}
              helperText={getText('settings.userManagement.modal.usernameHelper', 'Enter a unique username')}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={getText('settings.userManagement.modal.password', 'Password')}
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required={mode === 'add'}
              placeholder={mode === 'edit' ? getText('settings.userManagement.modal.passwordHelperEdit', 'Leave blank to keep current password') : ''}
              disabled={(isAdminUser && !isCurrentUserAdmin) || (isDevUser && !isCurrentUserDev)}
              helperText={
                (isAdminUser && !isCurrentUserAdmin) ? getText('settings.userManagement.modal.onlyAdminCanChangePassword', 'Only admin user can change admin password') :
                (isDevUser && !isCurrentUserDev) ? getText('settings.userManagement.modal.onlyDevCanChangePassword', 'Only dev user can change developer password') :
                mode === 'add' ? getText('settings.userManagement.modal.passwordHelper', 'Enter a secure password (min 6 characters)') : ''
              }
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={getText('settings.userManagement.modal.fullName', 'Full Name')}
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              required
              helperText={getText('settings.userManagement.modal.fullNameHelper', 'Enter full name')}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>{getText('settings.userManagement.modal.permissions', 'Permissions')}</InputLabel>
              <Select
                multiple
                value={formData.permissions}
                onChange={(e) => handleChange('permissions', e.target.value)}
                input={<OutlinedInput label={getText('settings.userManagement.modal.permissions', 'Permissions')} />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const perm = availablePermissions.find(p => p.value === value);
                      return <Chip key={value} label={perm?.label || value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {availablePermissions.map((perm) => (
                  <MenuItem key={perm.value} value={perm.value}>
                    {perm.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {mode === 'edit' && (
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    disabled={isProtectedUser}
                  />
                }
                label={
                  isAdminUser ? getText('settings.userManagement.modal.isActiveAdminNote', 'Active (Default admin cannot be deactivated)') :
                  isDevUser ? getText('settings.userManagement.modal.isActiveDevNote', 'Active (Developer account cannot be deactivated)') :
                  getText('settings.userManagement.modal.isActive', 'Active')
                }
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={loading}>
          {getText('settings.userManagement.modal.cancel', 'Cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {mode === 'add' ? getText('settings.userManagement.modal.create', 'Create') : getText('settings.userManagement.modal.update', 'Update')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UserModal;

