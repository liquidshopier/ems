import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
} from '@mui/material';
import { productsAPI, unitsAPI } from '../../services/api';
import { getText } from '../../utils/textConfig';

function ProductModal({ open, mode, data, onClose, onSuccess, onError }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    qty: '',
    original_price: '',
    sale_price: '',
    unit_id: '',
  });
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUnits();
      if (mode === 'edit' && data) {
        setFormData({
          name: data.name,
          description: data.description || '',
          qty: data.qty,
          original_price: data.original_price,
          sale_price: data.sale_price,
          unit_id: data.unit_id,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          qty: '',
          original_price: '',
          sale_price: '',
          unit_id: '',
        });
      }
    }
  }, [open, mode, data]);

  const fetchUnits = async () => {
    try {
      const response = await unitsAPI.getAll();
      setUnits(response.data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.original_price || !formData.sale_price || !formData.unit_id) {
      onError('Please fill in all required fields');
      return;
    }

    if (mode === 'add') {
      if (!formData.qty || parseFloat(formData.qty) < 1 || !Number.isInteger(parseFloat(formData.qty))) {
        onError(getText('products.modal.invalidQuantity', 'Please enter a valid quantity (minimum 1, integer only)'));
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'add') {
        await productsAPI.create(formData);
        onSuccess(getText('products.messages.addSuccess', 'Product added successfully'));
      } else {
        // For edit mode, don't send qty
        const { qty, ...updateData } = formData;
        // Ensure description is included even if empty
        updateData.description = formData.description || '';
        await productsAPI.update(data.id, updateData);
        onSuccess(getText('products.messages.editSuccess', 'Product updated successfully'));
      }
      onClose(true);
    } catch (error) {
      onError(error.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'add' ? getText('products.modal.addTitle', 'Add New Product') : getText('products.modal.editTitle', 'Edit Product')}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={getText('products.modal.name', 'Product Name')}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={getText('products.modal.description', 'Description')}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={2}
              helperText={getText('products.modal.descriptionHelper', 'Optional - Add product description')}
            />
          </Grid>
          
          {mode === 'add' && (
            <Grid item xs={12} sm={6}>
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
          )}
          
          <Grid item xs={12} sm={mode === 'add' ? 6 : 12}>
            <TextField
              fullWidth
              select
              label={getText('products.modal.unit', 'Unit')}
              value={formData.unit_id}
              onChange={(e) => handleChange('unit_id', e.target.value)}
              required
            >
              {units.map((unit) => (
                <MenuItem key={unit.id} value={unit.id}>
                  {unit.value}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={getText('products.modal.originalPrice', 'Original Price')}
              type="number"
              value={formData.original_price}
              onChange={(e) => handleChange('original_price', e.target.value)}
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={getText('products.modal.salePrice', 'Sale Price')}
              type="number"
              value={formData.sale_price}
              onChange={(e) => handleChange('sale_price', e.target.value)}
              required
              inputProps={{ min: 0, step: 0.01 }}
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

export default ProductModal;

