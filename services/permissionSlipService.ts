import { supabase } from '@/lib/supabase';
import { PermissionSlip, PermissionSlipVisualStyle } from '@/types/database';

// Type-safe wrapper for Supabase operations on tables not yet in generated types
const supabaseAny = supabase as any;

// Create a new permission slip
export async function createPermissionSlip(
  userId: string,
  permissionStatement: string,
  visualStyle: PermissionSlipVisualStyle,
  sessionId?: string,
  dreamId?: string
): Promise<PermissionSlip | null> {
  try {
    const { data, error } = await supabaseAny
      .from('permission_slips')
      .insert({
        user_id: userId,
        session_id: sessionId || null,
        dream_id: dreamId || null,
        permission_statement: permissionStatement,
        visual_style: visualStyle,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PermissionSlip;
  } catch (error) {
    console.error('Error creating permission slip:', error);
    return null;
  }
}

// Sign a permission slip
export async function signPermissionSlip(
  slipId: string,
  signatureData: string
): Promise<PermissionSlip | null> {
  try {
    const { data, error } = await supabaseAny
      .from('permission_slips')
      .update({
        signature_data: signatureData,
        signed_at: new Date().toISOString(),
      })
      .eq('id', slipId)
      .select()
      .single();

    if (error) throw error;
    return data as PermissionSlip;
  } catch (error) {
    console.error('Error signing permission slip:', error);
    return null;
  }
}

// Update share image URL
export async function updateShareImageUrl(
  slipId: string,
  shareImageUrl: string
): Promise<void> {
  try {
    await supabaseAny
      .from('permission_slips')
      .update({ share_image_url: shareImageUrl })
      .eq('id', slipId);
  } catch (error) {
    console.error('Error updating share image URL:', error);
  }
}

// Get permission slip by ID
export async function getPermissionSlip(
  slipId: string
): Promise<PermissionSlip | null> {
  try {
    const { data, error } = await supabaseAny
      .from('permission_slips')
      .select('*')
      .eq('id', slipId)
      .single();

    if (error) throw error;
    return data as PermissionSlip;
  } catch (error) {
    console.error('Error fetching permission slip:', error);
    return null;
  }
}

// Get user's permission slips
export async function getUserPermissionSlips(
  userId: string,
  dreamId?: string
): Promise<PermissionSlip[]> {
  try {
    let query = supabaseAny
      .from('permission_slips')
      .select('*')
      .eq('user_id', userId)
      .not('signed_at', 'is', null)
      .order('created_at', { ascending: false });

    if (dreamId) {
      query = query.eq('dream_id', dreamId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as PermissionSlip[];
  } catch (error) {
    console.error('Error fetching user permission slips:', error);
    return [];
  }
}

// Save permission slip as proof
export async function savePermissionSlipAsProof(
  userId: string,
  permissionSlipId: string,
  imageUrl?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('proofs')
      .insert({
        user_id: userId,
        permission_slip_id: permissionSlipId,
        proof_type: 'permission_slip',
        image_url: imageUrl || null,
        note: 'Permission Slip - A commitment to myself',
        hashtags: ['#PermissionGranted', '#BoldMove', '#SelfCompassion'],
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving permission slip as proof:', error);
    return false;
  }
}

// Get latest permission slip for a dream
export async function getLatestPermissionSlipForDream(
  userId: string,
  dreamId: string
): Promise<PermissionSlip | null> {
  try {
    const { data, error } = await supabaseAny
      .from('permission_slips')
      .select('*')
      .eq('user_id', userId)
      .eq('dream_id', dreamId)
      .not('signed_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data as PermissionSlip;
  } catch (error) {
    console.error('Error fetching latest permission slip:', error);
    return null;
  }
}
