import { useQuery } from '@tanstack/react-query';
import { operationsService, type OperationsPeriod } from '../services/operationsService';

export const operationsKeys = {
  all: ['operations'] as const,
  detail: (params?: Record<string, string | OperationsPeriod | string[]>) => [...operationsKeys.all, params] as const,
};

export function useOperations(params?: {
  organizationId?: string;
  storeId?: string;
  storeIds?: string[];
  platform?: string;
  period?: OperationsPeriod;
  startDate?: string;
  endDate?: string;
}) {
  // Create a clean object without undefined values for query key
  const paramsForKey: Record<string, string | OperationsPeriod> = {};
  if (params?.organizationId) paramsForKey.organizationId = params.organizationId;
  if (params?.storeId) paramsForKey.storeId = params.storeId;
  if (params?.storeIds) paramsForKey.storeIds = params.storeIds.join(',');
  if (params?.platform) paramsForKey.platform = params.platform;
  if (params?.period) paramsForKey.period = params.period;
  if (params?.startDate) paramsForKey.startDate = params.startDate;
  if (params?.endDate) paramsForKey.endDate = params.endDate;

  return useQuery({
    queryKey: operationsKeys.detail(Object.keys(paramsForKey).length > 0 ? paramsForKey : undefined),
    queryFn: () => operationsService.getOperations(params),
  });
}
