import { getDatabase } from './database.js';

/**
 * Save a taskId to history
 * @param {string} taskId - Suno task ID
 * @param {string} title - Song title (optional)
 * @param {string} sceneName - Scene name (optional)
 * @returns {Object} Saved record
 */
export function saveTaskId(taskId, title = null, sceneName = null) {
  const db = getDatabase();
  const now = Date.now();

  try {
    const stmt = db.prepare(`
      INSERT INTO songs_history (task_id, title, scene_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(task_id) DO UPDATE SET
        title = COALESCE(excluded.title, title),
        scene_name = COALESCE(excluded.scene_name, scene_name),
        updated_at = excluded.updated_at
    `);

    const result = stmt.run(taskId, title, sceneName, now, now);
    
    console.log(`[SONG HISTORY] Saved taskId: ${taskId}`);
    return {
      id: result.lastInsertRowid,
      taskId,
      title,
      sceneName,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error(`[SONG HISTORY] Error saving taskId ${taskId}:`, error);
    throw error;
  }
}

/**
 * Get all taskIds from history
 * @param {number} limit - Maximum number of records to return
 * @param {number} offset - Number of records to skip
 * @returns {Array} Array of history records
 */
export function getAllTaskIds(limit = 100, offset = 0) {
  const db = getDatabase();

  try {
    const stmt = db.prepare(`
      SELECT id, task_id, title, scene_name, created_at, updated_at
      FROM songs_history
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    const records = stmt.all(limit, offset);
    return records.map(record => ({
      id: record.id,
      taskId: record.task_id,
      title: record.title,
      sceneName: record.scene_name,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));
  } catch (error) {
    console.error('[SONG HISTORY] Error getting all taskIds:', error);
    throw error;
  }
}

/**
 * Get a single taskId record by taskId
 * @param {string} taskId - Suno task ID
 * @returns {Object|null} History record or null if not found
 */
export function getTaskId(taskId) {
  const db = getDatabase();

  try {
    const stmt = db.prepare(`
      SELECT id, task_id, title, scene_name, created_at, updated_at
      FROM songs_history
      WHERE task_id = ?
    `);

    const record = stmt.get(taskId);
    if (!record) return null;

    return {
      id: record.id,
      taskId: record.task_id,
      title: record.title,
      sceneName: record.scene_name,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  } catch (error) {
    console.error(`[SONG HISTORY] Error getting taskId ${taskId}:`, error);
    throw error;
  }
}

/**
 * Delete a taskId from history
 * @param {string} taskId - Suno task ID
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteTaskId(taskId) {
  const db = getDatabase();

  try {
    const stmt = db.prepare('DELETE FROM songs_history WHERE task_id = ?');
    const result = stmt.run(taskId);
    
    console.log(`[SONG HISTORY] Deleted taskId: ${taskId}`);
    return result.changes > 0;
  } catch (error) {
    console.error(`[SONG HISTORY] Error deleting taskId ${taskId}:`, error);
    throw error;
  }
}

/**
 * Search taskIds by title or scene name
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of records to return
 * @returns {Array} Array of matching history records
 */
export function searchTaskIds(query, limit = 50) {
  const db = getDatabase();

  try {
    const searchPattern = `%${query}%`;
    const stmt = db.prepare(`
      SELECT id, task_id, title, scene_name, created_at, updated_at
      FROM songs_history
      WHERE title LIKE ? OR scene_name LIKE ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const records = stmt.all(searchPattern, searchPattern, limit);
    return records.map(record => ({
      id: record.id,
      taskId: record.task_id,
      title: record.title,
      sceneName: record.scene_name,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));
  } catch (error) {
    console.error(`[SONG HISTORY] Error searching taskIds:`, error);
    throw error;
  }
}

/**
 * Get count of all taskIds
 * @returns {number} Total count
 */
export function getTaskIdCount() {
  const db = getDatabase();

  try {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM songs_history');
    const result = stmt.get();
    return result.count;
  } catch (error) {
    console.error('[SONG HISTORY] Error getting count:', error);
    throw error;
  }
}
