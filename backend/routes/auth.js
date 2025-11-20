const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { database } = require('../config/database');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// Validation middleware
const validateLogin = [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
];

// Login
router.post('/login', validateLogin, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { username, password } = req.body;

        // Find user
        const [users] = await database.query(
            'SELECT * FROM users WHERE username = ? AND is_active = 1',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid username or password' 
            });
        }

        const user = users[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid username or password' 
            });
        }

        // Update last login
        await database.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Parse permissions from JSON string
        const permissions = JSON.parse(user.permissions || '[]');

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                permissions: permissions,
                full_name: user.full_name
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            success: true, 
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    full_name: user.full_name,
                    permissions: permissions
                }
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify token
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        // Get fresh user data
        const [users] = await database.query(
            'SELECT id, username, full_name, permissions, is_active FROM users WHERE id = ? AND is_active = 1',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'User not found or inactive' 
            });
        }

        // Parse permissions
        const user = users[0];
        user.permissions = JSON.parse(user.permissions || '[]');

        res.json({ 
            success: true, 
            data: user
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Logout (client-side will remove token, but we can log it)
router.post('/logout', authenticateToken, (req, res) => {
    // In a more complex system, you might blacklist the token here
    res.json({ 
        success: true, 
        message: 'Logged out successfully' 
    });
});

module.exports = router;

