import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Handle empty password string - convert to undefined if empty
const dbPassword = process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '' 
  ? process.env.DB_PASSWORD 
  : undefined;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'focuswave',
  user: process.env.DB_USER || 'postgres',
  password: dbPassword,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

export default pool;

