export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
      proofs: {
        Row: {
          action_id: string | null
          created_at: string | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          note: string | null
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
            foreignKeyName: "proofs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          onboarding_completed: boolean | null
          stuck_point: string | null
        }
        Insert: {
          created_at?: string | null
          dream?: string | null
          id: string
          name: string
          onboarding_completed?: boolean | null
          stuck_point?: string | null
        }
        Update: {
          created_at?: string | null
          dream?: string | null
          id?: string
          name?: string
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

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Typed table aliases
export type DbUser = Tables<'users'>
export type DbChatMessage = Tables<'chat_messages'>
export type DbMicroAction = Tables<'micro_actions'>
export type DbProof = Tables<'proofs'>
export type DbStreak = Tables<'streaks'>
export type DbHypeSquad = Tables<'hype_squads'>
export type DbSquadMember = Tables<'squad_members'>
export type DbSquadPost = Tables<'squad_posts'>

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
