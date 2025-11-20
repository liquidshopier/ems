const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { database } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { logUser } = require('../utils/logger');

// All routes require authentication and user management permission
router.use(authenticateToken);
router.use(requirePermission('settings.users'));

// Validation middleware
const validateUser = [
    body('username').trim().notEmpty().withMessage('Username is required')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('permissions').isArray().withMessage('Permissions must be an array'),
    body('password').optional().isLength({ min: 3 }).withMessage('Password must be at least 3 characters')
];

// Get all users
router.get('/', async (req, res) => {
    try {
        const [users] = await database.query(`
            SELECT 
                id, username, full_name, permissions, is_active, 
                created_at, updated_at, last_login
            FROM users 
            ORDER BY created_at DESC
        `);
        // Parse permissions for each user
        let usersWithPermissions = users.map(user => ({
            ...user,
            permissions: JSON.parse(user.permissions || '[]')
        }));
        
        // Hide dev user unless logged in as dev
        if (req.user.username !== 'dev') {
            usersWithPermissions = usersWithPermissions.filter(user => user.username !== 'dev');
        }
        
        res.json({ success: true, data: usersWithPermissions });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single user
router.get('/:id', async (req, res) => {
    try {
        const [users] = await database.query(
            `SELECT id, username, full_name, permissions, is_active, 
             created_at, updated_at, last_login
             FROM users WHERE id = ?`,
            [req.params.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        const user = users[0];
        user.permissions = JSON.parse(user.permissions || '[]');
        
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new user
router.post('/', validateUser, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { username, password, full_name, permissions } = req.body;

        // Check if username already exists
        const [existing] = await database.query(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username already exists' 
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password || '123', 10);

        // Convert permissions array to JSON string
        const permissionsJSON = JSON.stringify(permissions);

        // Insert user
        const [result] = await database.query(
            'INSERT INTO users (username, password_hash, full_name, permissions) VALUES (?, ?, ?, ?)',
            [username, password_hash, full_name, permissionsJSON]
        );

        // Fetch created user (without password hash)
        const [newUser] = await database.query(
            `SELECT id, username, full_name, permissions, is_active, created_at 
             FROM users WHERE id = ?`,
            [result.insertId]
        );

        const user = newUser[0];
        user.permissions = JSON.parse(user.permissions || '[]');

        // Log the action
        await logUser(req.user, 'CREATE', result.insertId, null, user, 'success', null, req.ip);

        res.status(201).json({ 
            success: true, 
            message: 'User created successfully',
            data: user
        });
    } catch (error) {
        console.error('Error creating user:', error);
        await logUser(req.user, 'CREATE', null, null, { username, full_name, permissions }, 'failed', error.message, req.ip);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const { username, full_name, permissions, is_active, password } = req.body;
        const userId = req.params.id;

        // Check if user exists
        const [existing] = await database.query(
            'SELECT id, username FROM users WHERE id = ?',
            [userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Protect admin user from being inactivated
        if (existing[0].username === 'admin' && typeof is_active !== 'undefined' && !is_active) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot inactivate the default admin user' 
            });
        }

        // Protect dev user from being inactivated
        if (existing[0].username === 'dev' && typeof is_active !== 'undefined' && !is_active) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot inactivate the developer user' 
            });
        }

        // Protect admin user - only admin can change admin's password
        if (existing[0].username === 'admin' && password && req.user.username !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                error: 'Only admin user can change admin password' 
            });
        }

        // Protect dev user - only dev can change dev's password or any data
        if (existing[0].username === 'dev' && req.user.username !== 'dev') {
            return res.status(403).json({ 
                success: false, 
                error: 'Developer account cannot be modified by other users' 
            });
        }

        // Check if new username conflicts
        if (username && username !== existing[0].username) {
            const [nameCheck] = await database.query(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [username, userId]
            );

            if (nameCheck.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Username already exists' 
                });
            }
        }

        // Build update query dynamically
        let updateFields = [];
        let updateValues = [];

        if (username) {
            updateFields.push('username = ?');
            updateValues.push(username);
        }
        if (full_name) {
            updateFields.push('full_name = ?');
            updateValues.push(full_name);
        }
        if (permissions && Array.isArray(permissions)) {
            updateFields.push('permissions = ?');
            updateValues.push(JSON.stringify(permissions));
        }
        if (typeof is_active !== 'undefined') {
            updateFields.push('is_active = ?');
            updateValues.push(is_active ? 1 : 0);
        }
        if (password && password.trim().length > 0) {
            // Validate password length
            if (password.trim().length < 6) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Password must be at least 6 characters long' 
                });
            }
            const password_hash = await bcrypt.hash(password.trim(), 10);
            updateFields.push('password_hash = ?');
            updateValues.push(password_hash);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'No fields to update' 
            });
        }

        updateValues.push(userId);

        // Get old data before update for logging
        const [oldUserData] = await database.query(
            `SELECT id, username, full_name, permissions, is_active FROM users WHERE id = ?`,
            [userId]
        );
        const oldDataToLog = oldUserData[0] ? { ...oldUserData[0] } : {};

        // Perform the update
        await database.query(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        // Fetch updated user
        const [updated] = await database.query(
            `SELECT id, username, full_name, permissions, is_active, 
             created_at, updated_at, last_login
             FROM users WHERE id = ?`,
            [userId]
        );

        if (updated.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found after update' 
            });
        }

        const user = updated[0];
        user.permissions = JSON.parse(user.permissions || '[]');

        // Log the action (don't fail if logging fails)
        try {
            delete oldDataToLog.password_hash; // Don't log password hash
            await logUser(req.user, 'UPDATE', userId, oldDataToLog, user, 'success', null, req.ip);
        } catch (logError) {
            console.error('Error logging user update:', logError);
            // Don't fail the request if logging fails
        }

        res.json({ 
            success: true, 
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Error updating user:', error);
        // Try to log the error, but don't fail if logging fails
        try {
            await logUser(req.user, 'UPDATE', req.params.id, null, req.body, 'failed', error.message, req.ip);
        } catch (logError) {
            console.error('Error logging failed update:', logError);
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Don't allow deleting yourself
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot delete your own account' 
            });
        }

        // Check if user is admin or dev
        const [existing] = await database.query(
            'SELECT username FROM users WHERE id = ?',
            [userId]
        );

        if (existing.length > 0 && existing[0].username === 'admin') {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot delete the default admin user' 
            });
        }

        if (existing.length > 0 && existing[0].username === 'dev') {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot delete the developer user' 
            });
        }

        // Get user data before deletion
        const [userData] = await database.query('SELECT username, full_name, permissions FROM users WHERE id = ?', [userId]);
        const userToDelete = userData.length > 0 ? userData[0] : null;

        const [result] = await database.query('DELETE FROM users WHERE id = ?', [userId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Log the action
        if (userToDelete) {
            userToDelete.permissions = JSON.parse(userToDelete.permissions || '[]');
            await logUser(req.user, 'DELETE', userId, userToDelete, null, 'success', null, req.ip);
        }

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        await logUser(req.user, 'DELETE', userId, null, null, 'failed', error.message, req.ip);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

