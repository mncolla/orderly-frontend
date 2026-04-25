import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { DeliveryPlatform } from '@/types/integrations';
import type { SyncProgress } from '@/services/platformIntegrationsService';
import { platformIntegrationsService } from '@/services/platformIntegrationsService';

interface SyncContextType {
  activeSyncs: Map<string, SyncProgress>;
  isSyncing: boolean;
  getSyncProgress: (platform: DeliveryPlatform) => SyncProgress | undefined;
  startSync: (platform: DeliveryPlatform) => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [activeSyncs, setActiveSyncs] = useState<Map<string, SyncProgress>>(new Map());
  const pollingIntervalsRef = useRef<Map<string, number>>(new Map());
  const startingSyncsRef = useRef<Set<string>>(new Set()); // Track syncs that are being started
  const isMountedRef = useRef(true); // Prevent setting state after unmount

  const isSyncing = activeSyncs.size > 0;

  const getSyncProgress = useCallback((platform: DeliveryPlatform): SyncProgress | undefined => {
    return activeSyncs.get(platform);
  }, [activeSyncs]);

  const startPolling = useCallback((platform: DeliveryPlatform) => {
    // Clear existing interval if any
    const existingInterval = pollingIntervalsRef.current.get(platform);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Start new polling interval
    const interval = setInterval(async () => {
      // Check if component is still mounted
      if (!isMountedRef.current) {
        clearInterval(interval);
        return;
      }

      // Check if user is still authenticated
      if (!localStorage.getItem('auth_token')) {
        setActiveSyncs(prev => {
          const newMap = new Map(prev);
          newMap.delete(platform);
          return newMap;
        });
        clearInterval(interval);
        return;
      }

      try {
        const result = await platformIntegrationsService.getSyncProgress(platform);

        if (result.status === 'no_sync_in_progress') {
          // Sync completed or stopped
          if (isMountedRef.current) {
            setActiveSyncs(prev => {
              const newMap = new Map(prev);
              newMap.delete(platform);
              return newMap;
            });
          }

          // Limpiar interval de polling para esta plataforma
          const existing = pollingIntervalsRef.current.get(platform);
          if (existing) {
            clearInterval(existing);
            pollingIntervalsRef.current.delete(platform);
          }
          return;
        }

        if (result.progress && isMountedRef.current) {
          setActiveSyncs(prev => {
            const newMap = new Map(prev);
            newMap.set(platform, result.progress!);
            return newMap;
          });
        }
      } catch (error) {
        console.error(`Error polling sync progress for ${platform}:`, error);
        // If auth error (401), stop polling
        if (error instanceof Error && error.message.includes('401')) {
          clearInterval(interval);
          pollingIntervalsRef.current.delete(platform);
        }
      }
    }, 3000);

    pollingIntervalsRef.current.set(platform, interval);
  }, []);

  const startSync = useCallback(async (platform: DeliveryPlatform) => {
    // PROTECCIÓN: Si ya hay un sync activo o iniciándose para esta plataforma, ignorar
    if (activeSyncs.has(platform) || startingSyncsRef.current.has(platform)) {
      return;
    }

    // Marcar como "iniciándose" para prevenir duplicados concurrentes
    startingSyncsRef.current.add(platform);

    try {
      // Iniciar el sync
      await platformIntegrationsService.startSegmentedSync(platform);

      // Iniciar polling para seguimiento
      startPolling(platform);
    } catch (error: any) {
      console.error(`Error starting sync for ${platform}:`, error);
      throw error;
    } finally {
      // Liberar el flag de "iniciándose"
      startingSyncsRef.current.delete(platform);
    }
  }, [activeSyncs, startPolling]);

  // Detectar syncs activos al montar (para continuar con syncs iniciados desde el onboarding)
  useEffect(() => {
    const checkForActiveSyncs = async () => {
      // Solo verificar syncs si el usuario está autenticado
      const hasToken = !!localStorage.getItem('auth_token');
      if (!hasToken) {
        return;
      }

      // Obtener usuario actual para saber qué plataformas verificar
      const storedUser = localStorage.getItem('auth_user');
      if (!storedUser) {
        return;
      }

      let user;
      try {
        user = JSON.parse(storedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        return;
      }

      // Solo verificar plataformas que el usuario tiene integradas
      const userPlatforms = user?.integrations?.map((int: any) => int.platform) || [];

      if (userPlatforms.length === 0) {
        return;
      }

      for (const platform of userPlatforms) {
        try {
          const result = await platformIntegrationsService.getSyncProgress(platform);

          if (result.status === 'in_progress' && result.progress) {
            console.log(`✅ Sync active for ${platform}: step ${result.progress.currentStep}/${result.progress.totalSteps}`);
            if (isMountedRef.current) {
              setActiveSyncs(prev => {
                const newMap = new Map(prev);
                newMap.set(platform, result.progress!);
                return newMap;
              });
              startPolling(platform);
            }
          }
        } catch (error) {
          // Ignore errors when checking for active syncs (e.g., 401, 404)
        }
      }
    };

    // Check inmediatamente al montar
    checkForActiveSyncs();

    // Polling periódico para detectar nuevos syncs (cada 5 segundos para detección rápida)
    const pollingInterval = setInterval(checkForActiveSyncs, 5000);

    return () => {
      isMountedRef.current = false;
      clearInterval(pollingInterval);
    };
  }, []); // Remove startPolling from dependencies to prevent potential loops

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      pollingIntervalsRef.current.forEach(interval => clearInterval(interval));
    };
  }, []);

  return (
    <SyncContext.Provider value={{ activeSyncs, isSyncing, getSyncProgress, startSync }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within SyncProvider');
  }
  return context;
}
