import pool from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaSQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  tag VARCHAR(50) DEFAULT 'general',
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  due_date TIMESTAMP,
  task_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Timer sessions table
CREATE TABLE IF NOT EXISTS timer_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_type VARCHAR(20) NOT NULL,
  duration INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mood logs table
CREATE TABLE IF NOT EXISTS mood_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  mood VARCHAR(50) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gamification table
CREATE TABLE IF NOT EXISTS user_gamification (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  unlocked_badges TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_id ON timer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_id ON mood_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_logs_created_at ON mood_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_gamification_updated_at BEFORE UPDATE ON user_gamification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running database migrations...');
    
    await client.query('BEGIN');
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        tag VARCHAR(50) DEFAULT 'general',
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'pending',
        due_date TIMESTAMP,
        task_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS timer_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_type VARCHAR(20) NOT NULL,
        duration INTEGER NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS mood_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        mood VARCHAR(50) NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_gamification (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        level INTEGER DEFAULT 1,
        points INTEGER DEFAULT 0,
        total_points INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        last_activity_date DATE,
        unlocked_badges TEXT[] DEFAULT ARRAY[]::TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_id ON timer_sessions(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_mood_logs_user_id ON mood_logs(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_mood_logs_created_at ON mood_logs(created_at);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
    
    // Create function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $func$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql;
    `);
    
    // Create triggers
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
      CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_user_gamification_updated_at ON user_gamification;
      CREATE TRIGGER update_user_gamification_updated_at BEFORE UPDATE ON user_gamification
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    
    await client.query('COMMIT');
    console.log('✅ Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrate();

