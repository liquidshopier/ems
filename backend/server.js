const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const { testConnection, initializeDatabase } = require('./config/database');
const { loggingMiddleware } = require('./utils/logger');

// Import routes
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const productsRouter = require('./routes/products');
const unitsRouter = require('./routes/units');
const customersRouter = require('./routes/customers');
const salesRouter = require('./routes/sales');
const dashboardRouter = require('./routes/dashboard');
const purchaseHistoryRouter = require('./routes/purchaseHistory');
const logsRouter = require('./routes/logs');
const configRouter = require('./routes/config');
const licenseRouter = require('./routes/license');
const databaseViewRouter = require('./routes/databaseView');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Activity logging middleware (adds req.logActivity helper)
app.use(loggingMiddleware);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/units', unitsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/sales', salesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/purchase-history', purchaseHistoryRouter);
app.use('/api/logs', logsRouter);
app.use('/api/config', configRouter);
app.use('/api/license', licenseRouter);
app.use('/api/database-view', databaseViewRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: { message: 'Route not found' } });
});

// Start server
const startServer = async () => {
    try {
        await testConnection();
        await initializeDatabase();
        app.listen(PORT, () => {
            console.log(`✓ Server running on port ${PORT}`);
            console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

