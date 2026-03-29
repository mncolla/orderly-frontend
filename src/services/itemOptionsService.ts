import { api } from './api';

export interface ItemOptionValue {
  id: string;
  externalId: string;
  optionId: string;
  name: string;
  position: number;
  unitPrice: number;
  available: boolean;
  availabilityStatus?: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
  values: ItemOptionValue[];
}

export interface ItemOptionsResponse {
  storeId: string;
  options: ItemOption[];
  count: number;
}

export interface ItemOptionDetailResponse {
  storeId: string;
  option: ItemOption & {
    itemRelations?: Array<{
      id: string;
      item: {
        id: string;
        externalId: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
      };
    }>;
  };
}

export const itemOptionsService = {
  /**
   * Obtener todas las opciones de un store
   */
  async getOptions(storeId: string): Promise<ItemOptionsResponse> {
    return api.get<ItemOptionsResponse>(`/stores/${storeId}/options`);
  },

  /**
   * Obtener detalle de una opción específica con sus valores e items relacionados
   */
  async getOptionDetail(storeId: string, optionId: string): Promise<ItemOptionDetailResponse> {
    return api.get<ItemOptionDetailResponse>(`/stores/${storeId}/options/${optionId}`);
  },
};
