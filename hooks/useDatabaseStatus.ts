import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface TableStatus {
  name: string;
  exists: boolean;
  rowCount?: number;
  rlsEnabled?: boolean;
}

export interface DatabaseStatus {
  isConnected: boolean;
  isChecking: boolean;
  error: string | null;
  lastChecked: Date | null;
  tables: TableStatus[];
  storageStatus: {
    proofAssetsExists: boolean;
    canUpload: boolean;
  };
  connectionDetails: {
    url: string;
    hasAnonKey: boolean;
  };
}

const REQUIRED_TABLES = [
  'users',
  'dreams',
  'chat_messages',
  'micro_actions',
  'proofs',
  'streaks',
  'five_whys_sessions',
  'five_whys_responses',
  'permission_slips',
  'action_roadmaps',
  'roadmap_actions',
  'hype_squads',
  'squad_members',
  'squad_posts',
];

export function useDatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus>({
    isConnected: false,
    isChecking: false,
    error: null,
    lastChecked: null,
    tables: [],
    storageStatus: {
      proofAssetsExists: false,
      canUpload: false,
    },
    connectionDetails: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      hasAnonKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  });

  const checkConnection = useCallback(async (): Promise<boolean> => {
    setStatus(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      // Test basic connection with a simple query
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned, which is OK
        throw error;
      }

      setStatus(prev => ({
        ...prev,
        isConnected: true,
        lastChecked: new Date(),
      }));
      return true;
    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        error: error.message || 'Connection failed',
        lastChecked: new Date(),
      }));
      return false;
    } finally {
      setStatus(prev => ({ ...prev, isChecking: false }));
    }
  }, []);

  const checkTables = useCallback(async (): Promise<TableStatus[]> => {
    const tableStatuses: TableStatus[] = [];

    for (const tableName of REQUIRED_TABLES) {
      try {
        // Try to query the table to check if it exists
        const { data, error, count } = await supabase
          .from(tableName as any)
          .select('*', { count: 'exact', head: true });

        if (error && error.code === '42P01') {
          // Table doesn't exist
          tableStatuses.push({
            name: tableName,
            exists: false,
          });
        } else if (error && error.code === '42501') {
          // RLS policy denied - table exists but no access
          tableStatuses.push({
            name: tableName,
            exists: true,
            rowCount: 0,
            rlsEnabled: true,
          });
        } else {
          tableStatuses.push({
            name: tableName,
            exists: true,
            rowCount: count ?? 0,
            rlsEnabled: true,
          });
        }
      } catch (err) {
        tableStatuses.push({
          name: tableName,
          exists: false,
        });
      }
    }

    setStatus(prev => ({ ...prev, tables: tableStatuses }));
    return tableStatuses;
  }, []);

  const checkStorageBucket = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.storage
        .from('proof-assets')
        .list('', { limit: 1 });

      const bucketExists = !error || error.message.includes('not found') === false;

      setStatus(prev => ({
        ...prev,
        storageStatus: {
          proofAssetsExists: bucketExists,
          canUpload: bucketExists,
        },
      }));

      return bucketExists;
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        storageStatus: {
          proofAssetsExists: false,
          canUpload: false,
        },
      }));
      return false;
    }
  }, []);

  const runFullCheck = useCallback(async () => {
    setStatus(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const isConnected = await checkConnection();

      if (isConnected) {
        await Promise.all([
          checkTables(),
          checkStorageBucket(),
        ]);
      }
    } finally {
      setStatus(prev => ({ ...prev, isChecking: false }));
    }
  }, [checkConnection, checkTables, checkStorageBucket]);

  // Verify that data operations work correctly
  const testDataOperations = useCallback(async (): Promise<{
    canRead: boolean;
    canWrite: boolean;
    errors: string[];
  }> => {
    const errors: string[] = [];
    let canRead = false;
    let canWrite = false;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        errors.push('Not authenticated - sign in to test data operations');
        return { canRead: false, canWrite: false, errors };
      }

      // Test read operation
      const { data: readData, error: readError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!readError) {
        canRead = true;
      } else if (readError.code !== 'PGRST116') {
        errors.push(`Read error: ${readError.message}`);
      } else {
        canRead = true; // No rows is still a successful read
      }

      // Test write operation by upserting user profile
      const { error: writeError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          name: readData?.name || 'Bold Explorer',
        }, { onConflict: 'id' });

      if (!writeError) {
        canWrite = true;
      } else {
        errors.push(`Write error: ${writeError.message}`);
      }

      return { canRead, canWrite, errors };
    } catch (error: any) {
      errors.push(`Operation failed: ${error.message}`);
      return { canRead, canWrite, errors };
    }
  }, []);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    status,
    checkConnection,
    checkTables,
    checkStorageBucket,
    runFullCheck,
    testDataOperations,
  };
}

// Utility function to check if database is properly configured
export async function isDatabaseConfigured(): Promise<boolean> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return false;
  }

  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    return !error || error.code === 'PGRST116';
  } catch {
    return false;
  }
}
