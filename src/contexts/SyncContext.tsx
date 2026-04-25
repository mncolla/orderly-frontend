import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { DeliveryPlatform } from '@/types/integrations';
import type { SyncProgress } from '@/services/platformIntegrationsService';
import { platformIntegrationsService } from '@/services/platformIntegrationsService';

// Evento global para notificar cambios en el sync
declare global {
  interface Window {
    dispatchSyncEvent?: (event: string, data: any) => void;
  }
}

interface SyncContextType {
  activeSyncs: Record<string, SyncProgress>; // Changed from Map to Record
  isSyncing: boolean;
  getSyncProgress: (platform: DeliveryPlatform) => SyncProgress | undefined;
  startSync: (platform: DeliveryPlatform) => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  console.log('🏗️ SyncProvider - Component mounting...');
  const [activeSyncs, setActiveSyncs] = useState<Record<string, SyncProgress>>({});
  const pollingIntervalsRef = useRef<Map<string, number>>(new Map());
  const startingSyncsRef = useRef<Set<string>>(new Set()); // Track syncs that are being started
  const isMountedRef = useRef(true); // Prevent setting state after unmount

  const isSyncing = Object.keys(activeSyncs).length > 0;
  console.log('🏗️ SyncProvider - Initial state:', { isSyncing, activeSyncsKeys: Object.keys(activeSyncs) });

  // Crear función global para emitir eventos de sync
  useEffect(() => {
    window.dispatchSyncEvent = (event: string, data: any) => {
      if (event === 'SYNC_UPDATED') {
        setActiveSyncs(data.activeSyncs || {});
      }
    };
  }, []);

  // Notificar cuando cambia activeSyncs
  useEffect(() => {
    console.log('🔔 SyncContext - activeSyncs changed:', {
      activeSyncsKeys: Object.keys(activeSyncs),
      isSyncing,
      activeSyncsData: activeSyncs,
    });
    window.dispatchEvent(new CustomEvent('sync-context-updated', {
      detail: { activeSyncs, isSyncing }
    }));
  }, [activeSyncs, isSyncing]);

  const getSyncProgress = useCallback((platform: DeliveryPlatform): SyncProgress | undefined => {
    return activeSyncs[platform];
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
          const { [platform]: _, ...rest } = prev;
          return rest;
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
              const { [platform]: _, ...rest } = prev;
              return rest;
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
          console.log(`🔄 SyncContext - Updating activeSyncs for ${platform}:`, {
            currentKeys: Object.keys(activeSyncs),
            newProgress: result.progress,
          });
          setActiveSyncs(prev => {
            const newSyncs = {
              ...prev,
              [platform]: result.progress!,
            };
            console.log(`🔄 SyncContext - After setActiveSyncs for ${platform}:`, {
              prevKeys: Object.keys(prev),
              newKeys: Object.keys(newSyncs),
            });
            return newSyncs;
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
    if (activeSyncs[platform] || startingSyncsRef.current.has(platform)) {
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
    console.log('🔍 SyncContext - checkForActiveSyncs running...');
    const checkForActiveSyncs = async () => {
      // Solo verificar syncs si el usuario está autenticado
      const hasToken = !!localStorage.getItem('auth_token');
      console.log('🔍 SyncContext - Has auth token:', hasToken);
      if (!hasToken) {
        return;
      }

      // Obtener usuario actual para saber qué plataformas verificar
      const storedUser = localStorage.getItem('auth_user');
      console.log('🔍 SyncContext - Stored user:', storedUser ? 'found' : 'not found');
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
      console.log('🔍 SyncContext - User platforms to check:', userPlatforms);

      if (userPlatforms.length === 0) {
        console.log('🔍 SyncContext - No user platforms found, skipping');
        return;
      }

      for (const platform of userPlatforms) {
        try {
          console.log(`🔍 SyncContext - Checking ${platform}...`);
          const result = await platformIntegrationsService.getSyncProgress(platform);
          console.log(`🔍 SyncContext - ${platform} result:`, result);

          if (result.status === 'in_progress' && result.progress) {
            console.log(`✅ Sync active for ${platform}: step ${result.progress.currentStep}/${result.progress.totalSteps}`);
            if (isMountedRef.current) {
              console.log(`✅ SyncContext - Adding ${platform} to activeSyncs`);
              setActiveSyncs(prev => {
                const newSyncs = {
                  ...prev,
                  [platform]: result.progress!,
                };
                console.log(`✅ SyncContext - After adding ${platform}:`, {
                  prevKeys: Object.keys(prev),
                  newKeys: Object.keys(newSyncs),
                });
                return newSyncs;
              });
              startPolling(platform);
            }
          }
        } catch (error) {
          console.error(`❌ Error checking ${platform}:`, error);
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
  console.log('🎣 useSyncContext - Called:', {
    activeSyncsKeys: Object.keys(context.activeSyncs),
    isSyncing: context.isSyncing,
  });
  return context;
}
