import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all mood logs
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM mood_logs WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get mood logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create mood log
router.post('/', authenticate, async (req, res) => {
  try {
    const { mood, note } = req.body;

    console.log('😊 Create mood log request:', {
      userId: req.userId,
      mood,
      note: note?.substring(0, 50)
    });

    if (!mood) {
      return res.status(400).json({ message: 'Mood is required' });
    }

    const result = await pool.query(
      'INSERT INTO mood_logs (user_id, mood, note) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, mood, note || '']
    );

    console.log('✅ Mood log created successfully:', {
      id: result.rows[0].id,
      mood: result.rows[0].mood,
      userId: result.rows[0].user_id,
      created_at: result.rows[0].created_at
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Create mood log error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update mood log
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { mood, note } = req.body;

    const result = await pool.query(
      'UPDATE mood_logs SET mood = COALESCE($1, mood), note = COALESCE($2, note) WHERE id = $3 AND user_id = $4 RETURNING *',
      [mood, note, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Mood log not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update mood log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete mood log
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM mood_logs WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Mood log not found' });
    }

    res.json({ message: 'Mood log deleted successfully' });
  } catch (error) {
    console.error('Delete mood log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

