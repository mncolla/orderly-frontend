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
        console.log('🔒 No auth token, stopping sync polling');
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

          // Clear interval
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
          console.log('🔒 Auth error, stopping sync polling');
          clearInterval(interval);
          pollingIntervalsRef.current.delete(platform);
        }
      }
    }, 2000);

    pollingIntervalsRef.current.set(platform, interval);
  }, []);

  const startSync = useCallback(async (platform: DeliveryPlatform) => {
    // PROTECCIÓN: Si ya hay un sync activo o iniciándose para esta plataforma, ignorar
    if (activeSyncs.has(platform) || startingSyncsRef.current.has(platform)) {
      console.log(`⚠️ Sync already in progress for ${platform}, ignoring duplicate request`);
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
        console.log('🔒 No auth token, skipping sync progress check');
        return;
      }

      const platforms: DeliveryPlatform[] = ['PEDIDOS_YA', 'RAPPI', 'GLOVO', 'UBER_EATS'];
      console.log('🔍 Checking for active syncs across all platforms...');

      for (const platform of platforms) {
        try {
          const result = await platformIntegrationsService.getSyncProgress(platform);
          console.log(`📊 Sync progress for ${platform}:`, result);

          if (result.status === 'in_progress' && result.progress) {
            console.log(`✅ Detected active sync for ${platform}, starting polling`);
            if (isMountedRef.current) {
              setActiveSyncs(prev => {
                const newMap = new Map(prev);
                newMap.set(platform, result.progress!);
                return newMap;
              });
              startPolling(platform);
            }
          } else {
            console.log(`ℹ️ No active sync for ${platform}, status: ${result.status}`);
          }
        } catch (error) {
          // Ignore errors when checking for active syncs (e.g., 401, 404)
          console.log(`⚠️ Error checking sync for ${platform}:`, error);
        }
      }
    };

    checkForActiveSyncs();

    return () => {
      isMountedRef.current = false;
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
