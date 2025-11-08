import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, passwordHash, name]
    );

    const user = result.rows[0];

    // Create gamification record
    await pool.query(
      'INSERT INTO user_gamification (user_id) VALUES ($1)',
      [user.id]
    );

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (email) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(req.userId);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, name`;
    
    const result = await pool.query(query, values);
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password (placeholder)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    // In a real app, send password reset email
    res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

