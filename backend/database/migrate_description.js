// Migration script to add description column to products table
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'ems.db');
const db = new sqlite3.Database(dbPath);

// Check if column exists before adding
db.get("PRAGMA table_info(products)", (err, rows) => {
  if (err) {
    console.error('Error checking table info:', err);
    return;
  }

  // Check all columns
  db.all("PRAGMA table_info(products)", (err, columns) => {
    if (err) {
      console.error('Error getting columns:', err);
      db.close();
      return;
    }

    const hasDescriptionColumn = columns.some(col => col.name === 'description');

    if (hasDescriptionColumn) {
      console.log('✓ Description column already exists in products table');
      db.close();
    } else {
      console.log('Adding description column to products table...');
      db.run('ALTER TABLE products ADD COLUMN description TEXT', (err) => {
        if (err) {
          console.error('✗ Error adding description column:', err.message);
        } else {
          console.log('✓ Description column added successfully');
        }
        db.close();
      });
    }
  });
});

