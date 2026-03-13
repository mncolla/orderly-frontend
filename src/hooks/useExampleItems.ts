import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exampleService } from '../services/exampleService';
import type { ExampleItem } from '../services/exampleService';

export const exampleKeys = {
  all: ['examples'] as const,
  lists: () => [...exampleKeys.all, 'list'] as const,
  list: (filters?: string) => [...exampleKeys.lists(), { filters }] as const,
  details: () => [...exampleKeys.all, 'detail'] as const,
  detail: (id: string) => [...exampleKeys.details(), id] as const,
};

export function useExampleItems() {
  return useQuery({
    queryKey: exampleKeys.list(),
    queryFn: exampleService.getItems,
  });
}

export function useExampleItem(id: string) {
  return useQuery({
    queryKey: exampleKeys.detail(id),
    queryFn: () => exampleService.getItemById(id),
    enabled: !!id,
  });
}

export function useCreateExampleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: exampleService.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exampleKeys.lists() });
    },
  });
}

export function useUpdateExampleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExampleItem> }) =>
      exampleService.updateItem(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: exampleKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: exampleKeys.lists() });
    },
  });
}

export function useDeleteExampleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: exampleService.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exampleKeys.lists() });
    },
  });
}
