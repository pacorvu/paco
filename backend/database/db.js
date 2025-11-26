import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'database.sqlite');

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Promisify database methods
// Custom promisify for db.run to preserve lastID and changes
const originalRun = db.run.bind(db);
db.run = function(sql, params) {
  return new Promise((resolve, reject) => {
    originalRun(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          lastID: this.lastID,
          changes: this.changes
        });
      }
    });
  });
};

db.get = promisify(db.get.bind(db));
db.all = promisify(db.all.bind(db));

// Initialize database tables
export const initDatabase = async () => {
  try {
    // Create users table
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'vc', 'guest')),
        reset_token TEXT,
        reset_token_expiry INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on email
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);

    // Create default admin user if it doesn't exist
    const adminExists = await db.get('SELECT id FROM users WHERE email = ?', ['admin@example.com']);
    if (!adminExists) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('admin123', 10);
      await db.run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin User', 'admin@example.com', hashedPassword, 'admin']
      );
      console.log('✅ Default admin user created (admin@example.com / admin123)');
    }

    // Create default VC if it doesn't exist
    const vcExists = await db.get('SELECT id FROM users WHERE email = ?', ['vc@example.com']);
    if (!vcExists) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('vc123', 10);
      await db.run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['VC', 'vc@example.com', hashedPassword, 'vc']
      );
      console.log('✅ Default VC created (vc@example.com / vc123)');
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Get all tables
export const getTables = async () => {
  try {
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    return tables.map(t => t.name);
  } catch (error) {
    console.error('Error getting tables:', error);
    throw error;
  }
};

// Get table schema
export const getTableSchema = async (tableName) => {
  try {
    const schema = await db.all(`PRAGMA table_info(${tableName})`);
    return schema;
  } catch (error) {
    console.error('Error getting table schema:', error);
    throw error;
  }
};

// Get all data from a table
export const getTableData = async (tableName, limit = 100, offset = 0) => {
  try {
    const data = await db.all(`SELECT * FROM ${tableName} LIMIT ? OFFSET ?`, [limit, offset]);
    const count = await db.get(`SELECT COUNT(*) as count FROM ${tableName}`);
    return { data, count: count.count };
  } catch (error) {
    console.error('Error getting table data:', error);
    throw error;
  }
};

// Execute custom query (read-only for safety)
export const executeQuery = async (query) => {
  try {
    // Only allow SELECT queries for safety
    const trimmedQuery = query.trim().toUpperCase();
    if (!trimmedQuery.startsWith('SELECT')) {
      throw new Error('Only SELECT queries are allowed');
    }
    const result = await db.all(query);
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

export default db;

