import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Divider,
  Chip,
} from '@mui/material';
import { getText } from '../../utils/textConfig';
import { formatDateTime } from '../../utils/timezone';
import { formatCurrency } from '../../utils/currency';

function SaleDetailsModal({ open, saleData, onClose }) {
  if (!saleData) return null;

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

  const formatDate = (dateString) => formatDateTime(dateString);

  return (
    <Dialog open={open} onClose={() => onClose()} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            {getText('sales.details.title', 'Order Details')} #{saleData.id}
          </Typography>
          <Chip 
            label={getText(`sales.paymentStatus.${saleData.payment_status}`, saleData.payment_status)}
            color={getPaymentStatusColor(saleData.payment_status)}
            size="small"
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {/* Customer and Date Info */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              <strong>{getText('sales.details.customer', 'Customer')}:</strong> {saleData.customer_name}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              <strong>{getText('sales.details.date', 'Sale Date')}:</strong> {formatDate(saleData.sale_date)}
            </Typography>
            {saleData.notes && (
              <Typography variant="body2" color="textSecondary">
                <strong>{getText('sales.details.notes', 'Notes')}:</strong> {saleData.notes}
              </Typography>
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Order Items Table */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {getText('sales.details.items', 'Order Items')}
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{getText('sales.details.product', 'Product')}</TableCell>
                  <TableCell align="right">{getText('sales.details.quantity', 'Quantity')}</TableCell>
                  <TableCell align="right">{getText('sales.details.unitPrice', 'Unit Price')}</TableCell>
                  <TableCell align="right">{getText('sales.details.subtotal', 'Subtotal')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(saleData.items || []).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell align="right">
                      {item.qty} {item.unit_value || ''}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(item.unit_price || 0)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(item.subtotal || 0)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {getText('sales.details.total', 'Total Amount')}:
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {formatCurrency(saleData.total_amount || 0)}
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} align="right">
                    <Typography variant="body2">
                      {getText('sales.details.paid', 'Paid Amount')}:
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatCurrency(saleData.paid_amount || 0)}
                    </Typography>
                  </TableCell>
                </TableRow>
                {saleData.payment_status !== 'paid' && (
                  <TableRow>
                    <TableCell colSpan={3} align="right">
                      <Typography variant="body2" color={saleData.payment_status === 'overpaid' ? 'info.main' : 'warning.main'}>
                        {saleData.payment_status === 'overpaid' 
                          ? getText('sales.details.overpaid', 'Overpaid Amount')
                          : getText('sales.details.underpaid', 'Underpaid Amount')}:
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color={saleData.payment_status === 'overpaid' ? 'info.main' : 'warning.main'}>
                        {formatCurrency(Math.abs(parseFloat(saleData.total_amount || 0) - parseFloat(saleData.paid_amount || 0)))}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()}>
          {getText('common.close', 'Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SaleDetailsModal;

