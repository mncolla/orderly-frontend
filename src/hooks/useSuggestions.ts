import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suggestionsService } from '../services/suggestionsService';
import type { SuggestionType, SuggestionStatus } from '../types/suggestions';

export const suggestionsKeys = {
  all: ['suggestions'] as const,
  lists: () => [...suggestionsKeys.all, 'list'] as const,
  list: (params?: Record<string, string | SuggestionType | SuggestionStatus>) => [...suggestionsKeys.lists(), params] as const,
  details: () => [...suggestionsKeys.all, 'detail'] as const,
  detail: (id: string) => [...suggestionsKeys.details(), id] as const,
};

export function useSuggestions(params?: {
  organizationId?: string;
  status?: SuggestionStatus;
  type?: SuggestionType;
}) {
  return useQuery({
    queryKey: suggestionsKeys.list(params),
    queryFn: () => suggestionsService.getSuggestions(params),
  });
}

export function useSuggestion(id: string) {
  return useQuery({
    queryKey: suggestionsKeys.detail(id),
    queryFn: () => suggestionsService.getSuggestion(id),
    enabled: !!id,
  });
}

export function useApplySuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => suggestionsService.applySuggestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suggestionsKeys.lists() });
    },
  });
}

export function useDismissSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => suggestionsService.dismissSuggestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suggestionsKeys.lists() });
    },
  });
}

export function useCompleteSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => suggestionsService.completeSuggestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suggestionsKeys.lists() });
    },
  });
}

export function useCreateSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      organizationId: string;
      type: string;
      title: string;
      description: string;
      context?: string;
      conditions?: any;
      itemIds?: string[];
      autoApply?: boolean;
    }) => suggestionsService.createSuggestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suggestionsKeys.all });
    },
  });
}

export function useAnalyzeSuggestions() {
  return useMutation({
    mutationFn: (organizationId: string) => suggestionsService.analyzeOrganization(organizationId),
  });
}
