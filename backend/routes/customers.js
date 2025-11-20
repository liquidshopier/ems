const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { database } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { logCustomer } = require('../utils/logger');

// Protect all routes with authentication
router.use(authenticateToken);

// Validation middleware
const validateCustomer = [
    body('name').trim().notEmpty().withMessage('Customer name is required'),
    body('phone').optional().trim()
];

// Get all customers
router.get('/', async (req, res) => {
    try {
        const [customers] = await database.query(`
            SELECT 
                id,
                name,
                phone,
                address,
                overpaid_amount,
                underpaid_amount,
                created_at,
                updated_at
            FROM customers 
            ORDER BY created_at DESC
        `);
        res.json({ success: true, data: customers });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single customer
router.get('/:id', async (req, res) => {
    try {
        const [customers] = await database.query(
            'SELECT * FROM customers WHERE id = ?',
            [req.params.id]
        );
        
        if (customers.length === 0) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }
        
        res.json({ success: true, data: customers[0] });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new customer
router.post('/', validateCustomer, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { name, phone, address } = req.body;

        // Check if customer already exists
        const [existing] = await database.query(
            'SELECT id FROM customers WHERE name = ?',
            [name]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'A customer with this name already exists' 
            });
        }

        const [result] = await database.query(
            'INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)',
            [name, phone, address]
        );

        const [newCustomer] = await database.query(
            'SELECT * FROM customers WHERE id = ?',
            [result.insertId]
        );

        // Log the action
        await logCustomer(req.user, 'CREATE', result.insertId, null, newCustomer[0], 'success', null, req.ip);

        res.status(201).json({ 
            success: true, 
            message: 'Customer created successfully',
            data: newCustomer[0]
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        await logCustomer(req.user, 'CREATE', null, null, { name, phone, address }, 'failed', error.message, req.ip);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update customer
router.put('/:id', validateCustomer, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { name, phone, address } = req.body;
        const customerId = req.params.id;

        // Check if customer exists and get old data
        const [existing] = await database.query(
            'SELECT * FROM customers WHERE id = ?',
            [customerId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        const oldData = existing[0];

        // Check if new name conflicts
        if (name !== existing[0].name) {
            const [nameCheck] = await database.query(
                'SELECT id FROM customers WHERE name = ? AND id != ?',
                [name, customerId]
            );

            if (nameCheck.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'A customer with this name already exists' 
                });
            }
        }

        await database.query(
            'UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?',
            [name, phone, address, customerId]
        );

        const [updated] = await database.query('SELECT * FROM customers WHERE id = ?', [customerId]);

        // Log the action
        await logCustomer(req.user, 'UPDATE', customerId, oldData, updated[0], 'success', null, req.ip);

        res.json({ 
            success: true, 
            message: 'Customer updated successfully',
            data: updated[0]
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        await logCustomer(req.user, 'UPDATE', customerId, null, { name, phone, address }, 'failed', error.message, req.ip);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete customer
router.delete('/:id', async (req, res) => {
    try {
        const customerId = req.params.id;

        // Get customer data before deletion
        const [existing] = await database.query('SELECT * FROM customers WHERE id = ?', [customerId]);
        
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        const customerData = existing[0];

        // Delete customer
        const [result] = await database.query('DELETE FROM customers WHERE id = ?', [customerId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        // Log the action
        await logCustomer(req.user, 'DELETE', customerId, customerData, null, 'success', null, req.ip);
        
        res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        await logCustomer(req.user, 'DELETE', req.params.id, null, null, 'failed', error.message, req.ip);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

