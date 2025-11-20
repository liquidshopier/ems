const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'Access denied. No token provided.' 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            error: 'Invalid or expired token.' 
        });
    }
};

// Middleware to check if user has specific permission
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user.permissions || !Array.isArray(req.user.permissions)) {
            return res.status(403).json({ 
                success: false, 
                error: 'Access denied. No permissions found.' 
            });
        }

        if (!req.user.permissions.includes(permission)) {
            return res.status(403).json({ 
                success: false, 
                error: `Access denied. ${permission} permission required.` 
            });
        }

        next();
    };
};

// Middleware to check if user is admin (has all permissions)
const requireAdmin = (req, res, next) => {
    const adminPermissions = [
        'dashboard', 'products', 'sales', 'customers',
        'settings.units', 'settings.users', 'settings.textConfig', 'settings.appearance'
    ];

    if (!req.user.permissions || !Array.isArray(req.user.permissions)) {
        return res.status(403).json({ 
            success: false, 
            error: 'Access denied. Admin privileges required.' 
        });
    }

    const hasAllPermissions = adminPermissions.every(perm => 
        req.user.permissions.includes(perm)
    );

    if (!hasAllPermissions) {
        return res.status(403).json({ 
            success: false, 
            error: 'Access denied. Admin privileges required.' 
        });
    }

    next();
};

// Middleware to check if user has dashboard permission (manager or admin)
const requireManagerOrAdmin = (req, res, next) => {
    if (!req.user.permissions || !Array.isArray(req.user.permissions)) {
        return res.status(403).json({ 
            success: false, 
            error: 'Access denied. Manager or Admin privileges required.' 
        });
    }

    if (!req.user.permissions.includes('dashboard')) {
        return res.status(403).json({ 
            success: false, 
            error: 'Access denied. Manager or Admin privileges required.' 
        });
    }

    next();
};

module.exports = { authenticateToken, requireAdmin, requireManagerOrAdmin, requirePermission, JWT_SECRET };

