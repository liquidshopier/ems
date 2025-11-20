-- Migration script to add description column to products table
-- Run this if you have an existing database without the description column

-- Check if description column exists and add it if it doesn't
ALTER TABLE products ADD COLUMN description TEXT;

