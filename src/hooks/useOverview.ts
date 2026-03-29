import { useQuery } from '@tanstack/react-query';
import { overviewService } from '../services/overviewService';

export const overviewKeys = {
  all: ['overview'] as const,
  detail: (params?: Record<string, string | string[]>) => [...overviewKeys.all, params] as const,
};

export function useOverview(params?: { organizationId?: string; storeId?: string; storeIds?: string[]; platform?: string; startDate?: string; endDate?: string }) {
  // Create a clean object without undefined values for query key
  const paramsForKey: Record<string, string> = {};
  if (params?.organizationId) paramsForKey.organizationId = params.organizationId;
  if (params?.storeId) paramsForKey.storeId = params.storeId;
  if (params?.storeIds) paramsForKey.storeIds = params.storeIds.join(',');
  if (params?.platform) paramsForKey.platform = params.platform;
  if (params?.startDate) paramsForKey.startDate = params.startDate;
  if (params?.endDate) paramsForKey.endDate = params.endDate;

  return useQuery({
    queryKey: overviewKeys.detail(Object.keys(paramsForKey).length > 0 ? paramsForKey : undefined),
    queryFn: () => overviewService.getOverview(params),
  });
}
