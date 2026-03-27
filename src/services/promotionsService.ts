import { api } from './api';

/**
 * Tipos de descuento para promociones
 */
export type DiscountType = 'PERCENTAGE' | 'FIXED';

/**
 * Ubicaciones para productos destacados
 */
export type PlacementType = 'HOMEPAGE_BANNER' | 'CATEGORY_TOP' | 'SEARCH_RESULTS';

/**
 * Tipos de campañas
 */
export type CampaignType = 'flash' | 'bundle' | 'featured';

/**
 * Parámetros para crear descuento fugaz
 */
export interface FlashDiscountParams {
  itemIds: string[];
  discount: {
    type: DiscountType;
    value: number;
  };
  schedule: {
    start: string; // ISO datetime
    end: string;   // ISO datetime
  };
  minOrderValue?: number;
  maxDiscountAmount?: number;
}

/**
 * Parámetros para crear menú completo
 */
export interface CompleteMenuParams {
  name: string;
  bundleItems: {
    main: string[];
    drink: string[];
    side?: string[];
  };
  bundlePrice: number;
  schedule?: {
    start: string;
    end: string;
  };
}

/**
 * Parámetros para crear productos destacados
 */
export interface FeaturedProductsParams {
  itemIds: string[];
  placement: PlacementType;
  priority?: number;
  schedule?: {
    start: string;
    end: string;
  };
}

/**
 * Respuesta de creación de campaña
 */
export interface CampaignResponse {
  success: boolean;
  campaignId?: string;
  bundleId?: string;
  promotionId?: string;
  message?: string;
  error?: string;
}

/**
 * Respuesta de listado de campañas
 */
export interface CampaignsResponse {
  campaigns: Array<{
    id: string;
    type: string;
    name: string;
    status: string;
    startTime: string;
    endTime: string;
  }>;
}

/**
 * Promociones Service
 *
 * Servicios para crear y gestionar promociones en plataformas de delivery
 */
export const promotionsService = {
  /**
   * Crear un descuento fugaz (Flash Discount)
   */
  createFlashDiscount: async (
    storeId: string,
    params: FlashDiscountParams
  ): Promise<CampaignResponse> => {
    const response = await api.post(`/stores/${storeId}/promotions/flash-discount`, params);
    return response as CampaignResponse;
  },

  /**
   * Crear un menú completo (Bundle)
   */
  createCompleteMenu: async (
    storeId: string,
    params: CompleteMenuParams
  ): Promise<CampaignResponse> => {
    const response = await api.post(`/stores/${storeId}/promotions/complete-menu`, params);
    return response as CampaignResponse;
  },

  /**
   * Crear productos destacados
   */
  createFeaturedProducts: async (
    storeId: string,
    params: FeaturedProductsParams
  ): Promise<CampaignResponse> => {
    const response = await api.post(`/stores/${storeId}/promotions/featured-products`, params);
    return response as CampaignResponse;
  },

  /**
   * Listar campañas activas
   */
  getActiveCampaigns: async (storeId: string): Promise<CampaignsResponse> => {
    const response = await api.get(`/stores/${storeId}/promotions/active`);
    return response as CampaignsResponse;
  },

  /**
   * Desactivar una campaña
   */
  deactivateCampaign: async (
    storeId: string,
    campaignId: string,
    campaignType: CampaignType
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const response = await api.patch(
      `/stores/${storeId}/promotions/${campaignId}/deactivate`,
      { campaignType }
    );
    return response as { success: boolean; message?: string; error?: string };
  },
};
