# 📊 Database Setup Guide

## Overview

This guide helps you set up your Supabase database with the complete schema required for the application.

## ✅ What Was Implemented

### 1. **Comprehensive SQL Migration Script**
   - **Location**: `/workspace/supabase-complete-schema.sql`
   - **Features**:
     - Creates `profiles`, `action_roadmaps` (with `dream` column), and `roadmap_actions` tables
     - Implements strict Row Level Security (RLS) policies
     - Safe to run multiple times (uses `IF NOT EXISTS` logic)
     - Handles existing tables gracefully
     - All data restricted to authenticated owner (auth.uid())

### 2. **Enhanced Schema Validator**
   - **Location**: `/workspace/lib/schemaValidator.ts`
   - **Validates**:
     - ✅ profiles table
     - ✅ action_roadmaps table (including 'dream' column)
     - ✅ roadmap_actions table
   - **Functions**:
     - `validateProfilesSchema()` - Checks profiles table
     - `validateActionRoadmapsSchema()` - Checks action_roadmaps table
     - `validateRoadmapActionsSchema()` - Checks roadmap_actions table
     - `validateRoadmapSchema()` - Validates all three tables
     - `getCompleteSQLScript()` - Returns the complete SQL migration script

### 3. **Updated Database Status Screen**
   - **Location**: `/workspace/components/DatabaseSchemaStatus.tsx`
   - **Features**:
     - Real-time schema validation
     - One-click SQL script copy
     - Step-by-step instructions
     - Visual status indicators
     - "Copy Complete SQL Script" button (primary CTA)
     - "Copy Instructions Only" button (secondary)
     - Comprehensive help guide

### 4. **Updated Database Types**
   - **Location**: `/workspace/types/database.ts`
   - **Added**: `profiles` table type definition
   - **Type Alias**: `DbProfile` for easy access

## 🚀 How to Set Up Your Database

### Step 1: Access the Database Status Screen
1. Open your app
2. Navigate to Profile tab
3. Scroll down and tap "Database Status"

### Step 2: Copy the SQL Script
1. If schema validation fails, tap **"📋 Copy Complete SQL Script"**
2. The script will be copied to your clipboard

### Step 3: Run the Script in Supabase
1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `rqmifsadkcexgqouuddu`
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Paste the script
6. Click "Run" (or press Cmd+Enter)

### Step 4: Verify Setup
1. Return to the app
2. Tap "🔄 Check Again" on the Database Status screen
3. You should see: ✅ "Your database schema is up to date! ✨"

## 📋 SQL Script Details

### Tables Created

#### 1. **profiles**
```sql
- id (UUID, Primary Key, references auth.users)
- name (TEXT, NOT NULL)
- avatar_url (TEXT)
- bio (TEXT)
- onboarding_completed (BOOLEAN, default false)
- notification_preferences (JSONB, default '{}')
- created_at (TIMESTAMPTZ, default NOW())
- updated_at (TIMESTAMPTZ, default NOW())
```

**RLS Policies**:
- Users can view their own profile
- Users can update their own profile
- Users can insert their own profile

#### 2. **action_roadmaps**
```sql
- id (UUID, Primary Key)
- user_id (UUID, NOT NULL, references auth.users)
- dream (TEXT, NOT NULL) ⭐ CRITICAL COLUMN
- root_motivation (TEXT)
- roadmap_title (TEXT, NOT NULL, default 'Your Golden Path')
- status (TEXT, NOT NULL, default 'active')
- created_at (TIMESTAMPTZ, default NOW())
- updated_at (TIMESTAMPTZ, default NOW())
```

**RLS Policies**:
- Users can view their own roadmaps
- Users can create their own roadmaps
- Users can update their own roadmaps
- Users can delete their own roadmaps

#### 3. **roadmap_actions**
```sql
- id (UUID, Primary Key)
- roadmap_id (UUID, NOT NULL, references action_roadmaps)
- title (TEXT, NOT NULL)
- description (TEXT)
- why_it_matters (TEXT)
- duration_minutes (INTEGER)
- order_index (INTEGER, NOT NULL, default 0)
- is_completed (BOOLEAN, default false)
- completed_at (TIMESTAMPTZ)
- gabby_tip (TEXT)
- category (TEXT)
- created_at (TIMESTAMPTZ, default NOW())
```

**RLS Policies**:
- Users can view actions from their own roadmaps
- Users can create actions in their own roadmaps
- Users can update actions in their own roadmaps
- Users can delete actions from their own roadmaps

## 🔒 Security Features

### Row Level Security (RLS)
All tables have strict RLS policies that ensure:
- ✅ Users can ONLY access their own data
- ✅ All queries are automatically filtered by `auth.uid()`
- ✅ No user can access another user's data
- ✅ Even with direct API access, data is protected

### Automatic Timestamps
- `created_at` is automatically set on record creation
- `updated_at` is automatically updated on record modification

## 📊 Supabase Configuration

### Current Credentials (from .env)
```
EXPO_PUBLIC_SUPABASE_URL=https://rqmifsadkcexgqouuddu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[Your JWT token]
```

**⚠️ IMPORTANT**: The application is configured to use these credentials and will NEVER revert to internal or default database settings.

## ✅ Verification

After running the SQL script, you can verify the setup by running these queries in the SQL Editor:

### Check Tables Exist
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'action_roadmaps', 'roadmap_actions');
```

### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'action_roadmaps', 'roadmap_actions');
```

### Check 'dream' Column in action_roadmaps
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'action_roadmaps'
AND table_schema = 'public'
AND column_name = 'dream';
```

## 🆘 Troubleshooting

### Issue: "Table already exists" error
**Solution**: The script is safe to run multiple times. It uses `IF NOT EXISTS` logic.

### Issue: "Column already exists" error
**Solution**: The script checks for existing columns before adding them.

### Issue: Schema validation still fails
**Steps**:
1. Clear the app cache
2. Restart the app
3. Check "Database Status" screen again
4. Verify all three tables exist in Supabase dashboard
5. Verify RLS is enabled on all tables

### Issue: RLS policies preventing access
**Check**:
1. User is authenticated (`auth.uid()` returns a value)
2. RLS policies are correctly set up
3. User is accessing their own data (user_id matches auth.uid())

## 📝 Notes

- The SQL script is **production-ready**
- All migrations are **idempotent** (safe to run multiple times)
- RLS policies ensure **data isolation**
- The `dream` column is **explicitly included** in action_roadmaps
- Schema validator checks all three tables on every validation

## 🎉 Success!

Once the database is set up:
- ✅ Database Status screen shows "Schema Up to Date"
- ✅ All features work correctly
- ✅ Data is secure with RLS
- ✅ Application uses correct Supabase credentials

---

**Last Updated**: 2026-02-03
**Schema Version**: 1.0
**Supabase Project**: rqmifsadkcexgqouuddu
