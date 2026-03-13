import { useQuery } from '@tanstack/react-query';
import { operationsService, type OperationsPeriod } from '../services/operationsService';

export const operationsKeys = {
  all: ['operations'] as const,
  detail: (params?: Record<string, string | OperationsPeriod>) => [...operationsKeys.all, params] as const,
};

export function useOperations(params?: {
  organizationId?: string;
  storeId?: string;
  platform?: string;
  period?: OperationsPeriod;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: operationsKeys.detail(params),
    queryFn: () => operationsService.getOperations(params),
  });
}
