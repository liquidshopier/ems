import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { customersAPI } from '../../services/api';
import { getText } from '../../utils/textConfig';
import { formatDateOnly } from '../../utils/timezone';
import { formatCurrency } from '../../utils/currency';
import DataTable from '../../components/Common/DataTable';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import AlertMessage from '../../components/Common/AlertMessage';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import CustomerModal from './CustomerModal';

function Customers() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [alert, setAlert] = useState({ open: false, severity: 'info', message: '' });
  
  const [customerModal, setCustomerModal] = useState({ open: false, mode: 'add', data: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await customersAPI.getAll();
      setCustomers(response.data || []);
    } catch (error) {
      setAlert({ open: true, severity: 'error', message: error.toString() });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    setCustomerModal({ open: true, mode: 'add', data: null });
  };

  const handleEditCustomer = (customer) => {
    setCustomerModal({ open: true, mode: 'edit', data: customer });
  };

  const handleDeleteCustomer = (id) => {
    setDeleteDialog({ open: true, id });
  };

  const confirmDelete = async () => {
    try {
      await customersAPI.delete(deleteDialog.id);
      setAlert({ open: true, severity: 'success', message: getText('customers.messages.deleteSuccess', 'Customer deleted successfully') });
      fetchCustomers();
    } catch (error) {
      setAlert({ open: true, severity: 'error', message: error.toString() });
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const handleCustomerModalClose = (shouldRefresh) => {
    setCustomerModal({ open: false, mode: 'add', data: null });
    if (shouldRefresh) {
      fetchCustomers();
    }
  };

  const customerColumns = [
    { 
      field: 'id', 
      headerName: getText('customers.table.id', 'ID'), 
      minWidth: 70,
      renderCell: (row, rowNumber) => rowNumber
    },
    { field: 'name', headerName: getText('customers.table.name', 'Name'), minWidth: 150 },
    { field: 'phone', headerName: getText('customers.table.phone', 'Phone'), minWidth: 120 },
    { 
      field: 'address', 
      headerName: getText('customers.table.address', 'Address'), 
      minWidth: 150,
      renderCell: (row) => row.address || '-'
    },
    { 
      field: 'overpaid_amount', 
      headerName: getText('customers.table.overpaidAmount', 'Overpaid'), 
      minWidth: 120, 
      align: 'right',
      renderCell: (row) => formatCurrency(row.overpaid_amount)
    },
    { 
      field: 'underpaid_amount', 
      headerName: getText('customers.table.underpaidAmount', 'Underpaid'), 
      minWidth: 120, 
      align: 'right',
      renderCell: (row) => formatCurrency(row.underpaid_amount)
    },
    { 
      field: 'created_at', 
      headerName: getText('customers.table.createdAt', 'Registered'), 
      minWidth: 150,
      renderCell: (row) => formatDateOnly(row.created_at)
    },
  ];

  const customerActions = (row) => (
    <Box>
      <IconButton
        size="small"
        color="primary"
        onClick={() => handleEditCustomer(row)}
        title={getText('customers.actions.edit', 'Edit')}
      >
        <EditIcon />
      </IconButton>
      <IconButton
        size="small"
        color="error"
        onClick={() => handleDeleteCustomer(row.id)}
        title={getText('customers.actions.delete', 'Delete')}
      >
        <DeleteIcon />
      </IconButton>
    </Box>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {getText('customers.title', 'Customers')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddCustomer}
        >
          {getText('customers.addButton', 'Add Customer')}
        </Button>
      </Box>

      <DataTable
        columns={customerColumns}
        data={customers}
        actions={customerActions}
      />

      <CustomerModal
        open={customerModal.open}
        mode={customerModal.mode}
        data={customerModal.data}
        onClose={handleCustomerModalClose}
        onSuccess={(message) => setAlert({ open: true, severity: 'success', message })}
        onError={(message) => setAlert({ open: true, severity: 'error', message })}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title={getText('common.confirm', 'Confirm')}
        message={getText('customers.messages.deleteConfirm', 'Are you sure you want to delete this customer?')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
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

export default Customers;

