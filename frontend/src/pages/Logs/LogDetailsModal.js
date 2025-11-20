import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { getText } from '../../utils/textConfig';
import { formatDateTime } from '../../utils/timezone';

function LogDetailsModal({ open, logData, onClose }) {
  if (!logData) return null;

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'primary';
      case 'DELETE':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    return status === 'success' ? 'success' : 'error';
  };

  const formatDate = (dateString) => formatDateTime(dateString);

  // Render data object as a readable table
  const renderDataTable = (data, title) => {
    if (!data || typeof data !== 'object') return null;

    const entries = Object.entries(data).filter(([key]) => key !== 'id'); // Exclude id for cleaner display

    if (entries.length === 0) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>{getText('logs.details.field', 'Field')}</strong></TableCell>
                <TableCell><strong>{getText('logs.details.value', 'Value')}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell>
                    <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
                  </TableCell>
                  <TableCell>
                    {typeof value === 'object' ? (
                      <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {JSON.stringify(value, null, 2)}
                      </Typography>
                    ) : (
                      String(value === null || value === undefined ? '-' : value)
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={() => onClose()} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            {getText('logs.details.title', 'Log Details')} #{logData.id}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={logData.action}
              color={getActionColor(logData.action)}
              size="small"
            />
            <Chip
              label={logData.status === 'success' ? getText('logs.status.success', 'Success') : getText('logs.status.failed', 'Failed')}
              color={getStatusColor(logData.status)}
              size="small"
            />
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mt: 1 }}>
          {/* Basic Information */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>{getText('logs.table.timestamp', 'Time')}:</strong> {formatDate(logData.created_at)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>{getText('logs.table.username', 'User')}:</strong> {logData.username}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>{getText('logs.table.action', 'Action')}:</strong> {logData.action}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>{getText('logs.table.tableName', 'Table')}:</strong> {logData.table_name}
              </Typography>
            </Grid>
            {logData.record_id && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>{getText('logs.table.recordId', 'Record ID')}:</strong> {logData.record_id}
                </Typography>
              </Grid>
            )}
            {logData.ip_address && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>{getText('logs.details.ipAddress', 'IP Address')}:</strong> {logData.ip_address}
                </Typography>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* Error Message (if failed) */}
          {logData.status === 'failed' && logData.error_message && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="error" gutterBottom>
                {getText('logs.details.errorMessage', 'Error Message')}:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                <Typography variant="body2">{logData.error_message}</Typography>
              </Paper>
            </Box>
          )}

          {/* Old Data (for UPDATE/DELETE) */}
          {logData.action !== 'CREATE' && logData.old_data && (
            <>
              {renderDataTable(logData.old_data, getText('logs.details.beforeChanges', 'Before Changes'))}
            </>
          )}

          {/* New Data (for CREATE/UPDATE) */}
          {logData.action !== 'DELETE' && logData.new_data && (
            <>
              {renderDataTable(logData.new_data, getText('logs.details.afterChanges', 'After Changes'))}
            </>
          )}

          {/* Show message if no data changes */}
          {(!logData.old_data && !logData.new_data) && (
            <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
              {getText('logs.details.noDataChanges', 'No data changes recorded for this log entry.')}
            </Typography>
          )}
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

export default LogDetailsModal;

