import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { HealthStatus } from '../lib/supabaseHealth';
import { checkSupabaseHealth } from '../lib/supabaseHealth';
import { setBackendMode } from '../lib/withFallback';

interface BackendContextValue {
  status: HealthStatus;
  isLocal: boolean;
  isChecking: boolean;
  retry: () => Promise<void>;
}

const BackendContext = createContext<BackendContextValue | null>(null);

export function useBackendContext(): BackendContextValue {
  const ctx = useContext(BackendContext);
  if (!ctx) throw new Error('useBackendContext must be used within BackendContext.Provider');
  return ctx;
}

export function BackendProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<HealthStatus>({
    mode: 'supabase',
    supabaseAvailable: true,
    lastChecked: new Date(),
  });
  const [isChecking, setIsChecking] = useState(true);

  const runHealthCheck = useCallback(async () => {
    setIsChecking(true);
    const result = await checkSupabaseHealth();
    setStatus(result);
    setBackendMode(result.mode);
    setIsChecking(false);
  }, []);

  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  useEffect(() => {
    const onUnavailable = () => {
      setStatus((prev) => ({ ...prev, mode: 'local', supabaseAvailable: false }));
      setBackendMode('local');
    };
    const onAvailable = () => {
      setStatus((prev) => ({ ...prev, mode: 'supabase', supabaseAvailable: true }));
      setBackendMode('supabase');
    };
    window.addEventListener('supabase:unavailable', onUnavailable);
    window.addEventListener('supabase:available', onAvailable);
    return () => {
      window.removeEventListener('supabase:unavailable', onUnavailable);
      window.removeEventListener('supabase:available', onAvailable);
    };
  }, []);

  const value: BackendContextValue = {
    status,
    isLocal: status.mode === 'local',
    isChecking,
    retry: runHealthCheck,
  };

  return (
    <BackendContext.Provider value={value}>
      {children}
    </BackendContext.Provider>
  );
}
