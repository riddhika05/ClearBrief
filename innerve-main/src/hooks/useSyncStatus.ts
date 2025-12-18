import { useState, useEffect, useCallback } from 'react';

interface SyncState {
  lastSyncTime: Date;
  secondsAgo: number;
  ingestionStatus: 'Active' | 'Idle' | 'Error';
  verificationStatus: 'Running' | 'Idle' | 'Complete';
}

export function useSyncStatus() {
  const [syncState, setSyncState] = useState<SyncState>({
    lastSyncTime: new Date(),
    secondsAgo: 0,
    ingestionStatus: 'Active',
    verificationStatus: 'Running',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncState(prev => ({
        ...prev,
        secondsAgo: Math.floor((Date.now() - prev.lastSyncTime.getTime()) / 1000),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const triggerSync = useCallback(() => {
    setSyncState(prev => ({
      ...prev,
      lastSyncTime: new Date(),
      secondsAgo: 0,
    }));
  }, []);

  return { syncState, triggerSync };
}
