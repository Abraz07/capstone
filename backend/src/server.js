import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import pool from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import timerRoutes from './routes/timer.js';
import moodRoutes from './routes/mood.js';
import analyticsRoutes from './routes/analytics.js';
import gamificationRoutes from './routes/gamification.js';
import mlRoutes from './routes/ml.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    const dbStatus = 'connected';
    
    // Check ML service connection
    let mlStatus = 'unknown';
    try {
      const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8001';
      const mlResponse = await axios.get(`${mlUrl}/health`, { timeout: 2000 });
      mlStatus = mlResponse.status === 200 ? 'connected' : 'disconnected';
    } catch (error) {
      mlStatus = 'disconnected';
    }
    
    res.json({ 
      status: 'ok', 
      message: 'Server is running',
      database: dbStatus,
      ml_service: mlStatus
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/timer', timerRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/ml', mlRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

