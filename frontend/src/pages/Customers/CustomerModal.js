import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
} from '@mui/material';
import { customersAPI } from '../../services/api';
import { getText } from '../../utils/textConfig';

function CustomerModal({ open, mode, data, onClose, onSuccess, onError }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && data) {
        setFormData({
          name: data.name,
          phone: data.phone || '',
          address: data.address || '',
        });
      } else {
        setFormData({
          name: '',
          phone: '',
          address: '',
        });
      }
    }
  }, [open, mode, data]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name) {
      onError('Please enter customer name');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'add') {
        await customersAPI.create(formData);
        onSuccess(getText('customers.messages.addSuccess', 'Customer added successfully'));
      } else {
        await customersAPI.update(data.id, formData);
        onSuccess(getText('customers.messages.editSuccess', 'Customer updated successfully'));
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
        {mode === 'add' ? getText('customers.modal.addTitle', 'Add New Customer') : getText('customers.modal.editTitle', 'Edit Customer')}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={getText('customers.modal.name', 'Customer Name')}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={getText('customers.modal.phone', 'Phone Number')}
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={getText('customers.modal.address', 'Address')}
              multiline
              rows={3}
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={loading}>
          {getText('customers.modal.cancel', 'Cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {getText('customers.modal.submit', 'Submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CustomerModal;

