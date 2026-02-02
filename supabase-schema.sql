-- =============================================================================
-- THE BOLD MOVE - Complete Supabase Database Schema
-- =============================================================================
-- This script creates all tables necessary for the app's boutique features.
-- Run this in your Supabase SQL Editor to initialize your personal database.
-- =============================================================================

-- Enable UUID extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PROFILES (users table)
-- User settings and boutique preferences
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  stuck_point text,
  dream text,
  onboarding_completed boolean DEFAULT false,
  notification_preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS Policy: Users can only access their own profile
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- =============================================================================
-- DREAMS
-- Tracking 'Big Dreams' - supports multiple dreams per user
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.dreams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text CHECK (category IN ('career', 'travel', 'finance', 'creative', 'wellness')),
  core_motivation text,
  is_active boolean DEFAULT true,
  five_whys_completed boolean DEFAULT false,
  permission_slip_signed boolean DEFAULT false,
  total_actions integer DEFAULT 0,
  completed_actions integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policy: Users can only access their own dreams
ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dreams" ON public.dreams
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dreams" ON public.dreams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dreams" ON public.dreams
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dreams" ON public.dreams
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dreams_user_id ON public.dreams(user_id);
CREATE INDEX IF NOT EXISTS idx_dreams_is_active ON public.dreams(user_id, is_active);

-- =============================================================================
-- FIVE WHYS SESSIONS
-- Deep coaching dialogues - the questioning process
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.five_whys_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dream_id text,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  current_why_number integer NOT NULL DEFAULT 1
    CHECK (current_why_number >= 1 AND current_why_number <= 5),
  root_motivation text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- RLS Policy
ALTER TABLE public.five_whys_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON public.five_whys_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON public.five_whys_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.five_whys_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON public.five_whys_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_five_whys_sessions_user_id ON public.five_whys_sessions(user_id);

-- =============================================================================
-- FIVE WHYS RESPONSES
-- Individual responses in the coaching dialogue
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.five_whys_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.five_whys_sessions(id) ON DELETE CASCADE,
  why_number integer NOT NULL CHECK (why_number >= 1 AND why_number <= 5),
  question text NOT NULL,
  user_response text NOT NULL,
  gabby_reflection text,
  created_at timestamptz DEFAULT now()
);

-- RLS Policy: Access through session ownership
ALTER TABLE public.five_whys_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses from their sessions" ON public.five_whys_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.five_whys_sessions
      WHERE id = five_whys_responses.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert responses to their sessions" ON public.five_whys_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.five_whys_sessions
      WHERE id = five_whys_responses.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update responses in their sessions" ON public.five_whys_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.five_whys_sessions
      WHERE id = five_whys_responses.session_id
      AND user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_five_whys_responses_session_id ON public.five_whys_responses(session_id);

-- =============================================================================
-- PERMISSION SLIPS
-- Metadata for styles, text, and signatures
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.permission_slips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.five_whys_sessions(id) ON DELETE SET NULL,
  dream_id text,
  permission_statement text NOT NULL,
  visual_style text NOT NULL CHECK (visual_style IN ('minimalist', 'floral', 'modern')),
  signature_data text,  -- Base64 encoded signature or storage path
  signed_at timestamptz,
  share_image_url text,
  created_at timestamptz DEFAULT now()
);

-- RLS Policy
ALTER TABLE public.permission_slips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own permission slips" ON public.permission_slips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own permission slips" ON public.permission_slips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own permission slips" ON public.permission_slips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own permission slips" ON public.permission_slips
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_permission_slips_user_id ON public.permission_slips(user_id);

-- =============================================================================
-- ACTION ROADMAPS
-- The structured 'Golden Path' - strategic action sequences
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.action_roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dream text NOT NULL,
  root_motivation text,
  roadmap_title text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policy
ALTER TABLE public.action_roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roadmaps" ON public.action_roadmaps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roadmaps" ON public.action_roadmaps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roadmaps" ON public.action_roadmaps
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roadmaps" ON public.action_roadmaps
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_action_roadmaps_user_id ON public.action_roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_action_roadmaps_status ON public.action_roadmaps(user_id, status);

-- =============================================================================
-- ROADMAP ACTIONS
-- Individual micro-actions with 'Gabby's Tips'
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.roadmap_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id uuid NOT NULL REFERENCES public.action_roadmaps(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  why_it_matters text,
  duration_minutes integer DEFAULT 5,
  order_index integer NOT NULL DEFAULT 0,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  gabby_tip text,  -- Gabby's personalized tip for this action
  category text CHECK (
    category IS NULL OR
    category IN ('research', 'planning', 'action', 'reflection', 'connection')
  ),
  created_at timestamptz DEFAULT now()
);

-- RLS Policy: Access through roadmap ownership
ALTER TABLE public.roadmap_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view actions from their roadmaps" ON public.roadmap_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.action_roadmaps
      WHERE id = roadmap_actions.roadmap_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert actions to their roadmaps" ON public.roadmap_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.action_roadmaps
      WHERE id = roadmap_actions.roadmap_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update actions in their roadmaps" ON public.roadmap_actions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.action_roadmaps
      WHERE id = roadmap_actions.roadmap_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete actions from their roadmaps" ON public.roadmap_actions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.action_roadmaps
      WHERE id = roadmap_actions.roadmap_id
      AND user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_roadmap_actions_roadmap_id ON public.roadmap_actions(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_actions_order ON public.roadmap_actions(roadmap_id, order_index);

-- =============================================================================
-- MICRO ACTIONS
-- Daily micro-actions (not part of roadmaps)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.micro_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  duration integer DEFAULT 5,
  category text CHECK (
    category IN ('research', 'planning', 'action', 'reflection', 'connection')
  ),
  is_premium boolean DEFAULT false,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  dream_id text,
  created_at timestamptz DEFAULT now()
);

-- RLS Policy
ALTER TABLE public.micro_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own micro actions" ON public.micro_actions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own micro actions" ON public.micro_actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own micro actions" ON public.micro_actions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own micro actions" ON public.micro_actions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_micro_actions_user_id ON public.micro_actions(user_id);

-- =============================================================================
-- PROOFS (Proof Gallery)
-- Links to photos and notes for completed actions
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_id uuid REFERENCES public.micro_actions(id) ON DELETE SET NULL,
  permission_slip_id uuid REFERENCES public.permission_slips(id) ON DELETE SET NULL,
  proof_type text DEFAULT 'action'
    CHECK (proof_type IN ('action', 'permission_slip', 'milestone')),
  image_url text,  -- Storage path or URL to the image
  note text,
  hashtags text[] DEFAULT '{}',
  reactions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- RLS Policy
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own proofs" ON public.proofs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own proofs" ON public.proofs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proofs" ON public.proofs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proofs" ON public.proofs
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_proofs_user_id ON public.proofs(user_id);
CREATE INDEX IF NOT EXISTS idx_proofs_action_id ON public.proofs(action_id);

-- =============================================================================
-- CHAT MESSAGES
-- Conversation history with Gabby (AI coach)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  dialogue_step integer DEFAULT 1,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- RLS Policy
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" ON public.chat_messages
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);

-- =============================================================================
-- STREAKS
-- User activity streaks
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_active_date date,
  created_at timestamptz DEFAULT now()
);

-- RLS Policy
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streaks" ON public.streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks" ON public.streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" ON public.streaks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON public.streaks(user_id);

-- =============================================================================
-- HYPE SQUADS
-- Community groups for mutual support
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.hype_squads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  dream_theme text,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- RLS Policy: Squads are viewable by members
ALTER TABLE public.hype_squads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hype squads" ON public.hype_squads
  FOR SELECT USING (true);

CREATE POLICY "Users can create hype squads" ON public.hype_squads
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their squads" ON public.hype_squads
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their squads" ON public.hype_squads
  FOR DELETE USING (auth.uid() = created_by);

-- =============================================================================
-- SQUAD MEMBERS
-- Squad membership
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.squad_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL REFERENCES public.hype_squads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(squad_id, user_id)
);

-- RLS Policy
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view squad members" ON public.squad_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = squad_members.squad_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join squads" ON public.squad_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave squads" ON public.squad_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_squad_members_squad_id ON public.squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_user_id ON public.squad_members(user_id);

-- =============================================================================
-- SQUAD POSTS
-- Posts within squads
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.squad_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL REFERENCES public.hype_squads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  proof_id uuid REFERENCES public.proofs(id) ON DELETE SET NULL,
  message text,
  cheers integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS Policy: Squad members can view and interact with posts
ALTER TABLE public.squad_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Squad members can view posts" ON public.squad_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.squad_members
      WHERE squad_id = squad_posts.squad_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Squad members can create posts" ON public.squad_posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.squad_members
      WHERE squad_id = squad_posts.squad_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own posts" ON public.squad_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.squad_posts
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_squad_posts_squad_id ON public.squad_posts(squad_id);

-- =============================================================================
-- STORAGE BUCKET: proof-assets
-- For hosting user signatures and gallery media
-- =============================================================================
-- Note: Run this in Supabase Dashboard > Storage > Create new bucket
-- Or use the Supabase API to create it programmatically

-- Storage bucket configuration (run in SQL Editor):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proof-assets',
  'proof-assets',
  false,  -- Private bucket, requires authentication
  52428800,  -- 50MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for proof-assets bucket
CREATE POLICY "Users can upload their own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'proof-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'proof-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'proof-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'proof-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for dreams table
DROP TRIGGER IF EXISTS set_dreams_updated_at ON public.dreams;
CREATE TRIGGER set_dreams_updated_at
  BEFORE UPDATE ON public.dreams
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for action_roadmaps table
DROP TRIGGER IF EXISTS set_action_roadmaps_updated_at ON public.action_roadmaps;
CREATE TRIGGER set_action_roadmaps_updated_at
  BEFORE UPDATE ON public.action_roadmaps
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- VERIFICATION QUERY
-- Run this to verify all tables are created correctly
-- =============================================================================
-- SELECT table_name,
--        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
-- FROM information_schema.tables t
-- WHERE table_schema = 'public'
-- ORDER BY table_name;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
