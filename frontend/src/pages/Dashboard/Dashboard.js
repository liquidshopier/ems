import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Inventory,
  People,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '../../services/api';
import { getText } from '../../utils/textConfig';
import { formatCurrency } from '../../utils/currency';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import AlertMessage from '../../components/Common/AlertMessage';
import DataTable from '../../components/Common/DataTable';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [purchaseTrend, setPurchaseTrend] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [alert, setAlert] = useState({ open: false, severity: 'info', message: '' });
  
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    product_type: '',
  });

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async (customFilters = {}) => {
    setLoading(true);
    try {
      const params = { ...filters, ...customFilters };
      
      const [statsRes, topProductsRes, salesTrendRes, purchaseTrendRes, lowStockRes] = await Promise.all([
        dashboardAPI.getStats(params),
        dashboardAPI.getTopProducts({ ...params, limit: 10 }),
        dashboardAPI.getSalesTrend({ ...params, group_by: 'day' }),
        dashboardAPI.getPurchaseTrend({ ...params, group_by: 'day' }),
        dashboardAPI.getLowStock({ threshold: 10 }),
      ]);

      setStats(statsRes.data);
      setTopProducts(topProductsRes.data);
      setSalesTrend(salesTrendRes.data);
      setPurchaseTrend(purchaseTrendRes.data);
      setLowStock(lowStockRes.data);
    } catch (error) {
      setAlert({ open: true, severity: 'error', message: error.toString() });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilter = () => {
    fetchDashboardData(filters);
  };

  const handleResetFilter = () => {
    const resetFilters = { start_date: '', end_date: '', product_type: '' };
    setFilters(resetFilters);
    fetchDashboardData(resetFilters);
  };

  const statCards = [
    {
      title: getText('dashboard.stats.totalRevenue', 'Total Revenue'),
      value: formatCurrency(stats?.total_revenue || 0),
      icon: <AttachMoney />,
      color: '#4caf50',
    },
    {
      title: getText('dashboard.stats.totalCost', 'Total Cost'),
      value: formatCurrency(stats?.total_cost || 0),
      icon: <TrendingDown />,
      color: '#f44336',
    },
    {
      title: getText('dashboard.stats.profit', 'Profit'),
      value: formatCurrency(stats?.profit || 0),
      icon: <TrendingUp />,
      color: stats?.profit >= 0 ? '#2196f3' : '#ff9800',
    },
    {
      title: getText('dashboard.stats.totalProducts', 'Total Products'),
      value: stats?.total_products || 0,
      icon: <Inventory />,
      color: '#9c27b0',
    },
    {
      title: getText('dashboard.stats.totalCustomers', 'Total Customers'),
      value: stats?.total_customers || 0,
      icon: <People />,
      color: '#00bcd4',
    },
    {
      title: getText('dashboard.stats.totalOverpaid', 'Total Overpaid'),
      value: formatCurrency(stats?.total_overpaid || 0),
      icon: <AttachMoney />,
      color: '#4caf50',
    },
    {
      title: getText('dashboard.stats.totalUnderpaid', 'Total Underpaid'),
      value: formatCurrency(stats?.total_underpaid || 0),
      icon: <AttachMoney />,
      color: '#ff5722',
    },
    {
      title: getText('dashboard.stats.netBalance', 'Net Balance'),
      value: formatCurrency(stats?.net_balance || 0),
      icon: <AttachMoney />,
      color: stats?.net_balance >= 0 ? '#4caf50' : '#f44336',
    },
  ];

  const topProductColumns = [
    { field: 'product_name', headerName: getText('dashboard.tables.productName', 'Product Name'), minWidth: 200 },
    { field: 'total_qty_sold', headerName: getText('dashboard.tables.qtySold', 'Qty Sold'), minWidth: 100, align: 'right', renderCell: (row) => parseFloat(row.total_qty_sold).toFixed(2) },
    { field: 'total_revenue', headerName: getText('dashboard.tables.revenue', 'Revenue'), minWidth: 120, align: 'right', renderCell: (row) => formatCurrency(row.total_revenue) },
    { field: 'sale_count', headerName: getText('dashboard.tables.salesCount', 'Sales Count'), minWidth: 120, align: 'right' },
  ];

  const lowStockColumns = [
    { field: 'name', headerName: getText('dashboard.tables.productName', 'Product Name'), minWidth: 200 },
    { field: 'qty', headerName: getText('dashboard.tables.quantity', 'Quantity'), minWidth: 100, align: 'right', renderCell: (row) => `${parseFloat(row.qty).toFixed(2)} ${row.unit_value}` },
    { field: 'sale_price', headerName: getText('dashboard.tables.price', 'Price'), minWidth: 100, align: 'right', renderCell: (row) => formatCurrency(row.sale_price) },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {getText('dashboard.title', 'Dashboard')}
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label={getText('dashboard.filters.startDate', 'Start Date')}
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label={getText('dashboard.filters.endDate', 'End Date')}
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button fullWidth variant="contained" onClick={handleApplyFilter}>
              {getText('dashboard.filters.apply', 'Apply Filter')}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button fullWidth variant="outlined" onClick={handleResetFilter}>
              {getText('dashboard.filters.reset', 'Reset')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {card.title}
                    </Typography>
                    <Typography variant="h5" component="div">
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color, fontSize: 40 }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {getText('dashboard.charts.salesTrend', 'Sales Trend')}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total_revenue" stroke="#2196f3" name={getText('dashboard.charts.revenue', 'Revenue')} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {getText('dashboard.charts.purchaseTrend', 'Purchase Trend')}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={purchaseTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total_cost" stroke="#f44336" name={getText('dashboard.charts.cost', 'Cost')} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Products */}
      <Box sx={{ mb: 3 }}>
        <DataTable
          title={getText('dashboard.charts.topProducts', 'Top Selling Products')}
          columns={topProductColumns}
          data={topProducts}
        />
      </Box>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <Box>
          <DataTable
            title={getText('dashboard.charts.lowStock', 'Low Stock Alert')}
            columns={lowStockColumns}
            data={lowStock}
          />
        </Box>
      )}

      <AlertMessage
        open={alert.open}
        severity={alert.severity}
        message={alert.message}
        onClose={() => setAlert({ ...alert, open: false })}
      />
    </Box>
  );
}

export default Dashboard;

