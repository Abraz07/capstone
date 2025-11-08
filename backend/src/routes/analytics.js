import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to get date in UTC for consistent date comparison
const getDateInUTC = (date) => {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};

// Get focus minutes per day
router.get('/focus-minutes', authenticate, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    // Include today by going back (days-1) and including today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    console.log(`📊 Focus minutes query for user ${req.userId}:`, {
      startDate: startDate.toISOString(),
      days: days
    });

    // Check what timer sessions exist (for debugging)
    const sessionCheck = await pool.query(
      `SELECT 
        id, 
        session_type, 
        duration, 
        completed_at,
        DATE(completed_at) as session_date_local,
        (completed_at AT TIME ZONE 'UTC')::date as session_date_utc
       FROM timer_sessions 
       WHERE user_id = $1 
       ORDER BY completed_at DESC 
       LIMIT 10`,
      [req.userId]
    );
    console.log(`⏱️ Recent sessions for user ${req.userId}:`, sessionCheck.rows.map(s => ({
      session_type: s.session_type,
      duration: s.duration,
      session_date_local: s.session_date_local,
      session_date_utc: s.session_date_utc,
      completed_at: s.completed_at
    })));

    // Use DATE_TRUNC for consistent date extraction regardless of timezone
    const result = await pool.query(
      `WITH date_series AS (
        SELECT generate_series($2::date, CURRENT_DATE, '1 day'::interval)::date as date
      ),
      session_data AS (
        SELECT 
          DATE(completed_at) as session_date,
          SUM(duration) / 60.0 as minutes
        FROM timer_sessions
        WHERE user_id = $1 
          AND session_type = 'work'
          AND completed_at IS NOT NULL
          AND completed_at >= $2
        GROUP BY DATE(completed_at)
      )
      SELECT 
        ds.date,
        COALESCE(sd.minutes, 0) as minutes
      FROM date_series ds
      LEFT JOIN session_data sd ON sd.session_date = ds.date
      ORDER BY ds.date ASC`,
      [req.userId, startDate]
    );

    const filledData = result.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      minutes: Math.round(parseFloat(row.minutes) || 0)
    }));

    console.log(`📊 Focus minutes result for user ${req.userId}:`, filledData);
    res.json(filledData);
  } catch (error) {
    console.error('Get focus minutes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get mood vs focus correlation
router.get('/mood-focus', authenticate, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    // Include today by going back (days-1)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    console.log(`📊 Mood-focus query for user ${req.userId}:`, {
      startDate: startDate.toISOString(),
      days: days
    });

    // Check what mood logs exist (for debugging)
    const moodCheck = await pool.query(
      `SELECT 
        id, 
        mood, 
        created_at,
        DATE(created_at) as mood_date_local
       FROM mood_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [req.userId]
    );
    console.log(`😊 Recent moods for user ${req.userId}:`, moodCheck.rows.map(m => ({
      mood: m.mood,
      mood_date_local: m.mood_date_local,
      created_at: m.created_at
    })));

    const result = await pool.query(
      `SELECT 
        ml.mood,
        COALESCE(AVG(ts.duration / 60.0), 0) as focus_minutes
       FROM mood_logs ml
       LEFT JOIN timer_sessions ts ON DATE(ml.created_at) = DATE(ts.completed_at) 
         AND ts.user_id = ml.user_id 
         AND ts.session_type = 'work'
       WHERE ml.user_id = $1 AND ml.created_at >= $2
       GROUP BY ml.mood
       ORDER BY ml.mood`,
      [req.userId, startDate]
    );

    const data = result.rows.map(row => ({
      mood: row.mood,
      focusMinutes: Math.round(parseFloat(row.focus_minutes) || 0)
    }));

    console.log(`📊 Mood-focus result for user ${req.userId}:`, data);
    res.json(data);
  } catch (error) {
    console.error('Get mood focus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get task throughput
router.get('/task-throughput', authenticate, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    // Include today by going back (days-1) and including today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    console.log(`📊 Task throughput query for user ${req.userId}:`, {
      startDate: startDate.toISOString(),
      days: days
    });

    // First, let's check what tasks actually exist (for debugging)
    const taskCheck = await pool.query(
      `SELECT 
        id, 
        title, 
        status, 
        created_at, 
        updated_at,
        DATE(created_at) as created_date_local,
        DATE(updated_at) as updated_date_local
      FROM tasks 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 10`,
      [req.userId]
    );
    console.log(`📋 Recent tasks for user ${req.userId}:`, taskCheck.rows.map(t => ({
      id: t.id,
      title: t.title.substring(0, 30),
      status: t.status,
      created_date_local: t.created_date_local,
      updated_date_local: t.updated_date_local,
      created_at: t.created_at,
      updated_at: t.updated_at
    })));

    // Use DATE() function directly - PostgreSQL will handle timezone conversion
    // based on the session timezone setting
    const result = await pool.query(
      `WITH date_series AS (
        SELECT generate_series($2::date, CURRENT_DATE, '1 day'::interval)::date as date
      ),
      created_tasks AS (
        SELECT DATE(created_at) as date, COUNT(*) as created
        FROM tasks
        WHERE user_id = $1 AND created_at >= $2
        GROUP BY DATE(created_at)
      ),
      completed_tasks AS (
        SELECT DATE(updated_at) as date, COUNT(*) as completed
        FROM tasks
        WHERE user_id = $1 AND status = 'completed' AND updated_at >= $2
        GROUP BY DATE(updated_at)
      )
      SELECT 
        ds.date,
        COALESCE(ct.created, 0) as created,
        COALESCE(cpt.completed, 0) as completed
      FROM date_series ds
      LEFT JOIN created_tasks ct ON ct.date = ds.date
      LEFT JOIN completed_tasks cpt ON cpt.date = ds.date
      ORDER BY ds.date ASC`,
      [req.userId, startDate]
    );

    const filledData = result.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      created: parseInt(row.created) || 0,
      completed: parseInt(row.completed) || 0
    }));

    console.log(`📊 Task throughput result for user ${req.userId}:`, filledData);
    res.json(filledData);
  } catch (error) {
    console.error('Get task throughput error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint to check data
router.get('/debug', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get all tasks
    const tasks = await pool.query(
      `SELECT id, title, status, created_at, updated_at, 
              DATE(created_at) as created_date,
              DATE(updated_at) as updated_date
       FROM tasks 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    // Get all mood logs
    const moods = await pool.query(
      `SELECT id, mood, created_at, DATE(created_at) as mood_date
       FROM mood_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    // Get all timer sessions
    const sessions = await pool.query(
      `SELECT id, session_type, duration, completed_at, 
              DATE(completed_at) as session_date
       FROM timer_sessions 
       WHERE user_id = $1 
       ORDER BY completed_at DESC`,
      [userId]
    );
    
    res.json({
      userId,
      tasks: tasks.rows,
      moods: moods.rows,
      sessions: sessions.rows,
      counts: {
        tasks: tasks.rows.length,
        completed_tasks: tasks.rows.filter(t => t.status === 'completed').length,
        moods: moods.rows.length,
        sessions: sessions.rows.length,
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
