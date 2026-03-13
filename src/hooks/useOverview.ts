import { useQuery } from '@tanstack/react-query';
import { overviewService } from '../services/overviewService';

export const overviewKeys = {
  all: ['overview'] as const,
  detail: (params?: Record<string, string>) => [...overviewKeys.all, params] as const,
};

export function useOverview(params?: { organizationId?: string; storeId?: string; platform?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: overviewKeys.detail(params),
    queryFn: () => overviewService.getOverview(params),
  });
}
