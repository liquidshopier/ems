import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AddCircle as AddQtyIcon,
} from '@mui/icons-material';
import { productsAPI, purchaseHistoryAPI } from '../../services/api';
import { getText } from '../../utils/textConfig';
import { formatDateOnly, formatDateTime } from '../../utils/timezone';
import { formatCurrency } from '../../utils/currency';
import DataTable from '../../components/Common/DataTable';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import AlertMessage from '../../components/Common/AlertMessage';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import ProductModal from './ProductModal';
import AddQuantityModal from './AddQuantityModal';

function Products() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [alert, setAlert] = useState({ open: false, severity: 'info', message: '' });
  
  const [productModal, setProductModal] = useState({ open: false, mode: 'add', data: null });
  const [qtyModal, setQtyModal] = useState({ open: false, product: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  useEffect(() => {
    fetchProducts();
    fetchPurchaseHistory();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data || []);
    } catch (error) {
      setAlert({ open: true, severity: 'error', message: error.toString() });
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseHistory = async () => {
    try {
      const response = await purchaseHistoryAPI.getAll();
      setPurchaseHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching purchase history:', error);
    }
  };

  const handleAddProduct = () => {
    setProductModal({ open: true, mode: 'add', data: null });
  };

  const handleEditProduct = (product) => {
    setProductModal({ open: true, mode: 'edit', data: product });
  };

  const handleDeleteProduct = (id) => {
    setDeleteDialog({ open: true, id });
  };

  const confirmDelete = async () => {
    try {
      await productsAPI.delete(deleteDialog.id);
      setAlert({ open: true, severity: 'success', message: getText('products.messages.deleteSuccess', 'Product deleted successfully') });
      fetchProducts();
    } catch (error) {
      setAlert({ open: true, severity: 'error', message: error.toString() });
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const handleAddQuantity = (product) => {
    setQtyModal({ open: true, product });
  };

  const handleProductModalClose = (shouldRefresh) => {
    setProductModal({ open: false, mode: 'add', data: null });
    if (shouldRefresh) {
      fetchProducts();
      fetchPurchaseHistory();
    }
  };

  const handleQtyModalClose = (shouldRefresh) => {
    setQtyModal({ open: false, product: null });
    if (shouldRefresh) {
      fetchProducts();
      fetchPurchaseHistory();
    }
  };

  const productColumns = [
    { 
      field: 'id', 
      headerName: getText('products.table.id', 'ID'), 
      minWidth: 70,
      renderCell: (row, rowNumber) => rowNumber
    },
    { field: 'name', headerName: getText('products.table.name', 'Product Name'), minWidth: 200 },
    { 
      field: 'qty', 
      headerName: getText('products.table.qty', 'Quantity'), 
      minWidth: 120, 
      align: 'right',
      renderCell: (row) => `${parseFloat(row.qty).toFixed(2)} ${row.unit_value}`
    },
    { field: 'unit_value', headerName: getText('products.table.unit', 'Unit'), minWidth: 100 },
    { 
      field: 'description', 
      headerName: getText('products.table.description', 'Description'), 
      minWidth: 200,
      renderCell: (row) => row.description || '-'
    },
    { 
      field: 'original_price', 
      headerName: getText('products.table.originalPrice', 'Original Price'), 
      minWidth: 120, 
      align: 'right',
      renderCell: (row) => formatCurrency(row.original_price)
    },
    { 
      field: 'sale_price', 
      headerName: getText('products.table.salePrice', 'Sale Price'), 
      minWidth: 120, 
      align: 'right',
      renderCell: (row) => formatCurrency(row.sale_price)
    },
    { 
      field: 'created_at', 
      headerName: getText('products.table.createdAt', 'Created At'), 
      minWidth: 150,
      renderCell: (row) => formatDateOnly(row.created_at)
    },
  ];

  const purchaseHistoryColumns = [
    { 
      field: 'id', 
      headerName: getText('products.purchaseHistory.table.id', 'ID'), 
      minWidth: 70,
      renderCell: (row, rowNumber) => rowNumber
    },
    { field: 'product_name', headerName: getText('products.purchaseHistory.table.productName', 'Product Name'), minWidth: 200 },
    { 
      field: 'qty', 
      headerName: getText('products.purchaseHistory.table.quantity', 'Quantity'), 
      minWidth: 120, 
      align: 'right',
      renderCell: (row) => `${parseFloat(row.qty).toFixed(2)} ${row.unit_value || ''}`
    },
    { field: 'unit_value', headerName: getText('products.purchaseHistory.table.unit', 'Unit'), minWidth: 100 },
    { 
      field: 'price', 
      headerName: getText('products.purchaseHistory.table.price', 'Unit Price'), 
      minWidth: 120, 
      align: 'right',
      renderCell: (row) => formatCurrency(row.price)
    },
    { 
      field: 'total_amount', 
      headerName: getText('products.purchaseHistory.table.total', 'Total Amount'), 
      minWidth: 120, 
      align: 'right',
      renderCell: (row) => formatCurrency(row.total_amount)
    },
    { 
      field: 'purchase_date', 
      headerName: getText('products.purchaseHistory.table.date', 'Date'), 
      minWidth: 150,
      renderCell: (row) => formatDateTime(row.purchase_date)
    },
    { field: 'notes', headerName: getText('products.purchaseHistory.table.notes', 'Notes'), minWidth: 150 },
  ];

  const productActions = (row) => (
    <Box>
      <IconButton
        size="small"
        color="success"
        onClick={() => handleAddQuantity(row)}
        title={getText('products.actions.addQty', 'Add Qty')}
      >
        <AddQtyIcon />
      </IconButton>
      <IconButton
        size="small"
        color="primary"
        onClick={() => handleEditProduct(row)}
        title={getText('products.actions.edit', 'Edit')}
      >
        <EditIcon />
      </IconButton>
      <IconButton
        size="small"
        color="error"
        onClick={() => handleDeleteProduct(row.id)}
        title={getText('products.actions.delete', 'Delete')}
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
          {getText('products.title', 'Products')}
        </Typography>
        {activeTab === 0 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddProduct}
          >
            {getText('products.addButton', 'Add Product')}
          </Button>
        )}
      </Box>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
        <Tab label={getText('products.tabs.allProducts', 'All Products')} />
        <Tab label={getText('products.tabs.purchaseHistory', 'Purchase History')} />
      </Tabs>

      {activeTab === 0 && (
        <DataTable
          columns={productColumns}
          data={products}
          actions={productActions}
        />
      )}

      {activeTab === 1 && (
        <DataTable
          columns={purchaseHistoryColumns}
          data={purchaseHistory}
        />
      )}

      <ProductModal
        open={productModal.open}
        mode={productModal.mode}
        data={productModal.data}
        onClose={handleProductModalClose}
        onSuccess={(message) => setAlert({ open: true, severity: 'success', message })}
        onError={(message) => setAlert({ open: true, severity: 'error', message })}
      />

      <AddQuantityModal
        open={qtyModal.open}
        product={qtyModal.product}
        onClose={handleQtyModalClose}
        onSuccess={(message) => setAlert({ open: true, severity: 'success', message })}
        onError={(message) => setAlert({ open: true, severity: 'error', message })}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title={getText('common.confirm', 'Confirm')}
        message={getText('products.messages.deleteConfirm', 'Are you sure you want to delete this product?')}
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

export default Products;

