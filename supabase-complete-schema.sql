-- ============================================================================
-- COMPREHENSIVE SUPABASE DATABASE SCHEMA MIGRATION
-- ============================================================================
-- This script creates all required tables with Row Level Security (RLS)
-- Run this in your Supabase SQL Editor to set up the complete database schema
-- Safe to run multiple times (uses IF NOT EXISTS and handles existing columns)
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- User profile information (extends auth.users)
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

-- Add columns if they don't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'name') THEN
        ALTER TABLE public.profiles ADD COLUMN name TEXT NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'onboarding_completed') THEN
        ALTER TABLE public.profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'notification_preferences') THEN
        ALTER TABLE public.profiles ADD COLUMN notification_preferences JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- RLS Policies for profiles (users can only access their own profile)
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create updated_at trigger for profiles
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- ACTION ROADMAPS TABLE
-- ============================================================================
-- Strategic paths for achieving dreams (MUST include 'dream' column)
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

-- Add columns if they don't exist (for existing tables)
DO $$
BEGIN
    -- Ensure 'dream' column exists (CRITICAL REQUIREMENT)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'action_roadmaps'
                   AND column_name = 'dream') THEN
        ALTER TABLE public.action_roadmaps ADD COLUMN dream TEXT NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'action_roadmaps'
                   AND column_name = 'user_id') THEN
        ALTER TABLE public.action_roadmaps ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'action_roadmaps'
                   AND column_name = 'root_motivation') THEN
        ALTER TABLE public.action_roadmaps ADD COLUMN root_motivation TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'action_roadmaps'
                   AND column_name = 'roadmap_title') THEN
        ALTER TABLE public.action_roadmaps ADD COLUMN roadmap_title TEXT NOT NULL DEFAULT 'Your Golden Path';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'action_roadmaps'
                   AND column_name = 'status') THEN
        ALTER TABLE public.action_roadmaps ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'action_roadmaps'
                   AND column_name = 'created_at') THEN
        ALTER TABLE public.action_roadmaps ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'action_roadmaps'
                   AND column_name = 'updated_at') THEN
        ALTER TABLE public.action_roadmaps ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_action_roadmaps_user_id ON public.action_roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_action_roadmaps_status ON public.action_roadmaps(status);

-- Enable RLS on action_roadmaps
ALTER TABLE public.action_roadmaps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roadmaps" ON public.action_roadmaps;
DROP POLICY IF EXISTS "Users can create their own roadmaps" ON public.action_roadmaps;
DROP POLICY IF EXISTS "Users can update their own roadmaps" ON public.action_roadmaps;
DROP POLICY IF EXISTS "Users can delete their own roadmaps" ON public.action_roadmaps;

-- RLS Policies for action_roadmaps (users can only access their own roadmaps)
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

-- Create updated_at trigger for action_roadmaps
DROP TRIGGER IF EXISTS set_action_roadmaps_updated_at ON public.action_roadmaps;
CREATE TRIGGER set_action_roadmaps_updated_at
    BEFORE UPDATE ON public.action_roadmaps
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- ROADMAP ACTIONS TABLE
-- ============================================================================
-- Individual micro-actions within a roadmap
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

-- Add columns if they don't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'roadmap_actions'
                   AND column_name = 'roadmap_id') THEN
        ALTER TABLE public.roadmap_actions ADD COLUMN roadmap_id UUID NOT NULL REFERENCES public.action_roadmaps(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'roadmap_actions'
                   AND column_name = 'title') THEN
        ALTER TABLE public.roadmap_actions ADD COLUMN title TEXT NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'roadmap_actions'
                   AND column_name = 'description') THEN
        ALTER TABLE public.roadmap_actions ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'roadmap_actions'
                   AND column_name = 'why_it_matters') THEN
        ALTER TABLE public.roadmap_actions ADD COLUMN why_it_matters TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'roadmap_actions'
                   AND column_name = 'duration_minutes') THEN
        ALTER TABLE public.roadmap_actions ADD COLUMN duration_minutes INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'roadmap_actions'
                   AND column_name = 'order_index') THEN
        ALTER TABLE public.roadmap_actions ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'roadmap_actions'
                   AND column_name = 'is_completed') THEN
        ALTER TABLE public.roadmap_actions ADD COLUMN is_completed BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'roadmap_actions'
                   AND column_name = 'completed_at') THEN
        ALTER TABLE public.roadmap_actions ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'roadmap_actions'
                   AND column_name = 'gabby_tip') THEN
        ALTER TABLE public.roadmap_actions ADD COLUMN gabby_tip TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'roadmap_actions'
                   AND column_name = 'category') THEN
        ALTER TABLE public.roadmap_actions ADD COLUMN category TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'roadmap_actions'
                   AND column_name = 'created_at') THEN
        ALTER TABLE public.roadmap_actions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_roadmap_actions_roadmap_id ON public.roadmap_actions(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_actions_order ON public.roadmap_actions(roadmap_id, order_index);
CREATE INDEX IF NOT EXISTS idx_roadmap_actions_completed ON public.roadmap_actions(is_completed);

-- Enable RLS on roadmap_actions
ALTER TABLE public.roadmap_actions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view actions from their own roadmaps" ON public.roadmap_actions;
DROP POLICY IF EXISTS "Users can create actions in their own roadmaps" ON public.roadmap_actions;
DROP POLICY IF EXISTS "Users can update actions in their own roadmaps" ON public.roadmap_actions;
DROP POLICY IF EXISTS "Users can delete actions from their own roadmaps" ON public.roadmap_actions;

-- RLS Policies for roadmap_actions (users can only access actions from their own roadmaps)
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
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify your schema is set up correctly:

-- Check profiles table
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'profiles' AND table_schema = 'public';

-- Check action_roadmaps table (verify 'dream' column exists)
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'action_roadmaps' AND table_schema = 'public';

-- Check roadmap_actions table
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'roadmap_actions' AND table_schema = 'public';

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename IN ('profiles', 'action_roadmaps', 'roadmap_actions');

-- ============================================================================
-- SCHEMA SETUP COMPLETE
-- ============================================================================
-- ✅ All tables created with proper RLS policies
-- ✅ 'dream' column explicitly included in action_roadmaps
-- ✅ Safe to run multiple times (IF NOT EXISTS logic)
-- ✅ All data restricted to authenticated owner (auth.uid())
-- ============================================================================
