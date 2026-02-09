-- Add is_active column to dreams table if it doesn't exist
-- Run this in Supabase SQL Editor

-- First, check if the dreams table exists and add the is_active column
ALTER TABLE dreams ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add created_at if missing
ALTER TABLE dreams ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add category if missing  
ALTER TABLE dreams ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'personal-growth';

-- Set existing dreams to active if they don't have a value
UPDATE dreams SET is_active = true WHERE is_active IS NULL;
