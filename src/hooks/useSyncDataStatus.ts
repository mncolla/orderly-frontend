import { useSyncStore } from '@/stores/syncStore';
import { useAuth } from '@/contexts/AuthContext';

export type DataType = 'stores' | 'menu' | 'orders';

export interface SyncDataStatus {
  stores: { available: boolean; loading: boolean; completed: boolean };
  menu: { available: boolean; loading: boolean; completed: boolean };
  orders: { available: boolean; loading: boolean; completed: boolean };
  isAnySyncing: boolean;
  syncingSteps: DataType[];
}

/**
 * Hook para determinar qué datos están disponibles basado en el estado del sync
 */
export function useSyncDataStatus(): SyncDataStatus {
  const { activeSyncs } = useSyncStore();
  const { user } = useAuth();

  const status: SyncDataStatus = {
    stores: { available: false, loading: false, completed: false },
    menu: { available: false, loading: false, completed: false },
    orders: { available: false, loading: false, completed: false },
    isAnySyncing: false,
    syncingSteps: [],
  };

  // Verificar si el usuario tiene integraciones conectadas
  const hasConnectedIntegrations = user?.integrations?.some(int => int.connected) || false;

  console.log('📊 SyncDataStatus calculation:', {
    hasConnectedIntegrations,
    activeSyncsCount: Object.keys(activeSyncs).length,
    activeSyncs: Object.entries(activeSyncs),
  });

  // Si no hay integraciones conectadas, todos los datos están no disponibles
  if (!hasConnectedIntegrations) {
    console.log('📊 No connected integrations, returning initial status');
    return status;
  }

  // Iterar sobre todos los syncs activos
  for (const [_platform, progress] of Object.entries(activeSyncs)) {
    status.isAnySyncing = true;

    console.log(`📊 Processing sync for ${_platform}, steps:`, progress.steps);

    // Analizar cada paso del sync
    progress.steps.forEach((step) => {
      switch (step.step) {
        case 'stores':
          if (step.status === 'in_progress') {
            status.stores.loading = true;
            status.syncingSteps.push('stores');
            console.log('📊 stores loading = true');
          } else if (step.status === 'completed') {
            status.stores.completed = true;
            status.stores.available = true;
            console.log('📊 stores completed = true, available = true');
          }
          break;

        case 'menu':
          if (step.status === 'in_progress') {
            status.menu.loading = true;
            status.syncingSteps.push('menu');
            console.log('📊 menu loading = true');
          } else if (step.status === 'completed') {
            status.menu.completed = true;
            status.menu.available = true;
            console.log('📊 menu completed = true, available = true');
          }
          break;

        case 'orders':
          if (step.status === 'in_progress') {
            status.orders.loading = true;
            status.syncingSteps.push('orders');
            console.log('📊 orders loading = true');
          } else if (step.status === 'completed') {
            status.orders.completed = true;
            status.orders.available = true;
            console.log('📊 orders completed = true, available = true');
          }
          break;
      }
    });
  }

  // Si no hay sync activo pero hay integraciones conectadas, asumimos que todos los datos están disponibles
  // (el usuario ya pasó por onboarding y tiene datos)
  if (!status.isAnySyncing) {
    status.stores.available = true;
    status.menu.available = true;
    status.orders.available = true;
    status.stores.completed = true;
    status.menu.completed = true;
    status.orders.completed = true;
    console.log('📊 No active sync, all data available');
  }

  console.log('📊 Final status:', {
    isAnySyncing: status.isAnySyncing,
    syncingSteps: status.syncingSteps,
    orders: status.orders,
    menu: status.menu,
    stores: status.stores,
  });

  return status;
}
