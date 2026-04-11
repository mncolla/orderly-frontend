import { api } from './api';
import type {
  StoreConfig,
  StoreConfigWithSource,
  StoreConfigCreateRequest,
  StoreConfigUpdateRequest,
  StoreConfigResetRequest,
} from '../types/integrations';

export interface StoreItem {
  id: string;
  price: number;
  active: boolean;
  itemId: string;
  storeId: string;
  item: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    categoryId: string;
    category?: {
      id: string;
      name: string;
    };
  };
}

export interface ItemOptionValue {
  id: string;
  externalId: string;
  optionId: string;
  name: string;
  position: number;
  unitPrice: number;
  available: boolean;
  availabilityStatus?: string;
}

export interface ItemOption {
  id: string;
  externalId: string;
  storeId: string;
  name: string;
  type: 'CHOICES' | 'BUNDLE_SECTION';
  position: number;
  minQuantity: number;
  maxQuantity: number | null;
  lastSyncAt: string | null;
  values: ItemOptionValue[];
  itemRelations?: Array<{
    item?: {
      id: string;
      externalId: string;
      name: string;
      description: string;
      imageUrl: string;
      categoryId: string;
    };
  }>;
}

export interface Store {
  id: string;
  name: string;
  chainName: string;
  city: string | null;
  country: string | null;
  platform?: string;
  vendorGroupId?: string | null;
  storeItems: StoreItem[];
  storeCategories: Array<{
    id: string;
    categoryId: string;
    category: {
      id: string;
      name: string;
      items: Array<{
        id: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
      }>;
    };
  }>;
  _count: {
    orders: number;
    storeItems: number;
    storeCategories: number;
  };
}

export const storesService = {
  /**
   * GET /api/stores
   * Listar tiendas del usuario
   */
  list: async (): Promise<{ stores: Store[]; count: number }> => {
    const response = await api.get('/stores');
    return response as { stores: Store[]; count: number };
  },

  /**
   * GET /api/stores/:id
   * Obtener detalle de una tienda con items y categorías
   */
  getById: async (storeId: string): Promise<{ store: Store }> => {
    const response = await api.get(`/stores/${storeId}`);
    return response as { store: Store };
  },

  /**
   * GET /api/stores/:storeId/options
   * Obtener todas las opciones de items de una tienda
   */
  getOptions: async (storeId: string): Promise<{ storeId: string; options: ItemOption[]; count: number }> => {
    const response = await api.get(`/stores/${storeId}/options`);
    return response as { storeId: string; options: ItemOption[]; count: number };
  },

  // Store Configuration Methods

  /**
   * GET /api/stores/:storeId/config
   * Get store's effective configuration (store config or user default)
   */
  getConfig: async (storeId: string): Promise<StoreConfigWithSource> => {
    const response = await api.get(`/stores/${storeId}/config`);
    return response as StoreConfigWithSource;
  },

  /**
   * GET /api/stores/:storeId/config/default
   * Get user default configuration for a store
   */
  getDefaultConfig: async (storeId: string): Promise<{ config: StoreConfig }> => {
    const response = await api.get(`/stores/${storeId}/config/default`);
    return response as { config: StoreConfig };
  },

  /**
   * POST /api/stores/:storeId/config
   * Create store-specific configuration
   */
  createConfig: async (
    storeId: string,
    data: StoreConfigCreateRequest
  ): Promise<StoreConfig> => {
    const response = await api.post(`/stores/${storeId}/config`, data);
    return response as StoreConfig;
  },

  /**
   * PATCH /api/stores/:storeId/config
   * Update existing store configuration
   */
  updateConfig: async (
    storeId: string,
    data: StoreConfigUpdateRequest
  ): Promise<StoreConfig> => {
    const response = await api.patch(`/stores/${storeId}/config`, data);
    return response as StoreConfig;
  },

  /**
   * DELETE /api/stores/:storeId/config
   * Remove store configuration, revert to user default
   */
  deleteConfig: async (storeId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/stores/${storeId}/config`);
    return response as { message: string };
  },

  /**
   * PATCH /api/stores/:storeId/config/reset
   * Reset specific fields to user default
   */
  resetConfigFields: async (
    storeId: string,
    data: StoreConfigResetRequest
  ): Promise<StoreConfig> => {
    const response = await api.patch(`/stores/${storeId}/config/reset`, data);
    return response as StoreConfig;
  },

  // Agency methods for managing client stores

  /**
   * GET /api/users/:userId/stores/:storeId/config
   * Agency: Get client's store configuration
   */
  getAgencyStoreConfig: async (
    userId: string,
    storeId: string
  ): Promise<StoreConfigWithSource> => {
    const response = await api.get(`/users/${userId}/stores/${storeId}/config`);
    return response as StoreConfigWithSource;
  },

  /**
   * PATCH /api/users/:userId/stores/:storeId/config
   * Agency: Update client's store configuration
   */
  updateAgencyStoreConfig: async (
    userId: string,
    storeId: string,
    data: StoreConfigUpdateRequest
  ): Promise<StoreConfig> => {
    const response = await api.patch(`/users/${userId}/stores/${storeId}/config`, data);
    return response as StoreConfig;
  },
};
