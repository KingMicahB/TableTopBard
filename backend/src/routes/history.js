import express from 'express';
import {
  getAllTaskIds,
  getTaskId,
  deleteTaskId,
  searchTaskIds,
  getTaskIdCount,
} from '../services/songHistory.js';
import { pollMusicStatus } from '../services/suno.js';

const router = express.Router();

/**
 * GET /api/history
 * Get all taskIds from history with pagination
 * Query params: limit, offset
 */
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const taskIds = getAllTaskIds(limit, offset);
    const total = getTaskIdCount();

    res.json({
      success: true,
      data: taskIds,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({
      error: 'Failed to get history',
      message: error.message,
    });
  }
});

/**
 * GET /api/history/search
 * Search taskIds by title or scene name
 * Query params: q (search query), limit
 */
router.get('/search', (req, res) => {
  try {
    const query = req.query.q;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const results = searchTaskIds(query, limit);

    res.json({
      success: true,
      data: results,
      query,
    });
  } catch (error) {
    console.error('Error searching history:', error);
    res.status(500).json({
      error: 'Failed to search history',
      message: error.message,
    });
  }
});

/**
 * GET /api/history/:taskId
 * Get a single taskId record
 */
router.get('/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const record = getTaskId(taskId);

    if (!record) {
      return res.status(404).json({
        error: 'Task ID not found in history',
      });
    }

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('Error getting taskId:', error);
    res.status(500).json({
      error: 'Failed to get taskId',
      message: error.message,
    });
  }
});

/**
 * POST /api/history/:taskId/fetch
 * Fetch songs from Suno API using a taskId
 */
router.post('/:taskId/fetch', async (req, res) => {
  try {
    const { taskId } = req.params;

    // Verify taskId exists in history
    const record = getTaskId(taskId);
    if (!record) {
      return res.status(404).json({
        error: 'Task ID not found in history',
      });
    }

    // Fetch songs from Suno API
    const result = await pollMusicStatus(taskId, 1, 15000);

    res.json({
      success: true,
      taskId,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching songs for taskId:', error);
    res.status(500).json({
      error: 'Failed to fetch songs from Suno API',
      message: error.message,
    });
  }
});

/**
 * POST /api/history/fetch-multiple
 * Fetch songs from Suno API for multiple taskIds
 * Body: { taskIds: string[] }
 */
router.post('/fetch-multiple', express.json(), async (req, res) => {
  try {
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        error: 'taskIds array is required',
      });
    }

    // Limit to 10 taskIds at a time to avoid overwhelming the API
    const limitedTaskIds = taskIds.slice(0, 10);
    const results = [];

    for (const taskId of limitedTaskIds) {
      try {
        const result = await pollMusicStatus(taskId, 1, 15000);
        results.push({
          taskId,
          success: true,
          ...result,
        });
      } catch (error) {
        results.push({
          taskId,
          success: false,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error fetching multiple songs:', error);
    res.status(500).json({
      error: 'Failed to fetch songs',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/history/:taskId
 * Delete a taskId from history
 */
router.delete('/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const deleted = deleteTaskId(taskId);

    if (!deleted) {
      return res.status(404).json({
        error: 'Task ID not found in history',
      });
    }

    res.json({
      success: true,
      message: 'Task ID deleted from history',
    });
  } catch (error) {
    console.error('Error deleting taskId:', error);
    res.status(500).json({
      error: 'Failed to delete taskId',
      message: error.message,
    });
  }
});

export default router;
