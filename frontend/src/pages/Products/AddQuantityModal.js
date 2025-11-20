import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
} from '@mui/material';
import { productsAPI } from '../../services/api';
import { getText } from '../../utils/textConfig';

function AddQuantityModal({ open, product, onClose, onSuccess, onError }) {
  const [formData, setFormData] = useState({
    qty: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [isInitialStock, setIsInitialStock] = useState(false);

  useEffect(() => {
    if (open && product) {
      // Check if product has no quantity (initial stock)
      const isInitial = !product.qty || parseFloat(product.qty) === 0;
      setIsInitialStock(isInitial);
      setFormData({
        qty: '',
        description: '',
      });
    }
  }, [open, product]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.qty || parseFloat(formData.qty) < 1 || !Number.isInteger(parseFloat(formData.qty))) {
      onError(getText('products.modal.invalidQuantity', 'Please enter a valid quantity (minimum 1, integer only)'));
      return;
    }

    // Use default description if empty
    const description = formData.description.trim() || (isInitialStock 
      ? getText('products.modal.defaultDescriptionInitial', 'Initial stock')
      : getText('products.modal.defaultDescriptionStock', 'Stock addition'));

    setLoading(true);
    try {
      await productsAPI.addQuantity(product.id, {
        qty: parseInt(formData.qty),
        notes: description
      });
      onSuccess(getText('products.messages.addQtySuccess', 'Quantity added successfully'));
      onClose(true);
    } catch (error) {
      onError(error.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{getText('products.modal.addQtyTitle', 'Add Quantity to Product')}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>{getText('products.modal.productLabel', 'Product')}:</strong> {product?.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {getText('products.modal.currentQty', 'Current Qty')}: {product?.qty} {product?.unit_value}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={getText('products.modal.qty', 'Quantity')}
              type="number"
              value={formData.qty}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow positive integers
                if (value === '' || (parseInt(value) >= 1 && Number.isInteger(parseFloat(value)))) {
                  handleChange('qty', value);
                }
              }}
              required
              inputProps={{ min: 1, step: 1 }}
              helperText={getText('products.modal.qtyHelper', 'Min: 1 (integer)')}
              FormHelperTextProps={{ sx: { margin: 0 } }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={getText('products.modal.description', 'Description')}
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={isInitialStock 
                ? getText('products.modal.defaultDescriptionInitial', 'Initial stock')
                : getText('products.modal.defaultDescriptionStock', 'Stock addition')}
              helperText={getText('products.modal.descriptionHelper', 'Leave empty to use default description')}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={loading}>
          {getText('products.modal.cancel', 'Cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {getText('products.modal.submit', 'Submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddQuantityModal;

