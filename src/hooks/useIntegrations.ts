import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { integrationsService } from '../services/integrationsService';

const integrationsKeys = {
  all: ['integrations'] as const,
  status: ['integrations', 'status'] as const,
};

export function useIntegrationStatus() {
  return useQuery({
    queryKey: integrationsKeys.status,
    queryFn: () => integrationsService.getStatus(),
  });
}

export function useConnectPedidosYa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      integrationsService.connectPedidosYa(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.status });
    },
  });
}

export function useVerifyOTP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; password: string; otp: string }) =>
      integrationsService.verifyOTP(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.status });
    },
  });
}

export function useSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (platform: 'PEDIDOS_YA' | 'RAPPI' | 'GLOVO' | 'UBER_EATS') =>
      integrationsService.sync(platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.status });
    },
  });
}

export function useDisconnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (platform: 'PEDIDOS_YA' | 'RAPPI' | 'GLOVO' | 'UBER_EATS') =>
      integrationsService.disconnect(platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.status });
    },
  });
}
