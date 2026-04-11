import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type SyncStep = 'connection' | 'stores' | 'menu' | 'orders' | 'categories';
export type SyncStatus = 'idle' | 'in_progress' | 'completed' | 'error';

export interface SyncStepInfo {
  step: SyncStep;
  status: SyncStatus;
  progress: number;
  total: number;
  name: string;
  description: string;
  timestamp?: number;
}

export interface OnboardingSyncState {
  isBlocked: boolean;
  currentSync: SyncStepInfo | null;
}

const OnboardingSyncContext = createContext<{
  state: OnboardingSyncState;
  startSync: (step: SyncStep, totalSteps: number) => void;
  updateSyncProgress: (step: SyncStep, progress: number) => void;
  completeSync: (step: SyncStep) => void;
  errorSync: (step: SyncStep, error: string) => void;
  unblock: () => void;
} | null>(null);

const SYNC_STORAGE_KEY = 'onboarding_sync_state';
const SYNC_BLOCK_DURATION = 30000; // 30 minutos en ms

export function OnboardingSyncProvider({ children }: { children: ReactNode }) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [currentSync, setCurrentSync] = useState<SyncStepInfo | null>(null);

  // Cargar estado persistente al montar
  useEffect(() => {
    const loadState = () => {
      try {
        const stored = localStorage.getItem(SYNC_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setCurrentSync(parsed.currentSync);

          // Si hay un sync en progreso y pasó el tiempo, desbloquear
          if (parsed.currentSync?.status === 'in_progress') {
            const syncAge = Date.now() - new Date(parsed.currentSync.timestamp || 0).getTime();
            if (syncAge > SYNC_BLOCK_DURATION) {
              setIsBlocked(false);
            }
          }
        }
      } catch (error) {
        console.error('Error loading sync state:', error);
      }
    };

    loadState();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SYNC_STORAGE_KEY) {
        loadState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Guardar estado persistente cuando cambia
  useEffect(() => {
    if (currentSync) {
      const toStore = {
        currentSync,
        isBlocked,
        timestamp: Date.now(),
      };
      localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(toStore));
    }
  }, [currentSync, isBlocked]);

  // Auto-desbloquear después del tiempo límite
  useEffect(() => {
    if (currentSync?.status === 'in_progress' && !isBlocked) {
      const timer = setTimeout(() => {
        setIsBlocked(false);
      }, SYNC_BLOCK_DURATION);
      return () => clearTimeout(timer);
    }
  }, [currentSync, isBlocked]);

  const getStepName = (step: SyncStep): string => {
    const names: Record<SyncStep, string> = {
      connection: 'Conexión',
      stores: 'Locales',
      menu: 'Menú',
      orders: 'Órdenes',
      categories: 'Categorías',
    };
    return names[step];
  };

  const startSync = (step: SyncStep, totalSteps: number) => {
    const stepInfo: SyncStepInfo = {
      step,
      status: 'in_progress',
      progress: 0,
      total: totalSteps,
      name: getStepName(step),
      description: `0 de ${totalSteps}`,
      timestamp: Date.now(),
    };
    setCurrentSync(stepInfo);
    setIsBlocked(true); // Bloquear durante el sync
  };

  const updateSyncProgress = (step: SyncStep, progress: number) => {
    if (!currentSync || currentSync.step !== step) return;

    setCurrentSync({
      ...currentSync,
      progress,
      description: `${progress} de ${currentSync.total}`,
    });
  };

  const completeSync = (step: SyncStep) => {
    if (!currentSync || currentSync.step !== step) return;

    setCurrentSync({
      ...currentSync,
      status: 'completed',
      progress: currentSync.total,
    });
    setIsBlocked(false);
  };

  const errorSync = (step: SyncStep, error: string) => {
    if (!currentSync) return;

    setCurrentSync({
      ...currentSync,
      status: 'error',
      name: getStepName(step),
      description: error,
      timestamp: Date.now(),
    });
    setIsBlocked(false);
  };

  const unblock = () => {
    setIsBlocked(false);
    // Limpiar estado de error para permitir reintentar
    if (currentSync?.status === 'error') {
      setCurrentSync(null);
    }
  };

  const contextValue = {
    state: {
      isBlocked,
      currentSync,
    },
    startSync,
    updateSyncProgress,
    completeSync,
    errorSync,
    unblock,
  };

  return (
    <OnboardingSyncContext.Provider value={contextValue}>
      {children}
    </OnboardingSyncContext.Provider>
  );
}

export function useOnboardingSync() {
  const context = useContext(OnboardingSyncContext);
  if (!context) {
    throw new Error('useOnboardingSync must be used within OnboardingSyncProvider');
  }
  return context;
}
