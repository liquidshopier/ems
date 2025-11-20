import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Typography,
  Autocomplete,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { productsAPI, customersAPI, salesAPI } from '../../services/api';
import { getText } from '../../utils/textConfig';
import { formatCurrency } from '../../utils/currency';

function NewSaleModal({ open, onClose, onSuccess, onError }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQty, setSelectedQty] = useState('');
  const [saleItems, setSaleItems] = useState([]);
  const [customerType, setCustomerType] = useState('normal');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [outOfStockAlert, setOutOfStockAlert] = useState([]);

  useEffect(() => {
    if (open) {
      fetchProducts();
      fetchCustomers();
      resetForm();
    }
  }, [open]);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.getAll();
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setSelectedQty('');
    setSaleItems([]);
    setCustomerType('normal');
    setSelectedCustomer(null);
    setPaidAmount('');
    setOutOfStockAlert([]);
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      onError('Please select a product');
      return;
    }

    if (!selectedQty || parseFloat(selectedQty) < 1 || !Number.isInteger(parseFloat(selectedQty))) {
      onError(getText('products.modal.invalidQuantity', 'Please enter a valid quantity (minimum 1, integer only)'));
      return;
    }

    // Check if product already exists in items
    const existingIndex = saleItems.findIndex(item => item.product_id === selectedProduct.id);
    
    if (existingIndex >= 0) {
      // Update existing item
      const updatedItems = [...saleItems];
      const newQty = parseInt(updatedItems[existingIndex].qty) + parseInt(selectedQty);
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        qty: newQty,
        subtotal: newQty * selectedProduct.sale_price,
      };
      setSaleItems(updatedItems);
    } else {
      // Add new item
      const newItem = {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        qty: parseInt(selectedQty),
        unit_price: selectedProduct.sale_price,
        subtotal: parseInt(selectedQty) * selectedProduct.sale_price,
        unit_value: selectedProduct.unit_value,
        available_qty: selectedProduct.qty,
      };
      setSaleItems([...saleItems, newItem]);
    }

    setSelectedProduct(null);
    setSelectedQty('');
  };

  const handleRemoveItem = (index) => {
    const updatedItems = saleItems.filter((_, i) => i !== index);
    setSaleItems(updatedItems);
    setOutOfStockAlert([]);
  };

  const calculateTotal = () => {
    return saleItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmit = async () => {
    if (saleItems.length === 0) {
      onError(getText('sales.messages.noItems', 'Please add at least one item'));
      return;
    }

    const totalAmount = calculateTotal();
    const paid = customerType === 'normal' ? totalAmount : (parseFloat(paidAmount) || 0);

    if (customerType === 'registered' && !selectedCustomer) {
      onError('Please select a customer');
      return;
    }

    setLoading(true);
    setOutOfStockAlert([]);

    try {
      const saleData = {
        items: saleItems,
        customer_id: customerType === 'registered' ? selectedCustomer.id : null,
        customer_name: customerType === 'registered' ? selectedCustomer.name : getText('sales.modal.normalCustomer', 'Normal Customer'),
        total_amount: totalAmount,
        paid_amount: paid,
      };

      await salesAPI.create(saleData);
      onSuccess(getText('sales.messages.addSuccess', 'Sale completed successfully'));
      onClose(true);
    } catch (error) {
      // Check if it's an out of stock error
      if (error.out_of_stock) {
        setOutOfStockAlert(error.out_of_stock);
        onError(getText('sales.messages.outOfStock', 'Some items are out of stock'));
      } else {
        onError(error.toString());
      }
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = calculateTotal();

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>{getText('sales.modal.title', 'New Sale')}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Out of Stock Alert */}
          {outOfStockAlert.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                {getText('sales.messages.outOfStock', 'Some items are out of stock')}:
              </Typography>
              {outOfStockAlert.map((item, index) => (
                <Typography key={index} variant="body2">
                  • {item.product_name}: Available {item.available_qty}, Requested {item.requested_qty}
                </Typography>
              ))}
            </Alert>
          )}

          {/* Product Selection */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  value={selectedProduct}
                  onChange={(event, newValue) => setSelectedProduct(newValue)}
                  options={products}
                  getOptionLabel={(option) => `${option.name} (Stock: ${option.qty} ${option.unit_value})`}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label={getText('sales.modal.selectProduct', 'Select Product')}
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label={getText('sales.modal.qty', 'Quantity')}
                  type="number"
                  value={selectedQty}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow positive integers
                    if (value === '' || (parseInt(value) >= 1 && Number.isInteger(parseFloat(value)))) {
                      setSelectedQty(value);
                    }
                  }}
                  inputProps={{ min: 1, step: 1 }}
                  placeholder="Min: 1"
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                >
                  {getText('sales.modal.addItem', 'Add Item')}
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Sale Items Table */}
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{getText('sales.modal.productName', 'Product')}</TableCell>
                  <TableCell align="right">{getText('sales.modal.qty', 'Quantity')}</TableCell>
                  <TableCell align="right">{getText('sales.modal.subtotal', 'Subtotal')}</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {saleItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      {getText('common.noData', 'No data available')}
                    </TableCell>
                  </TableRow>
                ) : (
                  saleItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {item.product_name}
                        {outOfStockAlert.find(a => a.product_id === item.product_id) && (
                          <Typography variant="caption" color="error" display="block">
                            Out of stock!
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {item.qty.toFixed(2)} {item.unit_value}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.subtotal)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {saleItems.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={2} align="right">
                      <strong>{getText('sales.modal.total', 'Total')}:</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>{formatCurrency(totalAmount)}</strong>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Customer Selection */}
          <Paper sx={{ p: 2 }}>
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">{getText('sales.modal.customerName', 'Customer Name')}</FormLabel>
              <RadioGroup
                row
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
              >
                <FormControlLabel 
                  value="normal" 
                  control={<Radio />} 
                  label={getText('sales.modal.normalCustomer', 'Normal Customer')} 
                />
                <FormControlLabel 
                  value="registered" 
                  control={<Radio />} 
                  label={getText('sales.modal.registeredCustomer', 'Registered Customer')} 
                />
              </RadioGroup>
            </FormControl>

            {customerType === 'registered' && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    value={selectedCustomer}
                    onChange={(event, newValue) => setSelectedCustomer(newValue)}
                    options={customers}
                    getOptionLabel={(option) => option.name}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label={getText('sales.modal.selectCustomerRequired', 'Select Customer *')}
                        required
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={getText('sales.modal.paidAmount', 'Paid Amount')}
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText={`Total: ${formatCurrency(totalAmount)}`}
                  />
                </Grid>
              </Grid>
            )}
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={loading}>
          {getText('sales.modal.cancel', 'Cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {getText('sales.modal.submit', 'Complete Sale')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default NewSaleModal;

