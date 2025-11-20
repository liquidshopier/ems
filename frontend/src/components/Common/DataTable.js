import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { getText } from '../../utils/textConfig';

function DataTable({ columns, data, onRowClick, actions, title, searchPlaceholder }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const filteredData = data.filter((row) => {
    if (!searchTerm) return true;
    return columns.some((column) => {
      const value = row[column.field];
      return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!orderBy) return 0;
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    if (aValue === bValue) return 0;
    if (order === 'asc') {
      return aValue < bValue ? -1 : 1;
    }
    return aValue > bValue ? -1 : 1;
  });

  const paginatedData = sortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
      <Box sx={{ 
        p: 2.5, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: 2,
        backgroundColor: '#fafafa',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {title && <Typography variant="h6" fontWeight="bold">{title}</Typography>}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{getText('common.rowsPerPage', 'Rows per page')}</InputLabel>
            <Select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              label={getText('common.rowsPerPage', 'Rows per page')}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
              <MenuItem value={200}>200</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <TextField
          size="small"
          placeholder={searchPlaceholder || getText('common.search', 'Search')}
          value={searchTerm}
          onChange={handleSearch}
          sx={{ minWidth: 250 }}
        />
      </Box>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth, fontWeight: 'bold' }}
                  sortDirection={orderBy === column.field ? order : false}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.field}
                      direction={orderBy === column.field ? order : 'asc'}
                      onClick={() => handleRequestSort(column.field)}
                    >
                      {column.headerName}
                    </TableSortLabel>
                  ) : (
                    column.headerName
                  )}
                </TableCell>
              ))}
              {actions && (
                <TableCell align="right">
                  {getText('common.actions', 'Actions')}
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} align="center">
                  {getText('common.noData', 'No data available')}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  hover
                  key={row.id || index}
                  onClick={() => onRowClick && onRowClick(row)}
                  sx={{ 
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:nth-of-type(odd)': {
                      backgroundColor: '#fafafa',
                    },
                    '&:hover': {
                      backgroundColor: '#f0f0f0 !important',
                    },
                  }}
                >
                  {columns.map((column) => {
                    const rowNumber = page * rowsPerPage + index + 1;
                    return (
                      <TableCell key={column.field} align={column.align || 'left'}>
                        {column.renderCell
                          ? column.renderCell(row, rowNumber)
                          : row[column.field]}
                      </TableCell>
                    );
                  })}
                  {actions && (
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage=""
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${getText('common.of', 'of')} ${count !== -1 ? count : `more than ${to}`}`}
      />
    </Paper>
  );
}

export default DataTable;

