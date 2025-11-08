import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Save session
router.post('/sessions', authenticate, async (req, res) => {
  try {
    const { session_type, duration } = req.body;

    console.log('⏱️ Save session request:', {
      userId: req.userId,
      session_type,
      duration
    });

    // Set completed_at to current timestamp
    const result = await pool.query(
      `INSERT INTO timer_sessions (user_id, session_type, duration, completed_at) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [req.userId, session_type, duration || 0]
    );

    console.log('✅ Timer session saved successfully:', {
      id: result.rows[0].id,
      session_type: result.rows[0].session_type,
      duration: result.rows[0].duration,
      completed_at: result.rows[0].completed_at
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Save session error:', error);
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

// Get session history
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const result = await pool.query(
      'SELECT * FROM timer_sessions WHERE user_id = $1 ORDER BY completed_at DESC LIMIT $2',
      [req.userId, limit]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get focus stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await pool.query(
      `SELECT 
        DATE(completed_at) as date,
        SUM(duration) / 60 as minutes
       FROM timer_sessions
       WHERE user_id = $1 AND session_type = 'work' AND completed_at >= $2
       GROUP BY DATE(completed_at)
       ORDER BY date`,
      [req.userId, startDate]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

