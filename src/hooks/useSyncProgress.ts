import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { DeliveryPlatform } from '@/types/integrations';
import { useSyncContext } from '@/contexts/SyncContext';

interface UseSyncProgressOptions {
  onSyncComplete?: () => void;
  onSyncError?: (error: string) => void;
  showToast?: boolean;
}

/**
 * Hook para manejar el progreso de sincronización con un solo toast persistente
 * @param platform - Plataforma a sincronizar
 * @param options - Opciones de configuración
 */
export function useSyncProgress(platform: DeliveryPlatform, options: UseSyncProgressOptions = {}) {
  const {
    onSyncComplete,
    onSyncError,
    showToast = true,
  } = options;

  const syncContext = useSyncContext();
  const toastIdRef = useRef<string | number | undefined>(undefined);
  const syncCompleteRef = useRef<boolean>(false);

  const syncProgress = syncContext.getSyncProgress(platform);

  // Get toast ID for this platform
  const getToastId = () => `sync-${platform}`;

  // Update or create toast with current progress
  useEffect(() => {
    if (!syncProgress || !showToast) {
      return;
    }

    const toastId = getToastId();
    const currentStep = syncProgress.steps.find(s => s.status === 'in_progress');

    // Check if all steps are completed
    const allCompleted = syncProgress.steps.every(s => s.status === 'completed');

    if (allCompleted) {
      if (!syncCompleteRef.current) {
        syncCompleteRef.current = true;

        toast.success('¡Sincronización completada!', {
          id: toastId,
          description: 'Todos tus datos han sido sincronizados correctamente',
          duration: 5000,
        });

        onSyncComplete?.();

        // Reset after a delay
        setTimeout(() => {
          syncCompleteRef.current = false;
          toastIdRef.current = undefined;
        }, 5000);
      }
      return;
    }

    if (currentStep) {
      const stepName = currentStep.step === 'stores' ? 'Locales' :
                      currentStep.step === 'menu' ? 'Menú' :
                      'Órdenes';

      const percentage = Math.round((currentStep.progress / currentStep.total) * 100);

      // Create or update the toast (usar el mismo ID para actualizar)
      toast.info(`Sincronizando ${stepName} (${currentStep.progress}/${currentStep.total} - ${percentage}%)`, {
        id: toastId,
        duration: Infinity, // Mantenerlo abierto hasta que complete
      });
    }
  }, [syncProgress, showToast, platform, onSyncComplete]);

  const handleStartSync = async () => {
    try {
      syncCompleteRef.current = false;
      toastIdRef.current = undefined;

      const toastId = getToastId();
      toastIdRef.current = toast.loading('Iniciando sincronización...', {
        id: toastId,
        description: 'Un momento, por favor...',
      });

      await syncContext.startSync(platform);
    } catch (error: any) {
      const errorMessage = error.message || 'Error al iniciar la sincronización';
      toast.error(errorMessage, {
        id: getToastId(),
      });
      toastIdRef.current = undefined;
      onSyncError?.(errorMessage);
    }
  };

  return {
    isSyncing: syncContext.isSyncing && !!syncProgress,
    syncProgress,
    startSync: handleStartSync,
  };
}
