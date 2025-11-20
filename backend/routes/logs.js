const express = require('express');
const router = express.Router();
const { database } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// All routes require authentication and logs permission
router.use(authenticateToken);
router.use(requirePermission('logs'));

// Get all activity logs with filtering and pagination
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            username,
            table_name,
            action,
            status,
            start_date,
            end_date
        } = req.query;

        const offset = (page - 1) * limit;
        
        // Build query with filters
        let query = 'SELECT * FROM activity_logs WHERE 1=1';
        const params = [];

        if (username) {
            query += ' AND username LIKE ?';
            params.push(`%${username}%`);
        }

        if (table_name) {
            query += ' AND table_name = ?';
            params.push(table_name);
        }

        if (action) {
            query += ' AND action = ?';
            params.push(action);
        }

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        if (start_date) {
            query += ' AND created_at >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND created_at <= ?';
            params.push(end_date);
        }

        // Get total count
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countResult] = await database.query(countQuery, params);
        const total = countResult[0].total;

        // Get paginated results
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [logs] = await database.query(query, params);

        // Parse JSON data
        const parsedLogs = logs.map(log => ({
            ...log,
            old_data: log.old_data ? JSON.parse(log.old_data) : null,
            new_data: log.new_data ? JSON.parse(log.new_data) : null
        }));

        res.json({
            success: true,
            data: {
                logs: parsedLogs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get log statistics
router.get('/stats', async (req, res) => {
    try {
        // Total logs
        const [totalResult] = await database.query('SELECT COUNT(*) as total FROM activity_logs');
        const total = totalResult[0].total;

        // Logs by action
        const [actionStats] = await database.query(`
            SELECT action, COUNT(*) as count 
            FROM activity_logs 
            GROUP BY action 
            ORDER BY count DESC
        `);

        // Logs by table
        const [tableStats] = await database.query(`
            SELECT table_name, COUNT(*) as count 
            FROM activity_logs 
            GROUP BY table_name 
            ORDER BY count DESC
        `);

        // Logs by status
        const [statusStats] = await database.query(`
            SELECT status, COUNT(*) as count 
            FROM activity_logs 
            GROUP BY status
        `);

        // Top users (by activity)
        const [userStats] = await database.query(`
            SELECT username, COUNT(*) as count 
            FROM activity_logs 
            GROUP BY username 
            ORDER BY count DESC 
            LIMIT 10
        `);

        // Recent activity (last 24 hours)
        const [recentActivity] = await database.query(`
            SELECT COUNT(*) as count 
            FROM activity_logs 
            WHERE created_at >= datetime('now', '-1 day')
        `);

        res.json({
            success: true,
            data: {
                total,
                recent24h: recentActivity[0].count,
                byAction: actionStats,
                byTable: tableStats,
                byStatus: statusStats,
                topUsers: userStats
            }
        });
    } catch (error) {
        console.error('Error fetching log stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Clear all logs (only for dev user)
router.delete('/', async (req, res) => {
    try {
        // Only allow dev user to clear logs
        if (req.user.username !== 'dev') {
            return res.status(403).json({ 
                success: false, 
                error: 'Only developer user can clear log history' 
            });
        }

        // Delete all logs
        await database.query('DELETE FROM activity_logs');

        res.json({ 
            success: true, 
            message: 'Log history cleared successfully' 
        });
    } catch (error) {
        console.error('Error clearing logs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single log details
router.get('/:id', async (req, res) => {
    try {
        const [logs] = await database.query(
            'SELECT * FROM activity_logs WHERE id = ?',
            [req.params.id]
        );

        if (logs.length === 0) {
            return res.status(404).json({ success: false, error: 'Log not found' });
        }

        const log = logs[0];
        log.old_data = log.old_data ? JSON.parse(log.old_data) : null;
        log.new_data = log.new_data ? JSON.parse(log.new_data) : null;

        res.json({ success: true, data: log });
    } catch (error) {
        console.error('Error fetching log:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

