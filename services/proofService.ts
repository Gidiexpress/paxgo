import { supabase } from '@/lib/supabase';
import { uploadImage } from './storageService';

// Proof types
export interface Proof {
  id: string;
  user_id: string;
  action_id: string | null;
  image_url: string | null;
  note: string | null;
  hashtags: string[];
  reactions: string[];
  proof_type: 'action' | 'permission_slip' | 'milestone';
  permission_slip_id: string | null;
  created_at: string;
}

export interface CreateProofInput {
  userId: string;
  actionId?: string;
  imageUri?: string;
  note?: string;
  hashtags?: string[];
  reactions?: string[];
  proofType?: 'action' | 'permission_slip' | 'milestone';
  permissionSlipId?: string;
}

/**
 * Create a new proof entry with optional image upload
 */
export async function createProof(input: CreateProofInput): Promise<Proof | null> {
  try {
    let imageUrl: string | null = null;

    // Upload image to storage if provided
    if (input.imageUri && input.userId) {
      imageUrl = await uploadImage(input.imageUri, input.userId, 'proofs');
    }

    // Insert into database
    const { data, error } = await supabase
      .from('proofs')
      .insert({
        user_id: input.userId,
        action_id: input.actionId || null,
        image_url: imageUrl,
        note: input.note || null,
        hashtags: input.hashtags || [],
        reactions: input.reactions || [],
        proof_type: input.proofType || 'action',
        permission_slip_id: input.permissionSlipId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Create proof error:', error);
      return null;
    }

    return data as Proof;
  } catch (error) {
    console.error('Create proof error:', error);
    return null;
  }
}

/**
 * Get all proofs for a user
 */
export async function getUserProofs(userId: string): Promise<Proof[]> {
  try {
    const { data, error } = await supabase
      .from('proofs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get user proofs error:', error);
      return [];
    }

    return (data || []) as Proof[];
  } catch (error) {
    console.error('Get user proofs error:', error);
    return [];
  }
}

/**
 * Get proofs for a specific action
 */
export async function getProofsForAction(
  userId: string,
  actionId: string
): Promise<Proof[]> {
  try {
    const { data, error } = await supabase
      .from('proofs')
      .select('*')
      .eq('user_id', userId)
      .eq('action_id', actionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get proofs for action error:', error);
      return [];
    }

    return (data || []) as Proof[];
  } catch (error) {
    console.error('Get proofs for action error:', error);
    return [];
  }
}

/**
 * Add a reaction to a proof
 */
export async function addReactionToProof(
  proofId: string,
  reaction: string
): Promise<boolean> {
  try {
    // First get current reactions
    const { data: proof, error: fetchError } = await supabase
      .from('proofs')
      .select('reactions')
      .eq('id', proofId)
      .single();

    if (fetchError) {
      console.error('Fetch proof reactions error:', fetchError);
      return false;
    }

    const currentReactions = (proof?.reactions || []) as string[];
    const updatedReactions = [...currentReactions, reaction];

    // Update with new reaction
    const { error: updateError } = await supabase
      .from('proofs')
      .update({ reactions: updatedReactions })
      .eq('id', proofId);

    if (updateError) {
      console.error('Update proof reactions error:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Add reaction error:', error);
    return false;
  }
}

/**
 * Delete a proof
 */
export async function deleteProof(proofId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('proofs')
      .delete()
      .eq('id', proofId)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete proof error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete proof error:', error);
    return false;
  }
}

/**
 * Get proof count for a user
 */
export async function getProofCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('proofs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Get proof count error:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Get proof count error:', error);
    return 0;
  }
}

/**
 * Get permission slip proofs
 */
export async function getPermissionSlipProofs(userId: string): Promise<Proof[]> {
  try {
    const { data, error } = await supabase
      .from('proofs')
      .select('*')
      .eq('user_id', userId)
      .eq('proof_type', 'permission_slip')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get permission slip proofs error:', error);
      return [];
    }

    return (data || []) as Proof[];
  } catch (error) {
    console.error('Get permission slip proofs error:', error);
    return [];
  }
}
