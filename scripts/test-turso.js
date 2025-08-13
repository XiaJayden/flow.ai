#!/usr/bin/env node

// Test script to verify Turso database connection
require('dotenv').config();

async function testTursoConnection() {
  console.log('🔍 Testing Turso Database Connection...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');
  console.log('Has DATABASE_URL:', !!process.env.DATABASE_URL);
  console.log('Is Turso URL:', process.env.DATABASE_URL?.startsWith('libsql://'));
  console.log('');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }

  if (!process.env.DATABASE_URL.startsWith('libsql://')) {
    console.log('ℹ️  Using local SQLite, not Turso');
    return;
  }

  try {
    console.log('📦 Loading Turso dependencies...');
    const { createClient } = require('@libsql/client');
    
    console.log('🔌 Creating Turso client...');
    const client = createClient({
      url: process.env.DATABASE_URL,
    });

    console.log('🧪 Testing basic connection...');
    const result = await client.execute('SELECT 1 as test');
    console.log('✅ Basic query successful:', result.rows);

    console.log('🧪 Testing table access...');
    const tables = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    console.log('✅ Tables found:', tables.rows.map(row => row.name));

    console.log('🧪 Testing user table...');
    const userCount = await client.execute('SELECT COUNT(*) as count FROM User');
    console.log('✅ User count:', userCount.rows[0].count);

    console.log('\n🎉 Turso connection test PASSED!');
    
  } catch (error) {
    console.error('\n❌ Turso connection test FAILED:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.message.includes('SQLITE_AUTH')) {
      console.error('\n💡 This looks like an authentication error. Check your auth token.');
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      console.error('\n💡 This looks like a network connectivity issue.');
    }
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      console.error('\n💡 This looks like the database does not exist.');
    }
  }
}

testTursoConnection().catch(console.error);