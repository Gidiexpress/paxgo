import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@fastshot/auth';
import { Database } from '@/types/supabase'; // Assuming you have this or similar, otherwise loose typing is fine for now

export interface VaultProof {
    id: string;
    proof_type: 'action' | 'permission_slip' | 'milestone';
    image_url: string | null;
    note: string | null;
    hashtags: string[];
    created_at: string;
    reactions: string[];
    action_id?: string;
    permission_slip_id?: string;
}

export interface VaultSlip {
    id: string;
    permission_statement: string;
    visual_style: string;
    created_at: string;
    fear?: string; // Legacy mapping maybe?
    signed_at?: string;
}

export function useVaultData() {
    const { user } = useAuth();
    const [proofs, setProofs] = useState<VaultProof[]>([]);
    const [slips, setSlips] = useState<VaultSlip[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            // Fetch Proofs
            const { data: proofsData, error: proofsError } = await supabase
                .from('proofs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (proofsError) throw proofsError;

            // Fetch Permission Slips
            const { data: slipsData, error: slipsError } = await supabase
                .from('permission_slips')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (slipsError) throw slipsError;

            setProofs(proofsData || []);
            setSlips(slipsData || []);

        } catch (e) {
            console.error('Error fetching vault data:', e);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        proofs,
        slips,
        loading,
        refreshVault: fetchData
    };
}
