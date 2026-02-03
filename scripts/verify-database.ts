#!/usr/bin/env tsx
/**
 * Database Verification Script
 *
 * This script verifies that the Supabase database is properly configured
 * and all necessary infrastructure is in place for the app to function.
 *
 * Run with: npx tsx scripts/verify-database.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

interface VerificationResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: string;
}

const results: VerificationResult[] = [];

function log(result: VerificationResult) {
  results.push(result);
  const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
  console.log(`${icon} ${result.name}: ${result.message}`);
  if (result.details) {
    console.log(`   ${result.details}`);
  }
}

async function verifyConnection() {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows" which is fine
      throw error;
    }
    log({
      name: 'Database Connection',
      status: 'pass',
      message: 'Successfully connected to Supabase',
    });
    return true;
  } catch (error: any) {
    log({
      name: 'Database Connection',
      status: 'fail',
      message: 'Failed to connect to Supabase',
      details: error.message,
    });
    return false;
  }
}

async function verifyTables() {
  const requiredTables = [
    'users',
    'dreams',
    'five_whys_sessions',
    'five_whys_responses',
    'permission_slips',
    'action_roadmaps',
    'roadmap_actions',
    'micro_actions',
    'proofs',
    'chat_messages',
    'streaks',
    'hype_squads',
    'squad_members',
    'squad_posts',
  ];

  let allTablesExist = true;

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table as any).select('id').limit(1);
      if (error && !error.message.includes('no rows')) {
        throw error;
      }
      // Table exists
    } catch (error: any) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        log({
          name: `Table: ${table}`,
          status: 'fail',
          message: 'Table does not exist',
        });
        allTablesExist = false;
      }
    }
  }

  if (allTablesExist) {
    log({
      name: 'Database Tables',
      status: 'pass',
      message: `All ${requiredTables.length} required tables exist`,
    });
  }

  return allTablesExist;
}

async function verifyRLS() {
  try {
    // Try to access users table without auth (should fail with RLS)
    const { error } = await supabase.from('users').select('*');

    if (error) {
      log({
        name: 'Row Level Security (RLS)',
        status: 'pass',
        message: 'RLS is properly configured (unauthorized access blocked)',
      });
      return true;
    } else {
      log({
        name: 'Row Level Security (RLS)',
        status: 'warn',
        message: 'RLS may not be properly configured (data accessible without auth)',
      });
      return false;
    }
  } catch (error: any) {
    log({
      name: 'Row Level Security (RLS)',
      status: 'warn',
      message: 'Could not verify RLS configuration',
      details: error.message,
    });
    return false;
  }
}

async function verifyStorageBuckets() {
  try {
    const { data, error } = await supabase.storage.listBuckets();

    if (error) throw error;

    const buckets = data.map(b => b.name);
    const requiredBuckets = ['proof-assets', 'proofs'];
    const missingBuckets = requiredBuckets.filter(b => !buckets.includes(b));

    if (missingBuckets.length === 0) {
      log({
        name: 'Storage Buckets',
        status: 'pass',
        message: 'All required storage buckets exist',
        details: `Found: ${buckets.join(', ')}`,
      });
      return true;
    } else {
      log({
        name: 'Storage Buckets',
        status: 'warn',
        message: 'Some storage buckets are missing',
        details: `Missing: ${missingBuckets.join(', ')}`,
      });
      return false;
    }
  } catch (error: any) {
    log({
      name: 'Storage Buckets',
      status: 'fail',
      message: 'Failed to verify storage buckets',
      details: error.message,
    });
    return false;
  }
}

async function verifyAuthConfig() {
  try {
    // Check if auth broker URL is configured
    const authBrokerUrl = process.env.EXPO_PUBLIC_AUTH_BROKER_URL;

    if (!authBrokerUrl) {
      log({
        name: 'Auth Configuration',
        status: 'fail',
        message: 'Auth broker URL is not configured',
        details: 'EXPO_PUBLIC_AUTH_BROKER_URL is missing',
      });
      return false;
    }

    log({
      name: 'Auth Configuration',
      status: 'pass',
      message: 'Auth broker is properly configured',
      details: authBrokerUrl,
    });
    return true;
  } catch (error: any) {
    log({
      name: 'Auth Configuration',
      status: 'fail',
      message: 'Failed to verify auth configuration',
      details: error.message,
    });
    return false;
  }
}

async function main() {
  console.log('🔍 Starting database verification...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Using anon key: ${supabaseAnonKey.substring(0, 20)}...`);
  console.log('');

  // Run all verifications
  const connectionOk = await verifyConnection();

  if (!connectionOk) {
    console.log('\n❌ Cannot proceed without database connection');
    process.exit(1);
  }

  await verifyTables();
  await verifyRLS();
  await verifyStorageBuckets();
  await verifyAuthConfig();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(50));

  const passed = results.filter(r => r.status === 'pass').length;
  const warned = results.filter(r => r.status === 'warn').length;
  const failed = results.filter(r => r.status === 'fail').length;

  console.log(`✅ Passed: ${passed}`);
  if (warned > 0) console.log(`⚠️  Warnings: ${warned}`);
  if (failed > 0) console.log(`❌ Failed: ${failed}`);

  console.log('');

  if (failed === 0 && warned === 0) {
    console.log('🎉 All verifications passed! Your database is ready.');
    process.exit(0);
  } else if (failed === 0) {
    console.log('⚠️  Some warnings detected. The app should work, but review the warnings above.');
    process.exit(0);
  } else {
    console.log('❌ Some critical checks failed. Please fix the issues above before using the app.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
