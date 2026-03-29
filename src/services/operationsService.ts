import { api } from './api';
import type { OperationsResponse } from '../types/operations';

export type OperationsPeriod = 'today' | 'last7days' | 'thisMonth';

export const operationsService = {
  /**
   * GET /api/operations
   *
   * Obtiene métricas operativas
   *
   * Query params:
   * - organizationId: Filter by organization
   * - storeId: Filter by store
   * - storeIds: Filter by multiple stores (comma-separated)
   * - platform: Filter by platform (PEDIDOS_YA, RAPPI, etc.)
   * - period: Preset (today, last7days, thisMonth)
   * - startDate: Start date override (has precedence over period)
   * - endDate: End date override (has precedence over period)
   *
   * Examples:
   * GET /api/operations?period=today
   * GET /api/operations?period=last7days
   * GET /api/operations?period=thisMonth
   * GET /api/operations?startDate=2025-03-01&endDate=2025-03-07
   */
  getOperations: async (params?: {
    organizationId?: string;
    storeId?: string;
    storeIds?: string[];
    platform?: string;
    period?: OperationsPeriod;
    startDate?: string;
    endDate?: string;
  }): Promise<OperationsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.organizationId) queryParams.set('organizationId', params.organizationId);
    if (params?.storeId) queryParams.set('storeId', params.storeId);
    if (params?.storeIds && params.storeIds.length > 0) queryParams.set('storeIds', params.storeIds.join(','));
    if (params?.platform) queryParams.set('platform', params.platform);

    // Period presets (si no hay override con fechas específicas)
    if (params?.period && !params?.startDate && !params?.endDate) {
      queryParams.set('period', params.period);
    }

    // Override con fechas específicas (tiene precedencia sobre period)
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);

    const response = await api.get(`/operations?${queryParams.toString()}`);
    return response as OperationsResponse;
  }
};
