import { useCallback } from 'react';
import type { DeliveryPlatform } from '@/types/integrations';
import { useOnboardingSync } from '@/contexts/OnboardingSyncContext';

export interface UseSyncProgressOptions {
  onSyncComplete?: () => void;
  onSyncError?: (error: string) => void;
}

/**
 * Hook para manejar el progreso de sincronización
 *
 * Ahora usa el OnboardingSyncContext que es persistente y no usa toasts
 */
export function useSyncProgress(platform: DeliveryPlatform, options: UseSyncProgressOptions = {}) {
  const { startSync, updateSyncProgress, completeSync, errorSync } = useOnboardingSync();

  const handleStartSync = useCallback(async () => {
    try {
      await startSync('stores', 4); // 4 pasos: stores, menu, categories, orders
    } catch (error: any) {
      errorSync('stores', error.message || 'Error al iniciar la sincronización');
      if (options.onSyncError) {
        options.onSyncError(error.message || 'Error al iniciar la sincronización');
      }
    }
  }, [startSync, updateSyncProgress, completeSync, errorSync, options.onSyncError, platform]);

  const handleUpdateProgress = useCallback((step: string, current: number) => {
    // Mapeo de nombres de pasos a SyncStep
    const stepMap: Record<string, 'stores' | 'menu' | 'categories' | 'orders'> = {
      'Locales': 'stores',
      'Menú': 'menu',
      'Categorías': 'categories',
      'Órdenes': 'orders',
    };

    const syncStep = stepMap[step] || 'stores';
    updateSyncProgress(syncStep, current);
  }, [updateSyncProgress]);

  return {
    isSyncing: !!options.onSyncComplete,
    syncProgress: null, // Devuelve el estado del contexto para que el modal lo use
    startSync: handleStartSync,
    updateProgress: handleUpdateProgress,
  };
}
