import { api } from './api';
import type {
  DeliveryStatusResponse,
  PedidosYaConnectRequest,
  PedidosYaConnectResponse,
  VerifyOTPRequest,
  SyncResponse,
  DeliveryPlatform,
} from '../types/integrations';

export const integrationsService = {
  getStatus: async (): Promise<DeliveryStatusResponse> => {
    const response = await api.get('/delivery/status');
    return response as DeliveryStatusResponse;
  },

  connectPedidosYa: async (data: PedidosYaConnectRequest): Promise<PedidosYaConnectResponse> => {
    const response = await api.post('/organizations/delivery/PEDIDOS_YA/connect', data);
    return response as PedidosYaConnectResponse;
  },

  verifyOTP: async (data: VerifyOTPRequest): Promise<PedidosYaConnectResponse> => {
    const response = await api.post('/organizations/delivery/PEDIDOS_YA/verify-otp', data);
    return response as PedidosYaConnectResponse;
  },

  sync: async (platform: DeliveryPlatform): Promise<SyncResponse> => {
    const response = await api.post(`/delivery/sync?platform=${platform}`);
    return response as SyncResponse;
  },

  disconnect: async (platform: DeliveryPlatform) => {
    const response = await api.delete(`/delivery/disconnect?platform=${platform}`);
    return response;
  }
};
