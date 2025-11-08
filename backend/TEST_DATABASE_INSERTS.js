// Test script to verify database inserts are working
import pool from './src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function testInserts() {
  try {
    console.log('🧪 Testing database inserts...\n');

    // Get a test user ID (or use user_id = 1)
    const userId = 1;

    // Test 1: Insert a task
    console.log('📝 Test 1: Inserting a task...');
    try {
      const taskResult = await pool.query(
        `INSERT INTO tasks (user_id, title, description, tag, priority, task_order, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, 'Test Task', 'Test Description', 'general', 'medium', 1, 'pending']
      );
      console.log('✅ Task inserted:', taskResult.rows[0]);
    } catch (error) {
      console.error('❌ Task insert failed:', error.message);
      console.error('   Code:', error.code);
      console.error('   Detail:', error.detail);
    }

    // Test 2: Insert a mood log
    console.log('\n😊 Test 2: Inserting a mood log...');
    try {
      const moodResult = await pool.query(
        'INSERT INTO mood_logs (user_id, mood, note) VALUES ($1, $2, $3) RETURNING *',
        [userId, 'happy', 'Test mood log']
      );
      console.log('✅ Mood log inserted:', moodResult.rows[0]);
    } catch (error) {
      console.error('❌ Mood log insert failed:', error.message);
      console.error('   Code:', error.code);
      console.error('   Detail:', error.detail);
    }

    // Test 3: Insert a timer session
    console.log('\n⏱️ Test 3: Inserting a timer session...');
    try {
      const sessionResult = await pool.query(
        `INSERT INTO timer_sessions (user_id, session_type, duration, completed_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         RETURNING *`,
        [userId, 'work', 1500] // 25 minutes
      );
      console.log('✅ Timer session inserted:', sessionResult.rows[0]);
    } catch (error) {
      console.error('❌ Timer session insert failed:', error.message);
      console.error('   Code:', error.code);
      console.error('   Detail:', error.detail);
    }

    // Check what tables exist
    console.log('\n📊 Checking tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('Tables in database:', tablesResult.rows.map(r => r.table_name));

    // Check tasks table structure
    console.log('\n📋 Checking tasks table structure...');
    const tasksStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position
    `);
    console.log('Tasks table columns:', tasksStructure.rows);

    await pool.end();
    console.log('\n✅ Tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testInserts();

