import { useQuery } from '@tanstack/react-query';
import { organizationsService } from '../services/organizationsService';

export const organizationsKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationsKeys.all, 'list'] as const,
  list: (filters?: { country?: string }) => [...organizationsKeys.lists(), filters] as const,
  detail: (id: string) => [...organizationsKeys.all, id] as const,
};

export function useOrganizations(filters?: { country?: string }) {
  return useQuery({
    queryKey: organizationsKeys.list(filters),
    queryFn: () => organizationsService.list(filters),
  });
}

export function useOrganization(organizationId: string) {
  return useQuery({
    queryKey: organizationsKeys.detail(organizationId),
    queryFn: () => organizationsService.getById(organizationId),
    enabled: !!organizationId,
  });
}
