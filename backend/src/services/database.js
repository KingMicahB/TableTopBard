import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const DB_PATH = path.join(__dirname, '../../data/songs.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
let db = null;

/**
 * Get database instance (singleton)
 * @returns {Database} Database instance
 */
export function getDatabase() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL'); // Enable WAL mode for better concurrency
    initializeSchema(db);
  }
  return db;
}

/**
 * Initialize database schema
 * @param {Database} database - Database instance
 */
function initializeSchema(database) {
  // Create songs_history table
  database.exec(`
    CREATE TABLE IF NOT EXISTS songs_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT UNIQUE NOT NULL,
      title TEXT,
      scene_name TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_task_id ON songs_history(task_id);
    CREATE INDEX IF NOT EXISTS idx_created_at ON songs_history(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_scene_name ON songs_history(scene_name);
  `);

  console.log('[DATABASE] Schema initialized successfully');
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('[DATABASE] Connection closed');
  }
}
