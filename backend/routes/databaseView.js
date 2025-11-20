const express = require('express');
const router = express.Router();
const { database, allAsync, getAsync } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication and dev user only
router.use(authenticateToken);

// Middleware to check if user is dev
const requireDev = (req, res, next) => {
    if (req.user.username !== 'dev') {
        return res.status(403).json({ 
            success: false, 
            error: 'Access denied. Developer privileges required.' 
        });
    }
    next();
};

router.use(requireDev);

// Helper function to validate table name
const validateTableName = (tableName) => {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName);
};

// Get all table names
router.get('/tables', async (req, res) => {
    try {
        const [tables] = await database.query(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `);
        
        const tableNames = tables.map(table => table.name);
        res.json({ success: true, data: tableNames });
    } catch (error) {
        console.error('Error fetching table names:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get data from a specific table
router.get('/table/:tableName', async (req, res) => {
    try {
        const { tableName } = req.params;
        const { limit = 1000, offset = 0 } = req.query;
        
        // Validate table name to prevent SQL injection
        if (!validateTableName(tableName)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid table name' 
            });
        }
        
        // Get table schema first - use allAsync for PRAGMA (table name is validated)
        const schemaRows = await allAsync(`PRAGMA table_info("${tableName}")`);
        // Map SQLite schema to expected format
        const schema = Array.isArray(schemaRows) ? schemaRows.map(col => ({
            name: col.name,
            type: col.type || 'TEXT',
            notnull: col.notnull === 1,
            pk: col.pk === 1,
            dflt_value: col.dflt_value
        })) : [];
        
        // Get total count (table name is validated)
        const countRow = await getAsync(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const totalCount = countRow ? countRow.count : 0;
        
        // Get table data with pagination (table name is validated)
        const data = await allAsync(
            `SELECT * FROM "${tableName}" LIMIT ? OFFSET ?`,
            [parseInt(limit), parseInt(offset)]
        );
        
        res.json({ 
            success: true, 
            data: {
                columns: schema,
                rows: data,
                totalCount,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('Error fetching table data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all tables with their data (for initial load)
router.get('/all', async (req, res) => {
    try {
        const [tables] = await database.query(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `);
        
        const tablesData = [];
        
        for (const table of tables) {
            try {
                // Validate table name
                if (!validateTableName(table.name)) {
                    continue;
                }
                
                // Get table schema - PRAGMA table_info returns array of column info
                // Use allAsync directly for PRAGMA statements (table name is validated)
                const schemaRows = await allAsync(`PRAGMA table_info("${table.name}")`);
                // Map SQLite schema to expected format
                const schema = Array.isArray(schemaRows) ? schemaRows.map(col => ({
                    name: col.name,
                    type: col.type || 'TEXT',
                    notnull: col.notnull === 1,
                    pk: col.pk === 1,
                    dflt_value: col.dflt_value
                })) : [];
                
                // Get total row count (table name is validated)
                const countRow = await getAsync(`SELECT COUNT(*) as count FROM "${table.name}"`);
                const totalCount = countRow ? countRow.count : 0;
                
                // Get first 100 rows for preview (table name is validated)
                const dataRows = await allAsync(`SELECT * FROM "${table.name}" LIMIT 100`);
                const data = Array.isArray(dataRows) ? dataRows : [];
                
                tablesData.push({
                    name: table.name,
                    columns: schema,
                    rowCount: totalCount,
                    previewData: data
                });
            } catch (err) {
                console.error(`Error fetching data for table ${table.name}:`, err);
                tablesData.push({
                    name: table.name,
                    columns: [],
                    rowCount: 0,
                    previewData: [],
                    error: err.message
                });
            }
        }
        
        res.json({ success: true, data: tablesData });
    } catch (error) {
        console.error('Error fetching all tables:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

