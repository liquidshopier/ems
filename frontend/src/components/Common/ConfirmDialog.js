import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { getText } from '../../utils/textConfig';

function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title || getText('common.confirm', 'Confirm')}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit">
          {getText('common.cancel', 'Cancel')}
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          {getText('common.delete', 'Delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDialog;

