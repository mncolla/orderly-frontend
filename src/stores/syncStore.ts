import { create } from 'zustand';
import type { DeliveryPlatform } from '@/types/integrations';
import type { SyncProgress } from '@/services/platformIntegrationsService';

interface SyncState {
  activeSyncs: Record<string, SyncProgress>;
  isSyncing: boolean;

  // Actions
  setActiveSyncs: (syncs: Record<string, SyncProgress>) => void;
  updateSyncProgress: (platform: string, progress: SyncProgress) => void;
  clearSync: (platform: string) => void;
  clearAllSyncs: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  activeSyncs: {},
  isSyncing: false,

  setActiveSyncs: (syncs) => {
    const isSyncing = Object.keys(syncs).length > 0;
    console.log('🔄 SyncStore - setActiveSyncs:', {
      syncs,
      isSyncing,
      keys: Object.keys(syncs),
      timestamp: new Date().toISOString(),
    });
    set({ activeSyncs: syncs, isSyncing });
  },

  updateSyncProgress: (platform, progress) => {
    console.log('🔄 SyncStore - updateSyncProgress START:', {
      platform,
      progress,
      timestamp: new Date().toISOString(),
    });
    set((state) => {
      const newSyncs = {
        ...state.activeSyncs,
        [platform]: progress,
      };
      const isSyncing = Object.keys(newSyncs).length > 0;
      console.log('🔄 SyncStore - updateSyncProgress COMMIT:', {
        platform,
        progress,
        newSyncs,
        isSyncing,
        timestamp: new Date().toISOString(),
      });
      return { activeSyncs: newSyncs, isSyncing };
    });
  },

  clearSync: (platform) => {
    set((state) => {
      const newSyncs = { ...state.activeSyncs };
      delete newSyncs[platform];
      const isSyncing = Object.keys(newSyncs).length > 0;
      console.log('🔄 SyncStore - clearSync:', {
        platform,
        remainingSyncs: Object.keys(newSyncs),
        isSyncing,
      });
      return { activeSyncs: newSyncs, isSyncing };
    });
  },

  clearAllSyncs: () => {
    console.log('🔄 SyncStore - clearAllSyncs');
    set({ activeSyncs: {}, isSyncing: false });
  },
}));

// Selector helpers
export const useSyncProgress = (platform: DeliveryPlatform) =>
  useSyncStore((state) => state.activeSyncs[platform]);

export const useIsSyncing = () =>
  useSyncStore((state) => state.isSyncing);
