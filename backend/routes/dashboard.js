const express = require('express');
const router = express.Router();
const { database } = require('../config/database');
const { authenticateToken, requireManagerOrAdmin } = require('../middleware/auth');

// All routes require authentication and manager or admin role
router.use(authenticateToken);
router.use(requireManagerOrAdmin);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const { start_date, end_date, product_type } = req.query;
        
        // Total sales revenue
        let salesQuery = 'SELECT COALESCE(SUM(total_amount), 0) as total_revenue FROM sales';
        const salesConditions = [];
        const salesParams = [];
        
        if (start_date) {
            salesConditions.push('sale_date >= ?');
            salesParams.push(start_date);
        }
        
        if (end_date) {
            salesConditions.push('sale_date <= ?');
            salesParams.push(end_date);
        }
        
        if (salesConditions.length > 0) {
            salesQuery += ' WHERE ' + salesConditions.join(' AND ');
        }
        
        const [salesRevenue] = await database.query(salesQuery, salesParams);
        
        // Total purchase cost
        let purchaseQuery = 'SELECT COALESCE(SUM(total_amount), 0) as total_cost FROM purchase_history';
        const purchaseConditions = [];
        const purchaseParams = [];
        
        if (start_date) {
            purchaseConditions.push('purchase_date >= ?');
            purchaseParams.push(start_date);
        }
        
        if (end_date) {
            purchaseConditions.push('purchase_date <= ?');
            purchaseParams.push(end_date);
        }
        
        if (purchaseConditions.length > 0) {
            purchaseQuery += ' WHERE ' + purchaseConditions.join(' AND ');
        }
        
        const [purchaseCost] = await database.query(purchaseQuery, purchaseParams);
        
        // Total customers
        const [totalCustomers] = await database.query('SELECT COUNT(*) as count FROM customers');
        
        // Total products
        const [totalProducts] = await database.query('SELECT COUNT(*) as count FROM products');
        
        // Total overpaid amount
        const [totalOverpaid] = await database.query(
            'SELECT COALESCE(SUM(overpaid_amount), 0) as total FROM customers'
        );
        
        // Total underpaid amount
        const [totalUnderpaid] = await database.query(
            'SELECT COALESCE(SUM(underpaid_amount), 0) as total FROM customers'
        );
        
        // Profit calculation
        const revenue = parseFloat(salesRevenue[0].total_revenue);
        const cost = parseFloat(purchaseCost[0].total_cost);
        const profit = revenue - cost;
        
        res.json({ 
            success: true, 
            data: {
                total_revenue: revenue,
                total_cost: cost,
                profit: profit,
                total_customers: totalCustomers[0].count,
                total_products: totalProducts[0].count,
                total_overpaid: parseFloat(totalOverpaid[0].total),
                total_underpaid: parseFloat(totalUnderpaid[0].total),
                net_balance: parseFloat(totalOverpaid[0].total) - parseFloat(totalUnderpaid[0].total)
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get top selling products
router.get('/top-products', async (req, res) => {
    try {
        const { start_date, end_date, limit = 10 } = req.query;
        
        let query = `
            SELECT 
                si.product_id,
                si.product_name,
                SUM(si.qty) as total_qty_sold,
                SUM(si.subtotal) as total_revenue,
                COUNT(DISTINCT si.sale_id) as sale_count
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
        `;
        
        const conditions = [];
        const params = [];
        
        if (start_date) {
            conditions.push('s.sale_date >= ?');
            params.push(start_date);
        }
        
        if (end_date) {
            conditions.push('s.sale_date <= ?');
            params.push(end_date);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' GROUP BY si.product_id, si.product_name ORDER BY total_revenue DESC LIMIT ?';
        params.push(parseInt(limit));
        
        const [topProducts] = await database.query(query, params);
        res.json({ success: true, data: topProducts });
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get sales trend data
router.get('/sales-trend', async (req, res) => {
    try {
        const { start_date, end_date, group_by = 'day' } = req.query;
        
        let dateFormat;
        switch(group_by) {
            case 'month':
                dateFormat = '%Y-%m';
                break;
            case 'year':
                dateFormat = '%Y';
                break;
            default:
                dateFormat = '%Y-%m-%d';
        }
        
        let query = `
            SELECT 
                strftime('${dateFormat}', sale_date) as period,
                COUNT(*) as sale_count,
                SUM(total_amount) as total_revenue
            FROM sales
        `;
        
        const conditions = [];
        const params = [];
        
        if (start_date) {
            conditions.push('sale_date >= ?');
            params.push(start_date);
        }
        
        if (end_date) {
            conditions.push('sale_date <= ?');
            params.push(end_date);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' GROUP BY period ORDER BY period ASC';
        
        const [trend] = await database.query(query, params);
        res.json({ success: true, data: trend });
    } catch (error) {
        console.error('Error fetching sales trend:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get purchase trend data
router.get('/purchase-trend', async (req, res) => {
    try {
        const { start_date, end_date, group_by = 'day' } = req.query;
        
        let dateFormat;
        switch(group_by) {
            case 'month':
                dateFormat = '%Y-%m';
                break;
            case 'year':
                dateFormat = '%Y';
                break;
            default:
                dateFormat = '%Y-%m-%d';
        }
        
        let query = `
            SELECT 
                strftime('${dateFormat}', purchase_date) as period,
                COUNT(*) as purchase_count,
                SUM(total_amount) as total_cost
            FROM purchase_history
        `;
        
        const conditions = [];
        const params = [];
        
        if (start_date) {
            conditions.push('purchase_date >= ?');
            params.push(start_date);
        }
        
        if (end_date) {
            conditions.push('purchase_date <= ?');
            params.push(end_date);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' GROUP BY period ORDER BY period ASC';
        
        const [trend] = await database.query(query, params);
        res.json({ success: true, data: trend });
    } catch (error) {
        console.error('Error fetching purchase trend:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get low stock products
router.get('/low-stock', async (req, res) => {
    try {
        const { threshold = 10 } = req.query;
        
        const [products] = await database.query(`
            SELECT 
                p.id,
                p.name,
                p.qty,
                p.sale_price,
                u.value as unit_value
            FROM products p
            LEFT JOIN units u ON p.unit_id = u.id
            WHERE p.qty < ?
            ORDER BY p.qty ASC
        `, [threshold]);
        
        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

