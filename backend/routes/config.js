const express = require('express');
const router = express.Router();
const { database } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// Get configuration (public - anyone authenticated can read)
router.get('/:configKey', authenticateToken, async (req, res) => {
    try {
        const { configKey } = req.params;
        
        const [configs] = await database.query(
            'SELECT config_value, config_type FROM system_config WHERE config_key = ?',
            [configKey]
        );

        if (configs.length === 0) {
            return res.json({ success: true, data: null });
        }

        const config = configs[0];
        let value = config.config_value;

        // Parse JSON if config_type is json
        if (config.config_type === 'json') {
            try {
                value = JSON.parse(value);
            } catch (e) {
                console.error('Error parsing config JSON:', e);
            }
        }

        res.json({ success: true, data: value });
    } catch (error) {
        console.error('Error fetching config:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Save text configuration (requires textConfig permission)
router.post('/text_config', authenticateToken, requirePermission('settings.textConfig'), async (req, res) => {
    try {
        const { config } = req.body;
        const configKey = 'text_config';

        console.log('Saving text config for user:', req.user.username);
        console.log('Config keys:', Object.keys(config));

        if (!config) {
            return res.status(400).json({ success: false, error: 'Configuration data is required' });
        }

        // Get old config for logging
        const [oldConfigs] = await database.query(
            'SELECT config_value FROM system_config WHERE config_key = ?',
            [configKey]
        );

        const oldData = oldConfigs.length > 0 ? JSON.parse(oldConfigs[0].config_value) : null;
        const configValue = JSON.stringify(config);

        // Upsert configuration
        if (oldConfigs.length > 0) {
            console.log('Updating existing config...');
            await database.query(
                'UPDATE system_config SET config_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = ?',
                [configValue, req.user.id, configKey]
            );
        } else {
            console.log('Creating new config...');
            await database.query(
                'INSERT INTO system_config (config_key, config_value, config_type, updated_by) VALUES (?, ?, ?, ?)',
                [configKey, configValue, 'json', req.user.id]
            );
        }

        // Verify save
        const [savedConfigs] = await database.query(
            'SELECT config_value FROM system_config WHERE config_key = ?',
            [configKey]
        );
        console.log('✓ Config saved successfully, verified in database');

        // Log the action
        await logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: oldConfigs.length > 0 ? 'UPDATE' : 'CREATE',
            tableName: 'system_config',
            recordId: null,
            oldData: { config_key: configKey, value: oldData },
            newData: { config_key: configKey, value: config },
            status: 'success',
            errorMessage: null,
            ipAddress: req.ip
        });

        res.json({ 
            success: true, 
            message: 'Text configuration saved successfully',
            saved: true
        });
    } catch (error) {
        console.error('Error saving text config:', error);
        await logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: 'UPDATE',
            tableName: 'system_config',
            recordId: null,
            oldData: null,
            newData: { config_key: 'text_config' },
            status: 'failed',
            errorMessage: error.message,
            ipAddress: req.ip
        });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Save appearance configuration (requires appearance permission)
router.post('/appearance_config', authenticateToken, requirePermission('settings.appearance'), async (req, res) => {
    try {
        const { config } = req.body;
        const configKey = 'appearance_config';

        if (!config) {
            return res.status(400).json({ success: false, error: 'Configuration data is required' });
        }

        // Get old config for logging
        const [oldConfigs] = await database.query(
            'SELECT config_value FROM system_config WHERE config_key = ?',
            [configKey]
        );

        const oldData = oldConfigs.length > 0 ? JSON.parse(oldConfigs[0].config_value) : null;
        const configValue = JSON.stringify(config);

        // Upsert configuration
        if (oldConfigs.length > 0) {
            await database.query(
                'UPDATE system_config SET config_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = ?',
                [configValue, req.user.id, configKey]
            );
        } else {
            await database.query(
                'INSERT INTO system_config (config_key, config_value, config_type, updated_by) VALUES (?, ?, ?, ?)',
                [configKey, configValue, 'json', req.user.id]
            );
        }

        // Log the action
        await logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: oldConfigs.length > 0 ? 'UPDATE' : 'CREATE',
            tableName: 'system_config',
            recordId: null,
            oldData: { config_key: configKey, value: oldData },
            newData: { config_key: configKey, value: config },
            status: 'success',
            errorMessage: null,
            ipAddress: req.ip
        });

        res.json({ success: true, message: 'Appearance configuration saved successfully' });
    } catch (error) {
        console.error('Error saving appearance config:', error);
        await logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: 'UPDATE',
            tableName: 'system_config',
            recordId: null,
            oldData: null,
            newData: { config_key: 'appearance_config' },
            status: 'failed',
            errorMessage: error.message,
            ipAddress: req.ip
        });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Reset configuration (requires appropriate permission)
router.delete('/:configKey', authenticateToken, async (req, res) => {
    try {
        const { configKey } = req.params;

        // Check permissions based on config key
        if (configKey === 'text_config' && !req.user.permissions.includes('settings.textConfig')) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        if (configKey === 'appearance_config' && !req.user.permissions.includes('settings.appearance')) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        // Get old config for logging
        const [oldConfigs] = await database.query(
            'SELECT config_value FROM system_config WHERE config_key = ?',
            [configKey]
        );

        const oldData = oldConfigs.length > 0 ? JSON.parse(oldConfigs[0].config_value) : null;

        // Delete configuration
        await database.query('DELETE FROM system_config WHERE config_key = ?', [configKey]);

        // Log the action
        await logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: 'DELETE',
            tableName: 'system_config',
            recordId: null,
            oldData: { config_key: configKey, value: oldData },
            newData: null,
            status: 'success',
            errorMessage: null,
            ipAddress: req.ip
        });

        res.json({ success: true, message: 'Configuration reset successfully' });
    } catch (error) {
        console.error('Error resetting config:', error);
        await logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: 'DELETE',
            tableName: 'system_config',
            recordId: null,
            oldData: { config_key: req.params.configKey },
            newData: null,
            status: 'failed',
            errorMessage: error.message,
            ipAddress: req.ip
        });
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

