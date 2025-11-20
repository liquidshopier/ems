import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { unitsAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getText } from '../../utils/textConfig';
import { getAllowedSettingsTabs } from '../../utils/permissions';
import DataTable from '../../components/Common/DataTable';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import AlertMessage from '../../components/Common/AlertMessage';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import UnitModal from './UnitModal';
import UserModal from './UserModal';
import TextConfiguration from './TextConfiguration';
import AppearanceConfiguration from './AppearanceConfiguration';
import SessionSettings from './SessionSettings';

function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  
  // Get allowed tabs based on user permissions (memoized to prevent infinite loop)
  const allowedTabs = useMemo(() => 
    getAllowedSettingsTabs(user?.permissions || []), 
    [user?.permissions]
  );
  
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [alert, setAlert] = useState({ open: false, severity: 'info', message: '' });
  
  const [unitModal, setUnitModal] = useState({ open: false, mode: 'add', data: null });
  const [userModal, setUserModal] = useState({ open: false, mode: 'add', data: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, type: 'unit' });

  useEffect(() => {
    if (activeTab === 0 && allowedTabs.units) {
      fetchUnits();
    } else if (activeTab === (allowedTabs.units ? 1 : 0) && allowedTabs.users) {
      fetchUsers();
    }
    // Text Config and Appearance tabs don't need data fetching
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const response = await unitsAPI.getAll();
      setUnits(response.data || []);
    } catch (error) {
      setAlert({ open: true, severity: 'error', message: error.toString() });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = () => {
    setUnitModal({ open: true, mode: 'add', data: null });
  };

  const handleEditUnit = (unit) => {
    setUnitModal({ open: true, mode: 'edit', data: unit });
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data || []);
    } catch (error) {
      setAlert({ open: true, severity: 'error', message: error.toString() });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUnit = (id) => {
    setDeleteDialog({ open: true, id, type: 'unit' });
  };

  const handleAddUser = () => {
    setUserModal({ open: true, mode: 'add', data: null });
  };

  const handleEditUser = (user) => {
    setUserModal({ open: true, mode: 'edit', data: user });
  };

  const handleDeleteUser = (id) => {
    setDeleteDialog({ open: true, id, type: 'user' });
  };

  const confirmDelete = async () => {
    try {
      if (deleteDialog.type === 'unit') {
        await unitsAPI.delete(deleteDialog.id);
        setAlert({ open: true, severity: 'success', message: getText('settings.units.messages.deleteSuccess', 'Unit deleted successfully') });
        fetchUnits();
      } else if (deleteDialog.type === 'user') {
        await usersAPI.delete(deleteDialog.id);
        setAlert({ open: true, severity: 'success', message: 'User deleted successfully' });
        fetchUsers();
      }
    } catch (error) {
      setAlert({ open: true, severity: 'error', message: error.toString() });
    } finally {
      setDeleteDialog({ open: false, id: null, type: 'unit' });
    }
  };

  const handleUnitModalClose = (shouldRefresh) => {
    setUnitModal({ open: false, mode: 'add', data: null });
    if (shouldRefresh) {
      fetchUnits();
    }
  };

  const handleUserModalClose = (shouldRefresh) => {
    setUserModal({ open: false, mode: 'add', data: null });
    if (shouldRefresh) {
      fetchUsers();
    }
  };

  const unitColumns = [
    { 
      field: 'id', 
      headerName: getText('settings.units.table.id', 'ID'), 
      minWidth: 70,
      renderCell: (row, rowNumber) => rowNumber
    },
    { field: 'value', headerName: getText('settings.units.table.name', 'Unit Name'), minWidth: 200 },
  ];

  const unitActions = (row) => (
    <Box>
      <IconButton
        size="small"
        color="primary"
        onClick={() => handleEditUnit(row)}
        title={getText('common.edit', 'Edit')}
      >
        <EditIcon />
      </IconButton>
      <IconButton
        size="small"
        color="error"
        onClick={() => handleDeleteUnit(row.id)}
        title={getText('common.delete', 'Delete')}
      >
        <DeleteIcon />
      </IconButton>
    </Box>
  );

  const userColumns = [
    { 
      field: 'id', 
      headerName: getText('settings.userManagement.table.id', 'ID'), 
      minWidth: 70,
      renderCell: (row, rowNumber) => rowNumber
    },
    { field: 'username', headerName: getText('settings.userManagement.table.username', 'Username'), minWidth: 150 },
    { field: 'full_name', headerName: getText('settings.userManagement.table.fullName', 'Full Name'), minWidth: 200 },
    { 
      field: 'permissions', 
      headerName: getText('settings.userManagement.table.permissions', 'Permissions'), 
      minWidth: 300,
      renderCell: (row) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.5 }}>
          {(row.permissions || []).map((perm) => (
            <Chip 
              key={perm} 
              label={getText(`settings.userManagement.permissions.${perm}`, perm)} 
              size="small" 
              sx={{ 
                color: 'white',
                backgroundColor: 'primary.main',
                border: 'none'
              }}
            />
          ))}
        </Box>
      )
    },
    { 
      field: 'is_active', 
      headerName: getText('settings.userManagement.table.status', 'Status'), 
      minWidth: 100,
      renderCell: (row) => {
        // Handle both number (0/1) and boolean (true/false) values
        const isActive = row.is_active === 1 || row.is_active === true || row.is_active === '1';
        return (
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: isActive ? '#4caf50' : '#f44336',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            {isActive ? getText('settings.userManagement.table.active', 'Active') : getText('settings.userManagement.table.inactive', 'Inactive')}
          </Box>
        );
      }
    },
  ];

  const userActions = (row) => {
    const isProtectedUser = row.username === 'admin' || row.username === 'dev';
    const isDevUser = row.username === 'dev';
    const tooltipText = row.username === 'admin' ? 
      getText('settings.userManagement.messages.cannotDeleteAdmin', 'Default admin user cannot be deleted') : 
      row.username === 'dev' ? 
      getText('settings.userManagement.messages.cannotDeleteDev', 'Developer account cannot be deleted') : 
      getText('common.delete', 'Delete');
    
    return (
      <Box>
        <IconButton
          size="small"
          color="primary"
          onClick={() => handleEditUser(row)}
          title={isDevUser ? getText('settings.userManagement.modal.developerProtected', 'Developer account (protected)') : getText('settings.userManagement.modal.editTooltip', 'Edit')}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={() => handleDeleteUser(row.id)}
          title={tooltipText}
          disabled={isProtectedUser}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    );
  };

  if (loading && activeTab < 2) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        {getText('settings.title', 'Settings')}
      </Typography>

      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)} 
        sx={{ mb: 3 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {allowedTabs.units && <Tab label={getText('settings.tabs.units', 'Unit Management')} />}
        {allowedTabs.users && <Tab label={getText('settings.tabs.userManagement', 'User Management')} />}
        {allowedTabs.textConfig && <Tab label={getText('settings.tabs.textConfiguration', 'Text Configuration')} />}
        {allowedTabs.appearance && <Tab label={getText('settings.tabs.appearance', 'Appearance')} />}
        {allowedTabs.session && <Tab label={getText('settings.tabs.session', 'Session Management')} />}
      </Tabs>

      {/* Dynamically render tabs based on permissions */}
      {activeTab === 0 && allowedTabs.units && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddUnit}
            >
              {getText('settings.units.addButton', 'Add Unit')}
            </Button>
          </Box>
          <DataTable
            columns={unitColumns}
            data={units}
            actions={unitActions}
          />
        </Box>
      )}

      {activeTab === (allowedTabs.units ? 1 : 0) && allowedTabs.users && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddUser}
            >
              {getText('settings.userManagement.addButton', 'Add User')}
            </Button>
          </Box>
          <DataTable
            columns={userColumns}
            data={users}
            actions={userActions}
          />
        </Box>
      )}

      {activeTab === ((allowedTabs.units ? 1 : 0) + (allowedTabs.users ? 1 : 0)) && allowedTabs.textConfig && <TextConfiguration />}

      {activeTab === ((allowedTabs.units ? 1 : 0) + (allowedTabs.users ? 1 : 0) + (allowedTabs.textConfig ? 1 : 0)) && allowedTabs.appearance && <AppearanceConfiguration />}

      {activeTab === ((allowedTabs.units ? 1 : 0) + (allowedTabs.users ? 1 : 0) + (allowedTabs.textConfig ? 1 : 0) + (allowedTabs.appearance ? 1 : 0)) && allowedTabs.session && <SessionSettings />}

      <UnitModal
        open={unitModal.open}
        mode={unitModal.mode}
        data={unitModal.data}
        onClose={handleUnitModalClose}
        onSuccess={(message) => setAlert({ open: true, severity: 'success', message })}
        onError={(message) => setAlert({ open: true, severity: 'error', message })}
      />

      <UserModal
        open={userModal.open}
        mode={userModal.mode}
        data={userModal.data}
        onClose={handleUserModalClose}
        onSuccess={(message) => setAlert({ open: true, severity: 'success', message })}
        onError={(message) => setAlert({ open: true, severity: 'error', message })}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title={getText('common.confirm', 'Confirm')}
        message={deleteDialog.type === 'unit' ? getText('settings.units.messages.deleteConfirm', 'Are you sure you want to delete this unit?') : getText('settings.userManagement.messages.deleteConfirm', 'Are you sure you want to delete this user?')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null, type: 'unit' })}
      />

      <AlertMessage
        open={alert.open}
        severity={alert.severity}
        message={alert.message}
        onClose={() => setAlert({ ...alert, open: false })}
      />
    </Box>
  );
}

export default Settings;

