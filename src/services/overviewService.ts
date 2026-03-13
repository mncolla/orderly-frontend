import { api } from './api';
import type { OverviewResponse } from '../types/overview';

export const overviewService = {
  getOverview: async (params?: { organizationId?: string; storeId?: string; platform?: string; startDate?: string; endDate?: string }): Promise<OverviewResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.organizationId) queryParams.set('organizationId', params.organizationId);
    if (params?.storeId) queryParams.set('storeId', params.storeId);
    if (params?.platform) queryParams.set('platform', params.platform);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);

    const response = await api.get(`/overview?${queryParams.toString()}`);
    return response as OverviewResponse;
  }
};
