import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@fastshot/auth';
import {
  getUserPermissionSlips,
  getLatestPermissionSlipForDream,
} from '@/services/permissionSlipService';
import { PermissionSlip } from '@/types/database';

export function usePermissionSlips(dreamId?: string) {
  const { user } = useAuth();
  const [permissionSlips, setPermissionSlips] = useState<PermissionSlip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissionSlips = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const slips = await getUserPermissionSlips(user.id, dreamId);
      setPermissionSlips(slips);
    } catch (err) {
      console.error('Error fetching permission slips:', err);
      setError('Failed to load permission slips');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, dreamId]);

  useEffect(() => {
    fetchPermissionSlips();
  }, [fetchPermissionSlips]);

  return {
    permissionSlips,
    isLoading,
    error,
    refetch: fetchPermissionSlips,
  };
}

export function useLatestPermissionSlip(dreamId: string) {
  const { user } = useAuth();
  const [permissionSlip, setPermissionSlip] = useState<PermissionSlip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissionSlip = useCallback(async () => {
    if (!user?.id || !dreamId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const slip = await getLatestPermissionSlipForDream(user.id, dreamId);
      setPermissionSlip(slip);
    } catch (err) {
      console.error('Error fetching permission slip:', err);
      setError('Failed to load permission slip');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, dreamId]);

  useEffect(() => {
    fetchPermissionSlip();
  }, [fetchPermissionSlip]);

  return {
    permissionSlip,
    isLoading,
    error,
    refetch: fetchPermissionSlip,
  };
}
