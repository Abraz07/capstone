import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get gamification profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    let result = await pool.query(
      'SELECT * FROM user_gamification WHERE user_id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      // Create if doesn't exist
      await pool.query(
        'INSERT INTO user_gamification (user_id) VALUES ($1)',
        [req.userId]
      );
      result = await pool.query(
        'SELECT * FROM user_gamification WHERE user_id = $1',
        [req.userId]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update gamification profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { level, points, total_points, streak, last_activity_date, unlocked_badges } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (level !== undefined) {
      updates.push(`level = $${paramCount++}`);
      values.push(level);
    }
    if (points !== undefined) {
      updates.push(`points = $${paramCount++}`);
      values.push(points);
    }
    if (total_points !== undefined) {
      updates.push(`total_points = $${paramCount++}`);
      values.push(total_points);
    }
    if (streak !== undefined) {
      updates.push(`streak = $${paramCount++}`);
      values.push(streak);
    }
    if (last_activity_date !== undefined) {
      updates.push(`last_activity_date = $${paramCount++}`);
      values.push(last_activity_date);
    }
    if (unlocked_badges !== undefined) {
      updates.push(`unlocked_badges = $${paramCount++}`);
      values.push(unlocked_badges);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(req.userId);
    const query = `UPDATE user_gamification SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Award points
router.post('/award-points', authenticate, async (req, res) => {
  try {
    const { points } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({ message: 'Invalid points value' });
    }

    const result = await pool.query(
      `UPDATE user_gamification
       SET points = points + $1,
           total_points = total_points + $1,
           level = FLOOR((total_points + $1) / 1000) + 1
       WHERE user_id = $2
       RETURNING *`,
      [points, req.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Award points error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

