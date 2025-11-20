const { database } = require('../config/database');

/**
 * Log activity to database
 * @param {Object} params - Logging parameters
 * @param {number} params.userId - User ID
 * @param {string} params.username - Username
 * @param {string} params.action - Action performed (CREATE, UPDATE, DELETE, etc.)
 * @param {string} params.tableName - Database table name
 * @param {number} params.recordId - ID of affected record
 * @param {Object} params.oldData - Data before change
 * @param {Object} params.newData - Data after change
 * @param {string} params.status - 'success' or 'failed'
 * @param {string} params.errorMessage - Error message if failed
 * @param {string} params.ipAddress - Client IP address
 */
async function logActivity({
    userId = null,
    username,
    action,
    tableName,
    recordId = null,
    oldData = null,
    newData = null,
    status = 'success',
    errorMessage = null,
    ipAddress = null
}) {
    try {
        const oldDataJSON = oldData ? JSON.stringify(oldData) : null;
        const newDataJSON = newData ? JSON.stringify(newData) : null;

        await database.query(
            `INSERT INTO activity_logs 
            (user_id, username, action, table_name, record_id, old_data, new_data, status, error_message, ip_address) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, username, action, tableName, recordId, oldDataJSON, newDataJSON, status, errorMessage, ipAddress]
        );
    } catch (error) {
        // Don't throw error - logging failure shouldn't break the app
        console.error('Logging error:', error.message);
    }
}

/**
 * Middleware to add logging helper to request object
 */
function loggingMiddleware(req, res, next) {
    // Add logging helper to request
    req.logActivity = async (params) => {
        await logActivity({
            userId: req.user?.id,
            username: req.user?.username || 'anonymous',
            ipAddress: req.ip || req.connection.remoteAddress,
            ...params
        });
    };

    next();
}

/**
 * Log product actions
 */
async function logProduct(user, action, recordId, oldData, newData, status = 'success', errorMessage = null, ipAddress = null) {
    await logActivity({
        userId: user?.id,
        username: user?.username || 'anonymous',
        action,
        tableName: 'products',
        recordId,
        oldData,
        newData,
        status,
        errorMessage,
        ipAddress
    });
}

/**
 * Log unit actions
 */
async function logUnit(user, action, recordId, oldData, newData, status = 'success', errorMessage = null, ipAddress = null) {
    await logActivity({
        userId: user?.id,
        username: user?.username || 'anonymous',
        action,
        tableName: 'units',
        recordId,
        oldData,
        newData,
        status,
        errorMessage,
        ipAddress
    });
}

/**
 * Log user actions
 */
async function logUser(user, action, recordId, oldData, newData, status = 'success', errorMessage = null, ipAddress = null) {
    await logActivity({
        userId: user?.id,
        username: user?.username || 'anonymous',
        action,
        tableName: 'users',
        recordId,
        oldData,
        newData,
        status,
        errorMessage,
        ipAddress
    });
}

/**
 * Log customer actions
 */
async function logCustomer(user, action, recordId, oldData, newData, status = 'success', errorMessage = null, ipAddress = null) {
    await logActivity({
        userId: user?.id,
        username: user?.username || 'anonymous',
        action,
        tableName: 'customers',
        recordId,
        oldData,
        newData,
        status,
        errorMessage,
        ipAddress
    });
}

/**
 * Log sale actions
 */
async function logSale(user, action, recordId, oldData, newData, status = 'success', errorMessage = null, ipAddress = null) {
    await logActivity({
        userId: user?.id,
        username: user?.username || 'anonymous',
        action,
        tableName: 'sales',
        recordId,
        oldData,
        newData,
        status,
        errorMessage,
        ipAddress
    });
}

/**
 * Log purchase history actions
 */
async function logPurchase(user, action, recordId, oldData, newData, status = 'success', errorMessage = null, ipAddress = null) {
    await logActivity({
        userId: user?.id,
        username: user?.username || 'anonymous',
        action,
        tableName: 'purchase_history',
        recordId,
        oldData,
        newData,
        status,
        errorMessage,
        ipAddress
    });
}

module.exports = {
    logActivity,
    loggingMiddleware,
    logProduct,
    logUnit,
    logUser,
    logCustomer,
    logSale,
    logPurchase
};

