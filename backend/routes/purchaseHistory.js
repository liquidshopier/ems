const express = require('express');
const router = express.Router();
const { database } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { logPurchase } = require('../utils/logger');

// Protect all routes with authentication
router.use(authenticateToken);

// Get all purchase history
router.get('/', async (req, res) => {
    try {
        const { product_id, start_date, end_date } = req.query;
        
        let query = `
            SELECT 
                ph.*,
                p.name as current_product_name,
                u.value as unit_value
            FROM purchase_history ph
            LEFT JOIN products p ON ph.product_id = p.id
            LEFT JOIN units u ON p.unit_id = u.id
        `;
        
        const conditions = [];
        const params = [];
        
        if (product_id) {
            conditions.push('ph.product_id = ?');
            params.push(product_id);
        }
        
        if (start_date) {
            conditions.push('ph.purchase_date >= ?');
            params.push(start_date);
        }
        
        if (end_date) {
            conditions.push('ph.purchase_date <= ?');
            params.push(end_date);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY ph.purchase_date DESC';
        
        const [history] = await database.query(query, params);
        res.json({ success: true, data: history });
    } catch (error) {
        console.error('Error fetching purchase history:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get purchase history for a specific product
router.get('/product/:productId', async (req, res) => {
    try {
        const [history] = await database.query(`
            SELECT 
                ph.*,
                p.name as current_product_name,
                u.value as unit_value
            FROM purchase_history ph
            LEFT JOIN products p ON ph.product_id = p.id
            LEFT JOIN units u ON p.unit_id = u.id
            WHERE ph.product_id = ?
            ORDER BY ph.purchase_date DESC
        `, [req.params.productId]);
        
        res.json({ success: true, data: history });
    } catch (error) {
        console.error('Error fetching purchase history:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

