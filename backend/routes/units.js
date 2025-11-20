const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { database } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { logUnit } = require('../utils/logger');

// Protect all routes with authentication
router.use(authenticateToken);

// Validation middleware
const validateUnit = [
    body('value').trim().notEmpty().withMessage('Unit value is required')
];

// Get all units
router.get('/', async (req, res) => {
    try {
        const [units] = await database.query('SELECT * FROM units ORDER BY value ASC');
        res.json({ success: true, data: units });
    } catch (error) {
        console.error('Error fetching units:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new unit
router.post('/', validateUnit, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { value } = req.body;

        // Check if unit already exists
        const [existing] = await database.query(
            'SELECT id FROM units WHERE value = ?',
            [value]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'A unit with this value already exists' 
            });
        }

        const [result] = await database.query(
            'INSERT INTO units (value) VALUES (?)',
            [value]
        );

        const [newUnit] = await database.query('SELECT * FROM units WHERE id = ?', [result.insertId]);

        // Log the action
        await logUnit(req.user, 'CREATE', result.insertId, null, newUnit[0], 'success', null, req.ip);

        res.status(201).json({ 
            success: true, 
            message: 'Unit created successfully',
            data: newUnit[0]
        });
    } catch (error) {
        console.error('Error creating unit:', error);
        await logUnit(req.user, 'CREATE', null, null, { value }, 'failed', error.message, req.ip);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update unit
router.put('/:id', validateUnit, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { value } = req.body;
        const unitId = req.params.id;

        // Check if unit exists and get old data
        const [existing] = await database.query('SELECT * FROM units WHERE id = ?', [unitId]);

        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Unit not found' });
        }

        const oldData = existing[0];

        // Check if new value conflicts
        if (value !== existing[0].value) {
            const [valueCheck] = await database.query(
                'SELECT id FROM units WHERE value = ? AND id != ?',
                [value, unitId]
            );

            if (valueCheck.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'A unit with this value already exists' 
                });
            }
        }

        await database.query(
            'UPDATE units SET value = ? WHERE id = ?',
            [value, unitId]
        );

        const [updated] = await database.query('SELECT * FROM units WHERE id = ?', [unitId]);

        // Log the action
        await logUnit(req.user, 'UPDATE', unitId, oldData, updated[0], 'success', null, req.ip);

        res.json({ 
            success: true, 
            message: 'Unit updated successfully',
            data: updated[0]
        });
    } catch (error) {
        console.error('Error updating unit:', error);
        await logUnit(req.user, 'UPDATE', unitId, null, { value }, 'failed', error.message, req.ip);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete unit
router.delete('/:id', async (req, res) => {
    try {
        const unitId = req.params.id;

        // Get unit data before deletion
        const [unitData] = await database.query('SELECT * FROM units WHERE id = ?', [unitId]);
        
        if (unitData.length === 0) {
            return res.status(404).json({ success: false, error: 'Unit not found' });
        }

        const unit = unitData[0];

        // Check if unit is being used by any product
        const [usage] = await database.query(
            'SELECT COUNT(*) as count FROM products WHERE unit_id = ?',
            [unitId]
        );

        if (usage[0].count > 0) {
            await logUnit(req.user, 'DELETE', unitId, unit, null, 'failed', 'Cannot delete unit that is being used by products', req.ip);
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot delete unit that is being used by products' 
            });
        }

        const [result] = await database.query('DELETE FROM units WHERE id = ?', [unitId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Unit not found' });
        }

        // Log the action
        await logUnit(req.user, 'DELETE', unitId, unit, null, 'success', null, req.ip);
        
        res.json({ success: true, message: 'Unit deleted successfully' });
    } catch (error) {
        console.error('Error deleting unit:', error);
        await logUnit(req.user, 'DELETE', req.params.id, null, null, 'failed', error.message, req.ip);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

