const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { database } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { logProduct, logPurchase } = require('../utils/logger');

// Protect all routes with authentication
router.use(authenticateToken);

// Validation middleware
const validateProduct = [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('qty').isInt({ min: 1 }).withMessage('Quantity must be an integer greater than or equal to 1'),
    body('original_price').isFloat({ min: 0 }).withMessage('Original price must be a positive number'),
    body('sale_price').isFloat({ min: 0 }).withMessage('Sale price must be a positive number'),
    body('unit_id').isInt({ min: 1 }).withMessage('Valid unit is required')
];

// Get all products with unit information
router.get('/', async (req, res) => {
    try {
        const [products] = await database.query(`
            SELECT 
                p.id, 
                p.name, 
                p.description,
                p.qty, 
                p.original_price, 
                p.sale_price, 
                p.unit_id,
                u.value as unit_value,
                p.created_at,
                p.updated_at
            FROM products p
            LEFT JOIN units u ON p.unit_id = u.id
            ORDER BY p.created_at DESC
        `);
        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const [products] = await database.query(`
            SELECT 
                p.*, 
                u.name as unit_name,
                u.abbreviation as unit_abbreviation
            FROM products p
            LEFT JOIN units u ON p.unit_id = u.id
            WHERE p.id = ?
        `, [req.params.id]);
        
        if (products.length === 0) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        
        res.json({ success: true, data: products[0] });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new product
router.post('/', validateProduct, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const connection = await database.getConnection();
    try {
        await connection.beginTransaction();

        const { name, description, qty, original_price, sale_price, unit_id } = req.body;

        // Check if product name already exists
        const [existing] = await connection.query(
            'SELECT id FROM products WHERE name = ?',
            [name]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                error: 'A product with this name already exists' 
            });
        }

        // Insert product
        const [result] = await connection.query(
            'INSERT INTO products (name, description, qty, original_price, sale_price, unit_id) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description || null, qty, original_price, sale_price, unit_id]
        );

        const productId = result.insertId;

        // If qty > 0, record in purchase history
        if (qty > 0) {
            const [purchaseResult] = await connection.query(
                'INSERT INTO purchase_history (product_id, product_name, qty, price, total_amount, notes) VALUES (?, ?, ?, ?, ?, ?)',
                [productId, name, qty, original_price, qty * original_price, 'Initial stock']
            );

            // Log purchase history creation
            const purchaseData = {
                id: purchaseResult.insertId,
                product_id: productId,
                product_name: name,
                qty,
                price: original_price,
                total_amount: qty * original_price,
                notes: 'Initial stock'
            };
            await logPurchase(req.user, 'CREATE', purchaseResult.insertId, null, purchaseData, 'success', null, req.ip);
        }

        await connection.commit();

        // Fetch the created product with unit info
        const [newProduct] = await connection.query(`
            SELECT 
                p.*, 
                u.value as unit_value
            FROM products p
            LEFT JOIN units u ON p.unit_id = u.id
            WHERE p.id = ?
        `, [productId]);

        // Log the action
        await logProduct(req.user, 'CREATE', productId, null, newProduct[0], 'success', null, req.ip);

        res.status(201).json({ 
            success: true, 
            message: 'Product created successfully',
            data: newProduct[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating product:', error);
        await logProduct(req.user, 'CREATE', null, null, { name, description, qty, original_price, sale_price, unit_id }, 'failed', error.message, req.ip);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
});

// Update product (qty cannot be updated here)
router.put('/:id', async (req, res) => {
    const connection = await database.getConnection();
    try {
        await connection.beginTransaction();

        const { name, description, original_price, sale_price, unit_id } = req.body;
        const productId = req.params.id;

        // Check if product exists and get old data
        const [existing] = await connection.query(
            'SELECT * FROM products WHERE id = ?',
            [productId]
        );

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const oldData = existing[0];

        // Check if new name conflicts with another product
        if (name && name !== existing[0].name) {
            const [nameCheck] = await connection.query(
                'SELECT id FROM products WHERE name = ? AND id != ?',
                [name, productId]
            );

            if (nameCheck.length > 0) {
                await connection.rollback();
                return res.status(400).json({ 
                    success: false, 
                    error: 'A product with this name already exists' 
                });
            }
        }

        // Update product (excluding qty)
        await connection.query(
            'UPDATE products SET name = ?, description = ?, original_price = ?, sale_price = ?, unit_id = ? WHERE id = ?',
            [name, description || null, original_price, sale_price, unit_id, productId]
        );

        await connection.commit();

        // Fetch updated product
        const [updated] = await connection.query(`
            SELECT 
                p.*, 
                u.value as unit_value
            FROM products p
            LEFT JOIN units u ON p.unit_id = u.id
            WHERE p.id = ?
        `, [productId]);

        // Log the action
        await logProduct(req.user, 'UPDATE', productId, oldData, updated[0], 'success', null, req.ip);

        res.json({ 
            success: true, 
            message: 'Product updated successfully',
            data: updated[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating product:', error);
        await logProduct(req.user, 'UPDATE', productId, null, { name, description, original_price, sale_price, unit_id }, 'failed', error.message, req.ip);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
});

// Add quantity to product
router.post('/:id/add-quantity', async (req, res) => {
    const connection = await database.getConnection();
    try {
        await connection.beginTransaction();

        const { qty, notes } = req.body;
        const productId = req.params.id;

        if (!qty || qty < 1 || !Number.isInteger(parseFloat(qty))) {
            return res.status(400).json({ success: false, error: 'Quantity must be an integer greater than or equal to 1' });
        }

        // Get product info
        const [products] = await connection.query(
            'SELECT id, name, qty, original_price FROM products WHERE id = ?',
            [productId]
        );

        if (products.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const product = products[0];
        const newQty = parseFloat(product.qty) + parseFloat(qty);
        
        // Use default description if empty
        const isInitialStock = !product.qty || parseFloat(product.qty) === 0;
        const defaultDescription = isInitialStock ? 'Initial stock' : 'Stock addition';
        const description = notes || defaultDescription;

        // Update product quantity
        await connection.query(
            'UPDATE products SET qty = ? WHERE id = ?',
            [newQty, productId]
        );

        // Record in purchase history (price will be 0 since we're not tracking it)
        const [purchaseResult] = await connection.query(
            'INSERT INTO purchase_history (product_id, product_name, qty, price, total_amount, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [productId, product.name, qty, 0, 0, description]
        );

        // Log purchase history creation
        const purchaseData = {
            id: purchaseResult.insertId,
            product_id: productId,
            product_name: product.name,
            qty: parseInt(qty),
            price: 0,
            total_amount: 0,
            notes: description
        };
        await logPurchase(req.user, 'CREATE', purchaseResult.insertId, null, purchaseData, 'success', null, req.ip);

        await connection.commit();

        res.json({ 
            success: true, 
            message: 'Quantity added successfully',
            data: { new_qty: newQty }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error adding quantity:', error);
        await logPurchase(req.user, 'CREATE', null, null, { product_id: productId, qty, notes }, 'failed', error.message, req.ip);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const productId = req.params.id;

        // Get product data before deletion
        const [existing] = await database.query('SELECT * FROM products WHERE id = ?', [productId]);
        
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const productData = existing[0];

        // Delete product
        const [result] = await database.query('DELETE FROM products WHERE id = ?', [productId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        // Log the action
        await logProduct(req.user, 'DELETE', productId, productData, null, 'success', null, req.ip);
        
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        await logProduct(req.user, 'DELETE', req.params.id, null, null, 'failed', error.message, req.ip);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

