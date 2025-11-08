import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all tasks
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY task_order, created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, tag, priority, due_date } = req.body;

    console.log('📝 Create task request:', {
      userId: req.userId,
      title,
      description,
      tag,
      priority,
      due_date
    });

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, tag, priority, due_date, task_order)
       VALUES ($1, $2, $3, $4, $5, $6, (SELECT COALESCE(MAX(task_order), 0) + 1 FROM tasks WHERE user_id = $1))
       RETURNING *`,
      [req.userId, title, description || '', tag || 'general', priority || 'medium', due_date || null]
    );

    console.log('✅ Task created successfully:', {
      id: result.rows[0].id,
      title: result.rows[0].title,
      userId: result.rows[0].user_id
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Create task error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update task
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tag, priority, status, due_date } = req.body;

    console.log('🔄 Update task request:', {
      taskId: id,
      userId: req.userId,
      status,
      title
    });

    const result = await pool.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           tag = COALESCE($3, tag),
           priority = COALESCE($4, priority),
           status = COALESCE($5, status),
           due_date = COALESCE($6, due_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [title, description, tag, priority, status, due_date, id, req.userId]
    );

    if (result.rows.length === 0) {
      console.log('⚠️ Task not found for update:', { taskId: id, userId: req.userId });
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('✅ Task updated successfully:', {
      id: result.rows[0].id,
      status: result.rows[0].status,
      updated_at: result.rows[0].updated_at
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Update task error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete task
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reorder tasks
router.post('/reorder', authenticate, async (req, res) => {
  try {
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds)) {
      return res.status(400).json({ message: 'taskIds must be an array' });
    }

    // Update task order
    for (let i = 0; i < taskIds.length; i++) {
      await pool.query(
        'UPDATE tasks SET task_order = $1 WHERE id = $2 AND user_id = $3',
        [i, taskIds[i], req.userId]
      );
    }

    res.json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    console.error('Reorder tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

