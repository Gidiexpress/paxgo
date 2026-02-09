-- Migration: Add parent_action_id to roadmap_actions
-- This enables nested sub-actions for broken down actions

-- Add the parent_action_id column
ALTER TABLE roadmap_actions 
ADD COLUMN IF NOT EXISTS parent_action_id UUID REFERENCES roadmap_actions(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_roadmap_actions_parent_id ON roadmap_actions(parent_action_id);

-- Add comment for documentation
COMMENT ON COLUMN roadmap_actions.parent_action_id IS 'References the parent action if this is a sub-action from breaking down a larger action';
