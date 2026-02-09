export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          bio: string | null
          onboarding_completed: boolean | null
          notification_preferences: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name: string
          avatar_url?: string | null
          bio?: string | null
          onboarding_completed?: boolean | null
          notification_preferences?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          bio?: string | null
          onboarding_completed?: boolean | null
          notification_preferences?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      action_roadmaps: {
        Row: {
          created_at: string | null
          dream: string
          id: string
          title: string
          root_motivation: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dream: string
          id?: string
          title: string
          root_motivation?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dream?: string
          id?: string
          title?: string
          root_motivation?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_roadmaps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          dialogue_step: number | null
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          dialogue_step?: number | null
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          dialogue_step?: number | null
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dreams: {
        Row: {
          category: string | null
          completed_actions: number | null
          core_motivation: string | null
          created_at: string | null
          current_streak: number | null
          description: string | null
          five_whys_completed: boolean | null
          id: string
          is_active: boolean | null
          last_activity_at: string | null
          longest_streak: number | null
          permission_slip_signed: boolean | null
          title: string
          total_actions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_actions?: number | null
          core_motivation?: string | null
          created_at?: string | null
          current_streak?: number | null
          description?: string | null
          five_whys_completed?: boolean | null
          id?: string
          is_active?: boolean | null
          last_activity_at?: string | null
          longest_streak?: number | null
          permission_slip_signed?: boolean | null
          title: string
          total_actions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          completed_actions?: number | null
          core_motivation?: string | null
          created_at?: string | null
          current_streak?: number | null
          description?: string | null
          five_whys_completed?: boolean | null
          id?: string
          is_active?: boolean | null
          last_activity_at?: string | null
          longest_streak?: number | null
          permission_slip_signed?: boolean | null
          title?: string
          total_actions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dreams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      five_whys_responses: {
        Row: {
          created_at: string | null
          gabby_reflection: string | null
          id: string
          question: string
          session_id: string
          user_response: string
          why_number: number
        }
        Insert: {
          created_at?: string | null
          gabby_reflection?: string | null
          id?: string
          question: string
          session_id: string
          user_response: string
          why_number: number
        }
        Update: {
          created_at?: string | null
          gabby_reflection?: string | null
          id?: string
          question?: string
          session_id?: string
          user_response?: string
          why_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "five_whys_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "five_whys_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      five_whys_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_why_number: number
          dream_id: string | null
          id: string
          root_motivation: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_why_number?: number
          dream_id?: string | null
          id?: string
          root_motivation?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_why_number?: number
          dream_id?: string | null
          id?: string
          root_motivation?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "five_whys_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hype_squads: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          dream_theme: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          dream_theme?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          dream_theme?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "hype_squads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      micro_actions: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          dream_id: string | null
          duration: number | null
          id: string
          is_completed: boolean | null
          is_premium: boolean | null
          rating: number | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          dream_id?: string | null
          duration?: number | null
          id?: string
          is_completed?: boolean | null
          is_premium?: boolean | null
          rating?: number | null
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          dream_id?: string | null
          duration?: number | null
          id?: string
          is_completed?: boolean | null
          is_premium?: boolean | null
          rating?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "micro_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_slips: {
        Row: {
          created_at: string | null
          dream_id: string | null
          id: string
          permission_statement: string
          session_id: string | null
          share_image_url: string | null
          signature_data: string | null
          signed_at: string | null
          user_id: string
          visual_style: string
        }
        Insert: {
          created_at?: string | null
          dream_id?: string | null
          id?: string
          permission_statement: string
          session_id?: string | null
          share_image_url?: string | null
          signature_data?: string | null
          signed_at?: string | null
          user_id: string
          visual_style: string
        }
        Update: {
          created_at?: string | null
          dream_id?: string | null
          id?: string
          permission_statement?: string
          session_id?: string | null
          share_image_url?: string | null
          signature_data?: string | null
          signed_at?: string | null
          user_id?: string
          visual_style?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_slips_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "five_whys_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_slips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      proofs: {
        Row: {
          action_id: string | null
          created_at: string | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          note: string | null
          permission_slip_id: string | null
          proof_type: string | null
          reactions: string[] | null
          user_id: string
        }
        Insert: {
          action_id?: string | null
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          note?: string | null
          permission_slip_id?: string | null
          proof_type?: string | null
          reactions?: string[] | null
          user_id: string
        }
        Update: {
          action_id?: string | null
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          note?: string | null
          permission_slip_id?: string | null
          proof_type?: string | null
          reactions?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proofs_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "micro_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proofs_permission_slip_id_fkey"
            columns: ["permission_slip_id"]
            isOneToOne: false
            referencedRelation: "permission_slips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proofs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_actions: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          gabby_tip: string | null
          id: string
          is_completed: boolean | null
          order_index: number
          roadmap_id: string
          title: string
          why_it_matters: string | null
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          gabby_tip?: string | null
          id?: string
          is_completed?: boolean | null
          order_index?: number
          roadmap_id: string
          title: string
          why_it_matters?: string | null
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          gabby_tip?: string | null
          id?: string
          is_completed?: boolean | null
          order_index?: number
          roadmap_id?: string
          title?: string
          why_it_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_actions_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "action_roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_members: {
        Row: {
          id: string
          joined_at: string | null
          squad_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          squad_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          squad_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "hype_squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_posts: {
        Row: {
          cheers: number | null
          created_at: string | null
          id: string
          message: string | null
          proof_id: string | null
          squad_id: string
          user_id: string
        }
        Insert: {
          cheers?: number | null
          created_at?: string | null
          id?: string
          message?: string | null
          proof_id?: string | null
          squad_id: string
          user_id: string
        }
        Update: {
          cheers?: number | null
          created_at?: string | null
          id?: string
          message?: string | null
          proof_id?: string | null
          squad_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_posts_proof_id_fkey"
            columns: ["proof_id"]
            isOneToOne: false
            referencedRelation: "proofs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_posts_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "hype_squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_active_date: string | null
          longest_streak: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          dream: string | null
          id: string
          name: string
          notification_preferences: Json | null
          onboarding_completed: boolean | null
          stuck_point: string | null
        }
        Insert: {
          created_at?: string | null
          dream?: string | null
          id: string
          name: string
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          stuck_point?: string | null
        }
        Update: {
          created_at?: string | null
          dream?: string | null
          id?: string
          name?: string
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          stuck_point?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Typed table aliases
export type DbProfile = Tables<'profiles'>
export type DbUser = Tables<'users'>
export type DbChatMessage = Tables<'chat_messages'>
export type DbMicroAction = Tables<'micro_actions'>
export type DbProof = Tables<'proofs'>
export type DbStreak = Tables<'streaks'>
export type DbHypeSquad = Tables<'hype_squads'>
export type DbSquadMember = Tables<'squad_members'>
export type DbSquadPost = Tables<'squad_posts'>
export type DbActionRoadmap = Tables<'action_roadmaps'>
export type DbRoadmapAction = Tables<'roadmap_actions'>
export type DbDream = Tables<'dreams'>
export type DbFiveWhysSession = Tables<'five_whys_sessions'>
export type DbFiveWhysResponse = Tables<'five_whys_responses'>
export type DbPermissionSlip = Tables<'permission_slips'>

// Chat message metadata types for tokens
export interface ChatTokenMetadata {
  type?: 'buttons' | 'action' | 'text';
  buttons?: string[];
  action?: {
    id: string;
    title: string;
    description: string;
    duration: number;
    category: string;
    limitingBelief?: string;
  };
}

// Five Whys types
export type FiveWhysSession = {
  id: string;
  user_id: string;
  dream_id: string | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  current_why_number: number;
  root_motivation: string | null;
  created_at: string | null;
  completed_at: string | null;
};

export type FiveWhysResponse = {
  id: string;
  session_id: string;
  why_number: number;
  question: string;
  user_response: string;
  gabby_reflection: string | null;
  created_at: string | null;
};

// Permission Slip types
export type PermissionSlipVisualStyle = 'minimalist' | 'floral' | 'modern' | 'classic' | 'royal' | 'cosmic' | 'sisterhood' | 'future-self';

export type PermissionSlip = {
  id: string;
  user_id: string;
  session_id: string | null;
  dream_id: string | null;
  permission_statement: string;
  visual_style: PermissionSlipVisualStyle;
  signature_data: string | null;
  signed_at: string | null;
  share_image_url: string | null;
  created_at: string | null;
};

// Extended proof type with permission slip
export type ExtendedProof = DbProof & {
  proof_type?: 'action' | 'permission_slip' | 'milestone';
  permission_slip_id?: string | null;
};

// ============================================
// ACTION ROADMAP TYPES - Phase 3
// ============================================

export type RoadmapStatus = 'active' | 'completed' | 'archived';
export type RoadmapActionCategory = 'research' | 'planning' | 'action' | 'reflection' | 'connection';

// Action Roadmap - the strategic path
export type ActionRoadmap = {
  id: string;
  user_id: string;
  dream: string;
  root_motivation: string | null;
  title: string; // Changed from roadmap_title to match DB
  status: RoadmapStatus | string;
  created_at: string | null;
  updated_at: string | null;
};

// Individual micro-action within a roadmap
export type RoadmapAction = {
  id: string;
  roadmap_id: string;
  user_id: string;
  parent_action_id: string | null;
  title: string;
  description: string | null;
  why_it_matters: string | null;
  duration_minutes: number | null;
  order_index: number;
  is_completed: boolean | null;
  completed_at: string | null;
  gabby_tip: string | null;
  category: RoadmapActionCategory | string | null;
  created_at: string | null;
  subActions?: RoadmapAction[]; // Sub-actions if this action was broken down
};

// Roadmap with its actions (for display)
export type ActionRoadmapWithActions = ActionRoadmap & {
  actions: RoadmapAction[];
};

// Insert types for Supabase
export type ActionRoadmapInsert = Omit<ActionRoadmap, 'id' | 'created_at' | 'updated_at'>;
export type RoadmapActionInsert = {
  roadmap_id: string;
  user_id: string;
  parent_action_id?: string | null;
  title: string;
  description?: string | null;
  why_it_matters?: string | null;
  duration_minutes?: number | null;
  order_index?: number;
  is_completed?: boolean | null;
  completed_at?: string | null;
  gabby_tip?: string | null;
  category?: string | null;
};
