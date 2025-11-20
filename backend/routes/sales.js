const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { database } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { logSale } = require('../utils/logger');

// Protect all routes with authentication
router.use(authenticateToken);

// Validation middleware
const validateSale = [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.product_id').isInt({ min: 1 }).withMessage('Valid product ID is required'),
    body('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be an integer greater than or equal to 1'),
    body('total_amount').isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
    body('paid_amount').isFloat({ min: 0 }).withMessage('Paid amount must be a positive number')
];

// Get all sales with items
router.get('/', async (req, res) => {
    try {
        const { start_date, end_date, customer_id } = req.query;
        
        let query = `
            SELECT 
                s.id,
                s.customer_id,
                s.customer_name,
                s.total_amount,
                s.paid_amount,
                s.payment_status,
                s.sale_date,
                s.notes,
                COUNT(si.id) as item_count
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.sale_id
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
        
        if (customer_id) {
            conditions.push('s.customer_id = ?');
            params.push(customer_id);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' GROUP BY s.id ORDER BY s.sale_date DESC';
        
        const [sales] = await database.query(query, params);
        res.json({ success: true, data: sales });
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single sale with items
router.get('/:id', async (req, res) => {
    try {
        const [sales] = await database.query(
            'SELECT * FROM sales WHERE id = ?',
            [req.params.id]
        );
        
        if (sales.length === 0) {
            return res.status(404).json({ success: false, error: 'Sale not found' });
        }
        
        const [items] = await database.query(
            'SELECT * FROM sale_items WHERE sale_id = ?',
            [req.params.id]
        );
        
        res.json({ 
            success: true, 
            data: {
                ...sales[0],
                items
            }
        });
    } catch (error) {
        console.error('Error fetching sale:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new sale
router.post('/', validateSale, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const connection = await database.getConnection();
    try {
        await connection.beginTransaction();

        const { items, customer_id, customer_name, total_amount, paid_amount, notes } = req.body;

        // Check stock availability for all items
        const outOfStockItems = [];
        const productData = [];

        for (const item of items) {
            const [products] = await connection.query(
                'SELECT id, name, qty, sale_price FROM products WHERE id = ?',
                [item.product_id]
            );

            if (products.length === 0) {
                await connection.rollback();
                return res.status(404).json({ 
                    success: false, 
                    error: `Product with ID ${item.product_id} not found` 
                });
            }

            const product = products[0];
            
            if (parseFloat(product.qty) < parseFloat(item.qty)) {
                outOfStockItems.push({
                    product_id: product.id,
                    product_name: product.name,
                    available_qty: product.qty,
                    requested_qty: item.qty
                });
            }

            productData.push({
                ...product,
                requested_qty: item.qty
            });
        }

        // If any items are out of stock, return error with details
        if (outOfStockItems.length > 0) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                error: 'Some items are out of stock',
                out_of_stock: outOfStockItems
            });
        }

        // Determine payment status
        let paymentStatus = 'paid';
        if (paid_amount > total_amount) {
            paymentStatus = 'overpaid';
        } else if (paid_amount < total_amount) {
            paymentStatus = 'underpaid';
        }

        // Insert sale record
        const [saleResult] = await connection.query(
            `INSERT INTO sales 
            (customer_id, customer_name, total_amount, paid_amount, payment_status, notes) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [customer_id, customer_name || 'Normal Customer', total_amount, paid_amount, paymentStatus, notes]
        );

        const saleId = saleResult.insertId;

        // Insert sale items and update product quantities
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const product = productData[i];

            const subtotal = item.qty * product.sale_price;

            // Insert sale item
            await connection.query(
                `INSERT INTO sale_items 
                (sale_id, product_id, product_name, qty, unit_price, subtotal) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [saleId, product.id, product.name, item.qty, product.sale_price, subtotal]
            );

            // Update product quantity
            const newQty = parseFloat(product.qty) - parseFloat(item.qty);
            await connection.query(
                'UPDATE products SET qty = ? WHERE id = ?',
                [newQty, product.id]
            );
        }

        // Update customer balance if applicable
        if (customer_id) {
            // Get current customer balance
            const [customerData] = await connection.query(
                'SELECT overpaid_amount, underpaid_amount FROM customers WHERE id = ?',
                [customer_id]
            );
            
            if (customerData.length > 0) {
                let currentOverpaid = parseFloat(customerData[0].overpaid_amount) || 0;
                let currentUnderpaid = parseFloat(customerData[0].underpaid_amount) || 0;
                
                if (paymentStatus === 'overpaid') {
                    const overpaidAmount = paid_amount - total_amount;
                    // First, reduce any existing underpaid amount
                    if (currentUnderpaid > 0) {
                        const reduction = Math.min(currentUnderpaid, overpaidAmount);
                        currentUnderpaid -= reduction;
                        const remainingOverpaid = overpaidAmount - reduction;
                        currentOverpaid += remainingOverpaid;
                    } else {
                        currentOverpaid += overpaidAmount;
                    }
                } else if (paymentStatus === 'underpaid') {
                    const underpaidAmount = total_amount - paid_amount;
                    // First, reduce any existing overpaid amount
                    if (currentOverpaid > 0) {
                        const reduction = Math.min(currentOverpaid, underpaidAmount);
                        currentOverpaid -= reduction;
                        const remainingUnderpaid = underpaidAmount - reduction;
                        currentUnderpaid += remainingUnderpaid;
                    } else {
                        currentUnderpaid += underpaidAmount;
                    }
                }
                
                // Update customer with calculated balance
                await connection.query(
                    'UPDATE customers SET overpaid_amount = ?, underpaid_amount = ? WHERE id = ?',
                    [Math.max(0, currentOverpaid), Math.max(0, currentUnderpaid), customer_id]
                );
            }
        }

        await connection.commit();

        // Fetch the complete sale with items
        const [newSale] = await connection.query('SELECT * FROM sales WHERE id = ?', [saleId]);
        const [saleItems] = await connection.query('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);

        const saleData = {
            ...newSale[0],
            items: saleItems
        };

        // Log the action
        await logSale(req.user, 'CREATE', saleId, null, saleData, 'success', null, req.ip);

        res.status(201).json({ 
            success: true, 
            message: 'Sale created successfully',
            data: saleData
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating sale:', error);
        await logSale(req.user, 'CREATE', null, null, { customer_name, total_amount, items }, 'failed', error.message, req.ip);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
});

// Delete sale (with stock restoration)
router.delete('/:id', async (req, res) => {
    const connection = await database.getConnection();
    try {
        await connection.beginTransaction();

        const saleId = req.params.id;

        // Get sale info
        const [sales] = await connection.query('SELECT * FROM sales WHERE id = ?', [saleId]);
        
        if (sales.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: 'Sale not found' });
        }

        const sale = sales[0];

        // Get sale items to restore stock
        const [items] = await connection.query('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);

        // Store sale data for logging
        const saleDataForLog = {
            ...sale,
            items
        };

        // Restore product quantities
        for (const item of items) {
            await connection.query(
                'UPDATE products SET qty = qty + ? WHERE id = ?',
                [item.qty, item.product_id]
            );
        }

        // Restore customer balance if applicable (reverse the calculation)
        if (sale.customer_id) {
            // Get current customer balance
            const [customerData] = await connection.query(
                'SELECT overpaid_amount, underpaid_amount FROM customers WHERE id = ?',
                [sale.customer_id]
            );
            
            if (customerData.length > 0) {
                let currentOverpaid = parseFloat(customerData[0].overpaid_amount) || 0;
                let currentUnderpaid = parseFloat(customerData[0].underpaid_amount) || 0;
                
                if (sale.payment_status === 'overpaid') {
                    const overpaidAmount = sale.paid_amount - sale.total_amount;
                    // Reverse: subtract overpaid amount first, if not enough, add to underpaid
                    if (currentOverpaid >= overpaidAmount) {
                        currentOverpaid -= overpaidAmount;
                    } else {
                        const remaining = overpaidAmount - currentOverpaid;
                        currentOverpaid = 0;
                        currentUnderpaid += remaining;
                    }
                } else if (sale.payment_status === 'underpaid') {
                    const underpaidAmount = sale.total_amount - sale.paid_amount;
                    // Reverse: subtract underpaid amount first, if not enough, add to overpaid
                    if (currentUnderpaid >= underpaidAmount) {
                        currentUnderpaid -= underpaidAmount;
                    } else {
                        const remaining = underpaidAmount - currentUnderpaid;
                        currentUnderpaid = 0;
                        currentOverpaid += remaining;
                    }
                }
                
                // Update customer with calculated balance
                await connection.query(
                    'UPDATE customers SET overpaid_amount = ?, underpaid_amount = ? WHERE id = ?',
                    [Math.max(0, currentOverpaid), Math.max(0, currentUnderpaid), sale.customer_id]
                );
            }
        }

        // Delete sale (cascade will delete sale_items)
        await connection.query('DELETE FROM sales WHERE id = ?', [saleId]);

        await connection.commit();

        // Log the action
        await logSale(req.user, 'DELETE', saleId, saleDataForLog, null, 'success', null, req.ip);
        
        res.json({ success: true, message: 'Sale deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting sale:', error);
        await logSale(req.user, 'DELETE', req.params.id, null, null, 'failed', error.message, req.ip);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;

