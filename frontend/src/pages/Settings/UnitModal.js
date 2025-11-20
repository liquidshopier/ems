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
import { unitsAPI } from '../../services/api';
import { getText } from '../../utils/textConfig';

function UnitModal({ open, mode, data, onClose, onSuccess, onError }) {
  const [formData, setFormData] = useState({
    value: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && data) {
        setFormData({
          value: data.value,
        });
      } else {
        setFormData({
          value: '',
        });
      }
    }
  }, [open, mode, data]);

  const handleChange = (value) => {
    setFormData({ value });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.value) {
      onError('Please enter a unit value');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'add') {
        await unitsAPI.create(formData);
        onSuccess(getText('settings.units.messages.addSuccess', 'Unit added successfully'));
      } else {
        await unitsAPI.update(data.id, formData);
        onSuccess(getText('settings.units.messages.editSuccess', 'Unit updated successfully'));
      }
      onClose(true);
    } catch (error) {
      onError(error.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="xs" fullWidth>
      <DialogTitle>
        {mode === 'add' ? getText('settings.units.modal.addTitle', 'Add New Unit') : getText('settings.units.modal.editTitle', 'Edit Unit')}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Unit Value"
              value={formData.value}
              onChange={(e) => handleChange(e.target.value)}
              required
              placeholder="e.g., kg, L, pcs, box"
              autoFocus
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={loading}>
          {getText('settings.units.modal.cancel', 'Cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {getText('settings.units.modal.submit', 'Submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UnitModal;

