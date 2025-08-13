#!/usr/bin/env node

// Script to verify environment variables and Turso configuration
require('dotenv').config();

function checkEnvironmentVariables() {
  console.log('🔍 Checking Environment Variables...\n');

  const requiredVars = {
    'DATABASE_URL': process.env.DATABASE_URL,
    'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
    'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET,
    'YOUTUBE_API_KEY': process.env.YOUTUBE_API_KEY
  };

  console.log('📋 Environment Variables Status:');
  Object.entries(requiredVars).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const displayValue = value 
      ? (key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN') 
         ? value.substring(0, 10) + '...' 
         : value.substring(0, 50) + (value.length > 50 ? '...' : ''))
      : 'NOT SET';
    
    console.log(`${status} ${key}: ${displayValue}`);
  });

  console.log('\n🔍 Turso Configuration Analysis:');
  
  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    console.log('Database URL Format:', dbUrl.startsWith('libsql://') ? 'Turso' : 'Local SQLite');
    
    if (dbUrl.startsWith('libsql://')) {
      // Parse Turso URL
      try {
        const url = new URL(dbUrl);
        console.log('Database Host:', url.hostname);
        console.log('Database Region:', url.hostname.includes('aws-') ? url.hostname.split('.')[1] : 'Unknown');
        console.log('Has Auth Token:', url.searchParams.has('authToken') ? '✅' : '❌');
        
        if (url.searchParams.has('authToken')) {
          const token = url.searchParams.get('authToken');
          console.log('Auth Token Length:', token?.length || 0);
          console.log('Auth Token Preview:', token?.substring(0, 20) + '...');
          
          // Check token format (JWT should have 3 parts separated by dots)
          const tokenParts = token?.split('.') || [];
          console.log('Token Format:', tokenParts.length === 3 ? 'Valid JWT' : 'Invalid format');
        }
      } catch (error) {
        console.log('❌ Invalid URL format:', error.message);
      }
    }
  } else {
    console.log('❌ DATABASE_URL not set');
  }

  console.log('\n🔍 Runtime Environment:');
  console.log('Node Environment:', process.env.NODE_ENV || 'development');
  console.log('Vercel Environment:', process.env.VERCEL_ENV || 'not-vercel');
  console.log('Platform:', process.platform);
  console.log('Node Version:', process.version);

  console.log('\n💡 Recommendations:');
  
  if (!process.env.DATABASE_URL) {
    console.log('• Set DATABASE_URL in your .env file');
  }
  
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('libsql://')) {
    console.log('• You are using local SQLite. For production, use Turso.');
  }
  
  if (!process.env.NEXTAUTH_SECRET) {
    console.log('• Generate NEXTAUTH_SECRET: openssl rand -base64 32');
  }
  
  if (!process.env.YOUTUBE_API_KEY) {
    console.log('• Get YouTube API key from Google Cloud Console');
  }

  console.log('\n🧪 Next Steps:');
  console.log('1. Run: node scripts/test-turso.js');
  console.log('2. Test API: curl http://localhost:3000/api/debug/db-test');
  console.log('3. Check Vercel env vars in dashboard');
}

checkEnvironmentVariables();