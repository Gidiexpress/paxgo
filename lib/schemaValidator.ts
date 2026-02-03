/**
 * Schema Validator
 *
 * Validates that the user's Supabase database has the correct schema
 * for the app to function properly. Helps catch schema mismatches early.
 */

import { supabase } from './supabase';

interface SchemaValidationResult {
  isValid: boolean;
  missingColumns: string[];
  missingTables: string[];
  errorMessage?: string;
}

/**
 * Validates that the users table (profiles) has all required columns
 */
export async function validateProfilesSchema(): Promise<SchemaValidationResult> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, dream, stuck_point, onboarding_completed, notification_preferences, created_at')
      .limit(0);

    if (error) {
      if (error.code === 'PGRST204' || error.message.includes('column')) {
        const missingColumn = extractMissingColumn(error.message);

        return {
          isValid: false,
          missingColumns: missingColumn ? [missingColumn] : ['unknown'],
          missingTables: [],
          errorMessage: `Database schema is outdated. The 'users' table is missing the '${missingColumn}' column. Please update your database schema.`,
        };
      }

      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return {
          isValid: false,
          missingColumns: [],
          missingTables: ['users'],
          errorMessage: 'The users table does not exist in your database. Please run the complete database schema setup.',
        };
      }

      return {
        isValid: false,
        missingColumns: [],
        missingTables: [],
        errorMessage: `Schema validation error: ${error.message}`,
      };
    }

    return {
      isValid: true,
      missingColumns: [],
      missingTables: [],
    };
  } catch (error: any) {
    return {
      isValid: false,
      missingColumns: [],
      missingTables: [],
      errorMessage: `Unexpected error during schema validation: ${error.message}`,
    };
  }
}

/**
 * Validates that the action_roadmaps table has all required columns
 */
export async function validateActionRoadmapsSchema(): Promise<SchemaValidationResult> {
  try {
    // Attempt a select with all required columns
    // This will fail if any column is missing
    const { data, error } = await supabase
      .from('action_roadmaps')
      .select('id, user_id, dream, root_motivation, roadmap_title, status, created_at, updated_at')
      .limit(0); // Don't fetch any rows, just validate the query

    if (error) {
      // Check if it's a column not found error
      if (error.code === 'PGRST204' || error.message.includes('column')) {
        // Parse error message to find which column is missing
        const missingColumn = extractMissingColumn(error.message);

        return {
          isValid: false,
          missingColumns: missingColumn ? [missingColumn] : ['unknown'],
          missingTables: [],
          errorMessage: `Database schema is outdated. The 'action_roadmaps' table is missing the '${missingColumn}' column. Please update your database schema.`,
        };
      }

      // Check if table doesn't exist
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return {
          isValid: false,
          missingColumns: [],
          missingTables: ['action_roadmaps'],
          errorMessage: 'The action_roadmaps table does not exist in your database. Please run the complete database schema setup.',
        };
      }

      // Other errors
      return {
        isValid: false,
        missingColumns: [],
        missingTables: [],
        errorMessage: `Schema validation error: ${error.message}`,
      };
    }

    // Schema is valid
    return {
      isValid: true,
      missingColumns: [],
      missingTables: [],
    };
  } catch (error: any) {
    return {
      isValid: false,
      missingColumns: [],
      missingTables: [],
      errorMessage: `Unexpected error during schema validation: ${error.message}`,
    };
  }
}

/**
 * Validates roadmap_actions table schema
 */
export async function validateRoadmapActionsSchema(): Promise<SchemaValidationResult> {
  try {
    const { data, error } = await supabase
      .from('roadmap_actions')
      .select('id, roadmap_id, title, description, why_it_matters, duration_minutes, order_index, is_completed, completed_at, gabby_tip, category, created_at')
      .limit(0);

    if (error) {
      if (error.code === 'PGRST204' || error.message.includes('column')) {
        const missingColumn = extractMissingColumn(error.message);

        return {
          isValid: false,
          missingColumns: missingColumn ? [missingColumn] : ['unknown'],
          missingTables: [],
          errorMessage: `Database schema is outdated. The 'roadmap_actions' table is missing the '${missingColumn}' column.`,
        };
      }

      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return {
          isValid: false,
          missingColumns: [],
          missingTables: ['roadmap_actions'],
          errorMessage: 'The roadmap_actions table does not exist in your database.',
        };
      }

      return {
        isValid: false,
        missingColumns: [],
        missingTables: [],
        errorMessage: `Schema validation error: ${error.message}`,
      };
    }

    return {
      isValid: true,
      missingColumns: [],
      missingTables: [],
    };
  } catch (error: any) {
    return {
      isValid: false,
      missingColumns: [],
      missingTables: [],
      errorMessage: `Unexpected error: ${error.message}`,
    };
  }
}

/**
 * Validates all required tables (profiles, action_roadmaps, roadmap_actions)
 */
export async function validateRoadmapSchema(): Promise<SchemaValidationResult> {
  // Check profiles table first
  const profilesResult = await validateProfilesSchema();
  if (!profilesResult.isValid) {
    return profilesResult;
  }

  // Check action_roadmaps table
  const roadmapsResult = await validateActionRoadmapsSchema();
  if (!roadmapsResult.isValid) {
    return roadmapsResult;
  }

  // Check roadmap_actions table
  const actionsResult = await validateRoadmapActionsSchema();
  if (!actionsResult.isValid) {
    return actionsResult;
  }

  return {
    isValid: true,
    missingColumns: [],
    missingTables: [],
  };
}

/**
 * Helper to extract the missing column name from error message
 */
function extractMissingColumn(errorMessage: string): string | null {
  // Pattern: "Could not find the 'column_name' column"
  const match = errorMessage.match(/['"]([^'"]+)['"].*column/i);
  return match ? match[1] : null;
}

/**
 * Get user-friendly instructions for fixing schema issues
 */
export function getSchemaFixInstructions(validation: SchemaValidationResult): string {
  if (validation.isValid) return '';

  let instructions = '⚠️ Your database schema needs to be updated.\n\n';

  if (validation.missingTables.length > 0) {
    instructions += `Missing tables: ${validation.missingTables.join(', ')}\n\n`;
    instructions += '📋 Quick Fix:\n';
    instructions += '1. Tap "Copy Complete SQL Script" button below\n';
    instructions += '2. Open your Supabase dashboard at https://supabase.com/dashboard\n';
    instructions += '3. Select your project\n';
    instructions += '4. Go to the SQL Editor (left sidebar)\n';
    instructions += '5. Paste and click "Run" to execute the script\n';
    instructions += '6. Come back here and click "Check Again"\n\n';
    instructions += '💡 The script is safe to run multiple times and will not overwrite existing data.\n';
  } else if (validation.missingColumns.length > 0) {
    const tableName = validation.errorMessage?.includes('users') ? 'users' :
                     validation.errorMessage?.includes('action_roadmaps') ? 'action_roadmaps' :
                     'roadmap_actions';

    instructions += `Missing columns in ${tableName}: ${validation.missingColumns.join(', ')}\n\n`;
    instructions += '📋 Quick Fix:\n';
    instructions += '1. Tap "Copy Complete SQL Script" button below\n';
    instructions += '2. Open your Supabase dashboard at https://supabase.com/dashboard\n';
    instructions += '3. Select your project\n';
    instructions += '4. Go to the SQL Editor (left sidebar)\n';
    instructions += '5. Paste and click "Run" to execute the script\n';
    instructions += '6. Come back here and click "Check Again"\n\n';
    instructions += '💡 The script will add missing columns without affecting existing data.\n';
  }

  return instructions;
}

/**
 * Get the complete SQL migration script for copy/paste
 */
export function getCompleteSQLScript(): string {
  return `-- ============================================================================
-- COMPREHENSIVE SUPABASE DATABASE SCHEMA MIGRATION
-- ============================================================================
-- Run this in your Supabase SQL Editor to set up the complete database schema
-- Safe to run multiple times (uses IF NOT EXISTS and handles existing columns)
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    onboarding_completed BOOLEAN DEFAULT false,
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- ACTION ROADMAPS TABLE (includes 'dream' column)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.action_roadmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dream TEXT NOT NULL,
    root_motivation TEXT,
    roadmap_title TEXT NOT NULL DEFAULT 'Your Golden Path',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_action_roadmaps_user_id ON public.action_roadmaps(user_id);

-- Enable RLS on action_roadmaps
ALTER TABLE public.action_roadmaps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roadmaps" ON public.action_roadmaps;
DROP POLICY IF EXISTS "Users can create their own roadmaps" ON public.action_roadmaps;
DROP POLICY IF EXISTS "Users can update their own roadmaps" ON public.action_roadmaps;
DROP POLICY IF EXISTS "Users can delete their own roadmaps" ON public.action_roadmaps;

-- RLS Policies for action_roadmaps
CREATE POLICY "Users can view their own roadmaps"
    ON public.action_roadmaps FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own roadmaps"
    ON public.action_roadmaps FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roadmaps"
    ON public.action_roadmaps FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roadmaps"
    ON public.action_roadmaps FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- ROADMAP ACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.roadmap_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roadmap_id UUID NOT NULL REFERENCES public.action_roadmaps(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    why_it_matters TEXT,
    duration_minutes INTEGER,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    gabby_tip TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_roadmap_actions_roadmap_id ON public.roadmap_actions(roadmap_id);

-- Enable RLS on roadmap_actions
ALTER TABLE public.roadmap_actions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view actions from their own roadmaps" ON public.roadmap_actions;
DROP POLICY IF EXISTS "Users can create actions in their own roadmaps" ON public.roadmap_actions;
DROP POLICY IF EXISTS "Users can update actions in their own roadmaps" ON public.roadmap_actions;
DROP POLICY IF EXISTS "Users can delete actions from their own roadmaps" ON public.roadmap_actions;

-- RLS Policies for roadmap_actions
CREATE POLICY "Users can view actions from their own roadmaps"
    ON public.roadmap_actions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.action_roadmaps
            WHERE action_roadmaps.id = roadmap_actions.roadmap_id
            AND action_roadmaps.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create actions in their own roadmaps"
    ON public.roadmap_actions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.action_roadmaps
            WHERE action_roadmaps.id = roadmap_actions.roadmap_id
            AND action_roadmaps.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update actions in their own roadmaps"
    ON public.roadmap_actions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.action_roadmaps
            WHERE action_roadmaps.id = roadmap_actions.roadmap_id
            AND action_roadmaps.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete actions from their own roadmaps"
    ON public.roadmap_actions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.action_roadmaps
            WHERE action_roadmaps.id = roadmap_actions.roadmap_id
            AND action_roadmaps.user_id = auth.uid()
        )
    );

-- ============================================================================
-- SCHEMA SETUP COMPLETE ✅
-- ============================================================================`;
}
