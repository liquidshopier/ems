import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { salesAPI } from '../../services/api';
import { getText } from '../../utils/textConfig';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/timezone';
import { formatCurrency } from '../../utils/currency';
import DataTable from '../../components/Common/DataTable';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import AlertMessage from '../../components/Common/AlertMessage';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import NewSaleModal from './NewSaleModal';
import SaleDetailsModal from './SaleDetailsModal';

function Sales() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [alert, setAlert] = useState({ open: false, severity: 'info', message: '' });
  
  const [saleModal, setSaleModal] = useState({ open: false });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [viewDialog, setViewDialog] = useState({ open: false, saleId: null, saleData: null });

  // Check if user is admin or dev
  const isAdminOrDev = user?.username === 'admin' || user?.username === 'dev';

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await salesAPI.getAll();
      setSales(response.data || []);
    } catch (error) {
      setAlert({ open: true, severity: 'error', message: error.toString() });
    } finally {
      setLoading(false);
    }
  };

  const handleNewSale = () => {
    setSaleModal({ open: true });
  };

  const handleDeleteSale = (id) => {
    setDeleteDialog({ open: true, id });
  };

  const handleViewSale = async (id) => {
    try {
      const response = await salesAPI.getById(id);
      setViewDialog({ open: true, saleId: id, saleData: response.data });
    } catch (error) {
      setAlert({ open: true, severity: 'error', message: error.toString() });
    }
  };

  const confirmDelete = async () => {
    try {
      await salesAPI.delete(deleteDialog.id);
      setAlert({ open: true, severity: 'success', message: getText('sales.messages.deleteSuccess', 'Sale deleted successfully') });
      fetchSales();
    } catch (error) {
      setAlert({ open: true, severity: 'error', message: error.toString() });
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const handleSaleModalClose = (shouldRefresh) => {
    setSaleModal({ open: false });
    if (shouldRefresh) {
      fetchSales();
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'overpaid':
        return 'info';
      case 'underpaid':
        return 'warning';
      default:
        return 'default';
    }
  };

  const salesColumns = [
    { 
      field: 'id', 
      headerName: getText('sales.table.id', 'ID'), 
      minWidth: 70,
      renderCell: (row, rowNumber) => rowNumber
    },
    { field: 'customer_name', headerName: getText('sales.table.customerName', 'Customer'), minWidth: 150 },
    { 
      field: 'total_amount', 
      headerName: getText('sales.table.totalAmount', 'Total Amount'), 
      minWidth: 120, 
      align: 'right',
      renderCell: (row) => formatCurrency(row.total_amount)
    },
    { 
      field: 'paid_amount', 
      headerName: getText('sales.table.paidAmount', 'Paid Amount'), 
      minWidth: 120, 
      align: 'right',
      renderCell: (row) => formatCurrency(row.paid_amount)
    },
    { 
      field: 'payment_status', 
      headerName: getText('sales.table.paymentStatus', 'Status'), 
      minWidth: 120,
      renderCell: (row) => {
        const statusText = getText(`sales.paymentStatus.${row.payment_status}`, row.payment_status);
        return (
          <Chip 
            label={statusText}
            color={getPaymentStatusColor(row.payment_status)}
            size="small"
          />
        );
      }
    },
    { 
      field: 'item_count', 
      headerName: getText('sales.table.itemCount', 'Items'), 
      minWidth: 100,
      align: 'center'
    },
    { 
      field: 'sale_date', 
      headerName: getText('sales.table.saleDate', 'Sale Date'), 
      minWidth: 180,
      renderCell: (row) => formatDateTime(row.sale_date)
    },
  ];

  const salesActions = (row) => (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <IconButton
        size="small"
        color="primary"
        onClick={() => handleViewSale(row.id)}
        title={getText('sales.table.viewDetails', 'View Order Details')}
      >
        <VisibilityIcon />
      </IconButton>
      {isAdminOrDev && (
        <IconButton
          size="small"
          color="error"
          onClick={() => handleDeleteSale(row.id)}
          title={getText('sales.table.delete', 'Delete Sale')}
        >
          <DeleteIcon />
        </IconButton>
      )}
    </Box>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {getText('sales.title', 'Sales')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewSale}
        >
          {getText('sales.newSaleButton', 'New Sale')}
        </Button>
      </Box>

      <DataTable
        columns={salesColumns}
        data={sales}
        actions={salesActions}
      />

      <NewSaleModal
        open={saleModal.open}
        onClose={handleSaleModalClose}
        onSuccess={(message) => setAlert({ open: true, severity: 'success', message })}
        onError={(message) => setAlert({ open: true, severity: 'error', message })}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title={getText('common.confirm', 'Confirm')}
        message={getText('sales.messages.deleteConfirm', 'Are you sure you want to delete this sale?')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
      />

      <SaleDetailsModal
        open={viewDialog.open}
        saleData={viewDialog.saleData}
        onClose={() => setViewDialog({ open: false, saleId: null, saleData: null })}
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

export default Sales;

