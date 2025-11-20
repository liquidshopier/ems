import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
} from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import { getText } from '../../utils/textConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import AlertMessage from '../../components/Common/AlertMessage';
import { databaseViewAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function DatabaseView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [alert, setAlert] = useState({ open: false, severity: 'info', message: '' });
  const [detailModal, setDetailModal] = useState({ open: false, row: null, columns: [] });

  // Check if user is dev
  useEffect(() => {
    if (user && user.username !== 'dev') {
      navigate('/products'); // Redirect non-dev users
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.username === 'dev') {
      fetchAllTables();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAllTables = async () => {
    setLoading(true);
    try {
      const response = await databaseViewAPI.getAllTables();
      const tablesData = response.data || [];
      
      // Ensure all tables have proper array structure
      const normalizedTables = tablesData.map(table => ({
        ...table,
        columns: Array.isArray(table.columns) ? table.columns : [],
        previewData: Array.isArray(table.previewData) ? table.previewData : [],
        rowCount: table.rowCount || 0,
      }));
      
      setTables(normalizedTables);
      if (normalizedTables.length > 0) {
        setActiveTab(0);
      }
    } catch (error) {
      setAlert({ 
        open: true, 
        severity: 'error', 
        message: error.toString() || getText('databaseView.messages.loadError', 'Error loading database tables') 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return <Chip label="NULL" size="small" color="default" />;
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const getColumnType = (column) => {
    return column.type || 'TEXT';
  };

  const handleViewDetails = (row) => {
    setDetailModal({
      open: true,
      row: row,
      columns: currentTable.columns || []
    });
  };

  const handleCloseDetailModal = () => {
    setDetailModal({ open: false, row: null, columns: [] });
  };

  // Don't render if not dev user
  if (user?.username !== 'dev') {
    return null;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (tables.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          {getText('databaseView.title', 'Database View')}
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          {getText('databaseView.messages.noTables', 'No tables found in the database')}
        </Alert>
      </Box>
    );
  }

  const currentTable = tables[activeTab];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          {getText('databaseView.title', 'Database View')}
        </Typography>
        <Chip 
          label={`${tables.length} ${getText('databaseView.tables', 'tables')}`} 
          color="primary" 
          variant="outlined"
        />
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tables.map((table, index) => (
            <Tab
              key={table.name}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">{table.name}</Typography>
                  <Chip 
                    label={table.rowCount || 0} 
                    size="small" 
                    color="primary" 
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {currentTable && (
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Typography variant="h6" fontWeight="bold">
              {currentTable.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {getText('databaseView.tableInfo', 'Table Info')}: {currentTable.rowCount || 0} {getText('databaseView.rows', 'rows')} • {currentTable.columns?.length || 0} {getText('databaseView.columns', 'columns')}
            </Typography>
            {currentTable.error && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {currentTable.error}
              </Alert>
            )}
          </Box>

          {Array.isArray(currentTable.columns) && currentTable.columns.length > 0 && (
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                {getText('databaseView.schema', 'Table Structure')}
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: '#000000' }}>Field</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#000000' }}>Type</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: '#000000' }}>Null</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: '#000000' }}>Key</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#000000' }}>Default</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#000000' }}>Extra</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentTable.columns.map((column, index) => (
                      <TableRow key={index} hover>
                        <TableCell sx={{ fontWeight: column.pk ? 'bold' : 'normal' }}>
                          {column.name}
                          {column.pk && ' 🔑'}
                        </TableCell>
                        <TableCell>{getColumnType(column)}</TableCell>
                        <TableCell align="center">{column.notnull ? 'NO' : 'YES'}</TableCell>
                        <TableCell align="center">
                          {column.pk ? (
                            <Chip label="PRI" size="small" color="primary" />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{column.dflt_value || 'NULL'}</TableCell>
                        <TableCell>
                          {column.pk ? 'AUTO_INCREMENT' : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {currentTable.previewData && Array.isArray(currentTable.previewData) && currentTable.previewData.length > 0 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                {getText('databaseView.previewData', 'Table Data')} ({currentTable.previewData.length} {getText('databaseView.rows', 'rows')})
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600, overflow: 'auto' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      {Array.isArray(currentTable.columns) && currentTable.columns.map((column) => (
                        <TableCell 
                          key={column.name} 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: '#000000',
                            minWidth: 120,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {column.name}
                        </TableCell>
                      ))}
                      <TableCell 
                        align="center" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: '#000000',
                          minWidth: 80
                        }}
                      >
                        {getText('databaseView.actions', 'Actions')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentTable.previewData.map((row, rowIndex) => (
                      <TableRow key={rowIndex} hover>
                        {Array.isArray(currentTable.columns) && currentTable.columns.map((column) => (
                          <TableCell 
                            key={column.name} 
                            sx={{ 
                              maxWidth: 200, 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={String(formatValue(row[column.name]))}
                          >
                            {formatValue(row[column.name])}
                          </TableCell>
                        ))}
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewDetails(row)}
                            title={getText('databaseView.viewDetails', 'View Details')}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {currentTable.previewData && currentTable.previewData.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                {getText('databaseView.messages.noData', 'No data in this table')}
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      <AlertMessage
        open={alert.open}
        severity={alert.severity}
        message={alert.message}
        onClose={() => setAlert({ ...alert, open: false })}
      />

      {/* Row Details Modal */}
      <Dialog
        open={detailModal.open}
        onClose={handleCloseDetailModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {getText('databaseView.detailModal.title', 'Row Details')}
        </DialogTitle>
        <DialogContent>
          {detailModal.row && detailModal.columns.length > 0 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {detailModal.columns.map((column) => {
                const value = detailModal.row[column.name];
                return (
                  <Grid item xs={12} sm={6} key={column.name}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                        {column.name}
                        {column.pk && ' 🔑'}
                        <Chip 
                          label={getColumnType(column)} 
                          size="small" 
                          sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                          variant="outlined"
                        />
                      </Typography>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 1.5, 
                          bgcolor: 'grey.50',
                          minHeight: 40,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {value === null || value === undefined ? (
                            <Chip label="NULL" size="small" color="default" />
                          ) : typeof value === 'boolean' ? (
                            value ? 'Yes' : 'No'
                          ) : typeof value === 'object' ? (
                            <Box component="pre" sx={{ fontSize: '0.75rem', m: 0, whiteSpace: 'pre-wrap' }}>
                              {JSON.stringify(value, null, 2)}
                            </Box>
                          ) : (
                            String(value)
                          )}
                        </Typography>
                      </Paper>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailModal}>
            {getText('common.close', 'Close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DatabaseView;

