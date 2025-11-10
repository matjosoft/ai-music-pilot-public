#!/usr/bin/env tsx
/**
 * Setup Test User Script
 *
 * This script ensures the test user (matjosoft@gmail.com) is properly configured
 * with unlimited access for testing purposes.
 *
 * Run this script after running the database migration to set up the test user.
 *
 * Usage:
 *   npm run setup-test-user
 *   
 * Or with explicit env vars:
 *   NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npm run setup-test-user
 */

import { createClient } from '@supabase/supabase-js'

// Try to load from dotenv if available
try {
  const dotenv = await import('dotenv')
  const { resolve } = await import('path')
  const { existsSync } = await import('fs')
  
  const envLocalPath = resolve(process.cwd(), '.env.local')
  const envPath = resolve(process.cwd(), '.env')
  
  if (existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath })
  } else if (existsSync(envPath)) {
    dotenv.config({ path: envPath })
  } else {
    dotenv.config()
  }
} catch (e) {
  // dotenv not available, rely on environment variables
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TEST_USER_EMAIL = 'matjosoft@gmail.com'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓ Set' : '✗ Missing')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing')
  console.error('\n💡 Options to fix this:')
  console.error('   1. Create a .env or .env.local file with these variables')
  console.error('   2. Set them as environment variables:')
  console.error('      NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npm run setup-test-user')
  process.exit(1)
}

async function setupTestUser() {
  console.log('🔧 Setting up test user...\n')

  // Create Supabase client with service role key (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // 1. Find the test user
    console.log(`1️⃣  Looking for user: ${TEST_USER_EMAIL}`)
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      throw new Error(`Failed to list users: ${userError.message}`)
    }

    const testUser = users.users.find((u) => u.email === TEST_USER_EMAIL)

    if (!testUser) {
      console.log(`⚠️  User ${TEST_USER_EMAIL} not found.`)
      console.log('   Please create this user account first by:')
      console.log('   1. Running the app')
      console.log('   2. Signing up with matjosoft@gmail.com')
      console.log('   3. Running this script again')
      process.exit(0)
    }

    console.log(`✅ Found user: ${testUser.id}\n`)

    // 2. Check if subscription exists
    console.log('2️⃣  Checking subscription...')
    const { data: existingSub, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', testUser.id)
      .single()

    if (subError && subError.code !== 'PGRST116') {
      throw new Error(`Failed to check subscription: ${subError.message}`)
    }

    // 3. Create or update subscription
    if (!existingSub) {
      console.log('   Creating new test user subscription...')
      const { error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: testUser.id,
          tier: 'test',
          generation_limit: -1,
          is_test_user: true,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        })

      if (insertError) {
        throw new Error(`Failed to create subscription: ${insertError.message}`)
      }
      console.log('✅ Subscription created\n')
    } else {
      console.log('   Updating existing subscription...')
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          tier: 'test',
          generation_limit: -1,
          is_test_user: true,
        })
        .eq('user_id', testUser.id)

      if (updateError) {
        throw new Error(`Failed to update subscription: ${updateError.message}`)
      }
      console.log('✅ Subscription updated\n')
    }

    // 4. Verify setup
    console.log('3️⃣  Verifying setup...')
    const { data: finalSub, error: verifyError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', testUser.id)
      .single()

    if (verifyError) {
      throw new Error(`Failed to verify subscription: ${verifyError.message}`)
    }

    console.log('✅ Verification complete!\n')
    console.log('📊 Test User Configuration:')
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`   Email:            ${TEST_USER_EMAIL}`)
    console.log(`   User ID:          ${testUser.id}`)
    console.log(`   Tier:             ${finalSub.tier}`)
    console.log(`   Generation Limit: ${finalSub.generation_limit === -1 ? 'Unlimited' : finalSub.generation_limit}`)
    console.log(`   Is Test User:     ${finalSub.is_test_user}`)
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('🎉 Test user setup complete!')
    console.log('   You can now use matjosoft@gmail.com for unlimited testing.\n')
  } catch (error) {
    console.error('\n❌ Error setting up test user:')
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

setupTestUser()
