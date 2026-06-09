import { useEffect, useState } from 'react';
import { initDatabase } from '../db/database';

export const useDatabase = (): { ready: boolean; error: string | null } => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      initDatabase();
      setReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initialize database');
    }
  }, []);

  return { ready, error };
};
