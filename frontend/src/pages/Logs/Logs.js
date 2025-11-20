import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Button,
  IconButton,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import DataTable from '../../components/Common/DataTable';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import AlertMessage from '../../components/Common/AlertMessage';
import LogDetailsModal from './LogDetailsModal';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getText } from '../../utils/textConfig';
import { formatDateTime } from '../../utils/timezone';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Logs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, severity: 'info', message: '' });
  const [clearDialog, setClearDialog] = useState({ open: false });
  const [viewDialog, setViewDialog] = useState({ open: false, logId: null, logData: null });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filters, setFilters] = useState({
    username: '',
    table_name: '',
    action: '',
    status: '',
  });

  // Check if user is dev
  const isDevUser = user?.username === 'dev';

  // Redirect if not admin/dev
  useEffect(() => {
    if (user && user.username !== 'admin' && user.username !== 'dev') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && (user.username === 'admin' || user.username === 'dev')) {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });

      const response = await axios.get(
        `${API_BASE_URL}/logs?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setLogs(response.data.data.logs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    fetchLogs();
  };

  const handleResetFilters = () => {
    setFilters({
      username: '',
      table_name: '',
      action: '',
      status: '',
    });
    setTimeout(() => fetchLogs(), 100);
  };

  const handleClearLogs = () => {
    setClearDialog({ open: true });
  };

  const confirmClearLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAlert({
        open: true,
        severity: 'success',
        message: getText('logs.messages.clearSuccess', 'Log history cleared successfully')
      });
      setClearDialog({ open: false });
      fetchLogs();
    } catch (error) {
      setAlert({
        open: true,
        severity: 'error',
        message: error.response?.data?.error || error.message || getText('logs.messages.clearFailed', 'Failed to clear log history')
      });
      setClearDialog({ open: false });
    }
  };

  const handleViewLog = async (logId) => {
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/logs/${logId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setViewDialog({ open: true, logId, logData: response.data.data });
      } else {
        setAlert({
          open: true,
          severity: 'error',
          message: getText('logs.messages.loadError', 'Error loading log details')
        });
      }
    } catch (error) {
      setAlert({
        open: true,
        severity: 'error',
        message: error.response?.data?.error || error.message || getText('logs.messages.loadError', 'Error loading log details')
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const columns = [
    { 
      field: 'id', 
      headerName: getText('logs.table.id', 'ID'), 
      minWidth: 70,
      renderCell: (row, rowNumber) => rowNumber
    },
    { 
      field: 'created_at', 
      headerName: getText('logs.table.timestamp', 'Time'), 
      minWidth: 180,
      renderCell: (row) => formatDateTime(row.created_at)
    },
    { field: 'username', headerName: getText('logs.table.username', 'User'), minWidth: 120 },
    { 
      field: 'action', 
      headerName: getText('logs.table.action', 'Action'), 
      minWidth: 100,
      renderCell: (row) => (
        <Chip 
          label={row.action} 
          size="small"
          color={
            row.action === 'CREATE' ? 'success' :
            row.action === 'UPDATE' ? 'primary' :
            row.action === 'DELETE' ? 'error' : 'default'
          }
        />
      )
    },
    { field: 'table_name', headerName: getText('logs.table.tableName', 'Table'), minWidth: 150 },
    { field: 'record_id', headerName: getText('logs.table.recordId', 'Record ID'), minWidth: 100 },
    { 
      field: 'status', 
      headerName: getText('logs.table.status', 'Status'), 
      minWidth: 100,
      renderCell: (row) => (
        <Chip 
          label={row.status === 'success' ? getText('logs.status.success', 'Success') : getText('logs.status.failed', 'Failed')} 
          size="small"
          color={row.status === 'success' ? 'success' : 'error'}
        />
      )
    },
    { 
      field: 'error_message', 
      headerName: getText('logs.table.errorMessage', 'Error'), 
      minWidth: 200,
      renderCell: (row) => row.error_message || '-'
    },
  ];

  const logActions = (row) => (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
      <IconButton
        size="small"
        color="primary"
        onClick={() => handleViewLog(row.id)}
        disabled={loadingDetails}
        title={getText('logs.table.viewDetails', 'View Details')}
      >
        <VisibilityIcon />
      </IconButton>
    </Box>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  // Hide from non-admin users
  if (!user || (user.username !== 'admin' && user.username !== 'dev')) {
    return null;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            {getText('logs.title', 'Log History')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {getText('logs.subtitle', 'View all database activity logs')}
          </Typography>
        </Box>
        {isDevUser && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleClearLogs}
          >
            {getText('logs.clearButton', 'Clear Log History')}
          </Button>
        )}
      </Box>

      <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          {getText('logs.filters.title', 'Filters')}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label={getText('logs.filters.username', 'Username')}
              value={filters.username}
              onChange={(e) => handleFilterChange('username', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>{getText('logs.filters.tableName', 'Table Name')}</InputLabel>
              <Select
                value={filters.table_name}
                onChange={(e) => handleFilterChange('table_name', e.target.value)}
                label={getText('logs.filters.tableName', 'Table Name')}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="products">Products</MenuItem>
                <MenuItem value="units">Units</MenuItem>
                <MenuItem value="customers">Customers</MenuItem>
                <MenuItem value="sales">Sales</MenuItem>
                <MenuItem value="users">Users</MenuItem>
                <MenuItem value="purchase_history">Purchase History</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>{getText('logs.filters.action', 'Action')}</InputLabel>
              <Select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                label={getText('logs.filters.action', 'Action')}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="CREATE">{getText('logs.actions.create', 'CREATE')}</MenuItem>
                <MenuItem value="UPDATE">{getText('logs.actions.update', 'UPDATE')}</MenuItem>
                <MenuItem value="DELETE">{getText('logs.actions.delete', 'DELETE')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>{getText('logs.filters.status', 'Status')}</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label={getText('logs.filters.status', 'Status')}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="success">{getText('logs.status.success', 'Success')}</MenuItem>
                <MenuItem value="failed">{getText('logs.status.failed', 'Failed')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            onClick={handleApplyFilters}
          >
            {getText('logs.filters.apply', 'Apply Filters')}
          </Button>
          <Button
            variant="outlined"
            onClick={handleResetFilters}
          >
            {getText('logs.filters.reset', 'Reset Filters')}
          </Button>
        </Box>
      </Box>

      <DataTable
        columns={columns}
        data={logs}
        actions={logActions}
      />

      <ConfirmDialog
        open={clearDialog.open}
        title={getText('logs.clearDialog.title', 'Clear Log History')}
        message={getText('logs.clearDialog.message', 'Are you sure you want to clear all log history? This action cannot be undone.')}
        onConfirm={confirmClearLogs}
        onCancel={() => setClearDialog({ open: false })}
      />

      <LogDetailsModal
        open={viewDialog.open}
        logData={viewDialog.logData}
        onClose={() => setViewDialog({ open: false, logId: null, logData: null })}
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

export default Logs;

