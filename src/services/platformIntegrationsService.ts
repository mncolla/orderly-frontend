import { api } from './api';
import type { OnboardingData } from '../types/organization';

export interface PlatformIntegration {
  id: string;
  platform: string;
  email: string;
  connected: boolean;
  connectedAt: string | null;
  lastSyncAt: string | null;
  ownerId: string;
  stores?: Array<{
    id: string;
    name: string;
    chainName: string;
    city: string | null;
    country: string | null;
  }>;
}

export const platformIntegrationsService = {
  /**
   * POST /api/platform-integrations/:id/onboarding
   * Completar onboarding de una integración de plataforma
   */
  completeOnboarding: async (integrationId: string, data: OnboardingData): Promise<{ message: string }> => {
    const response = await api.post(`/platform-integrations/${integrationId}/onboarding`, data);
    return response as { message: string };
  },

  /**
   * GET /api/platform-integrations
   * Listar integraciones del usuario actual
   */
  list: async (): Promise<{ integrations: PlatformIntegration[]; count: number }> => {
    const response = await api.get('/platform-integrations');
    return response as { integrations: PlatformIntegration[]; count: number };
  },

  /**
   * GET /api/platform-integrations/:id
   * Obtener detalle de una integración
   */
  getById: async (integrationId: string): Promise<{ integration: PlatformIntegration }> => {
    const response = await api.get(`/platform-integrations/${integrationId}`);
    return response as { integration: PlatformIntegration };
  },
};
