/**
 * Diagnose Supabase Connection Issues
 * Run this to check if your Supabase credentials are valid and accessible
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables manually (no dotenv dependency needed)
const envPath = join(__dirname, '.env');
console.log('📁 Checking .env file...');
console.log(`   Path: ${envPath}`);
const envExists = existsSync(envPath);
console.log(`   Exists: ${envExists ? '✅' : '❌'}\n`);

// Parse .env file manually
const envVars = {};
if (envExists) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Remove quotes if present
        envVars[key.trim()] = value.replace(/^["']|["']$/g, '');
      }
    }
  });
}

// Get environment variables (prefer .env file, fallback to process.env)
const url = (envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const anonKey = (envVars.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
const serviceKey = (envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

console.log('🔑 Environment Variables Status:');
console.log(`   VITE_SUPABASE_URL: ${url ? '✅ Set' : '❌ Missing'}`);
if (url) console.log(`      Value: ${url}`);

console.log(`   VITE_SUPABASE_ANON_KEY: ${anonKey ? '✅ Set' : '❌ Missing'}`);
if (anonKey) console.log(`      Length: ${anonKey.length} characters`);

console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${serviceKey ? '✅ Set' : '❌ Missing'}`);
if (serviceKey) console.log(`      Length: ${serviceKey.length} characters\n`);

if (!url || !anonKey) {
  console.error('❌ Missing required environment variables!');
  console.log('\n💡 Solution:');
  console.log('   1. Make sure your .env file exists in the project root');
  console.log('   2. Add the following variables to .env:');
  console.log('      VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.log('      VITE_SUPABASE_ANON_KEY=your_anon_key');
  console.log('\n   Get your keys from:');
  console.log('   https://supabase.com/dashboard/project/xyjfofiztvzpblskuoan/settings/api');
  process.exit(1);
}

console.log('🔍 Testing Supabase Connection...\n');

// Create client
const supabase = createClient(url, anonKey);

// Test connection with timeout
const testConnection = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 10000); // 10 second timeout

  try {
    console.log('   Attempting to query songs table...');
    const { data, error } = await supabase
      .from('songs')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);

    clearTimeout(timeout);

    if (error) {
      console.error('❌ Query failed:', error.message);
      console.log('\n💡 Possible Issues:');
      
      if (error.message.includes('JWT')) {
        console.log('   • Invalid API key - check your VITE_SUPABASE_ANON_KEY');
        console.log('   • Get it from: Settings → API → anon/public key');
      } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
        console.log('   • The "songs" table may not exist in your database');
        console.log('   • Check your database schema at:');
        console.log('     https://supabase.com/dashboard/project/xyjfofiztvzpblskuoan/editor');
      } else if (error.message.includes('Row Level Security')) {
        console.log('   • RLS policies may be blocking access');
        console.log('   • Check RLS settings in your Supabase dashboard');
      } else {
        console.log('   • Error:', error.message);
      }
      
      return false;
    }

    console.log('✅ Connection successful!');
    console.log(`   Retrieved ${data?.length || 0} row(s) from songs table`);
    return true;

  } catch (err) {
    clearTimeout(timeout);
    
    if (err.name === 'AbortError') {
      console.error('❌ Connection timeout (>10 seconds)');
      console.log('\n💡 Possible Issues:');
      console.log('   • Network connectivity problems');
      console.log('   • Supabase project may be paused or unavailable');
      console.log('   • Firewall or proxy blocking connection');
      console.log('   • Check project status at: https://supabase.com/dashboard');
    } else {
      console.error('❌ Connection error:', err.message);
    }
    
    return false;
  }
};

// Run test
const success = await testConnection();

console.log('\n' + '='.repeat(60));
if (success) {
  console.log('✅ Supabase is working correctly!');
  console.log('\nIf you\'re still seeing the offline message:');
  console.log('   1. Restart your development server');
  console.log('   2. Clear browser cache and reload');
  console.log('   3. Check browser console for other errors');
} else {
  console.log('❌ Supabase connection failed');
  console.log('\nThe app will work in offline mode using IndexedDB.');
  console.log('To fix this:');
  console.log('   1. Verify your environment variables are correct');
  console.log('   2. Check that your Supabase project is active');
  console.log('   3. Ensure RLS policies allow read access');
  console.log('   4. Restart your development server after fixing');
}
console.log('='.repeat(60) + '\n');

process.exit(success ? 0 : 1);
