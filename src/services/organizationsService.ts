import { api } from './api';
import type { Organization, OnboardingData, OrganizationSettings } from '../types/organization';

export const organizationsService = {
  /**
   * POST /api/organizations/:orgId/onboarding
   * Completar onboarding de una organización
   */
  completeOnboarding: async (organizationId: string, data: OnboardingData): Promise<{ message: string; organization: Organization }> => {
    const response = await api.post(`/organizations/${organizationId}/onboarding`, data);
    return response as { message: string; organization: Organization };
  },

  /**
   * PATCH /api/organizations/:orgId/settings
   * Actualizar configuración de una organización
   */
  updateSettings: async (organizationId: string, settings: OrganizationSettings): Promise<{ message: string; organization: Organization }> => {
    const response = await api.patch(`/organizations/${organizationId}/settings`, settings);
    return response as { message: string; organization: Organization };
  },

  /**
   * GET /api/organizations/:id
   * Obtener detalle de una organización
   */
  getById: async (organizationId: string): Promise<{ organization: Organization }> => {
    const response = await api.get(`/organizations/${organizationId}`);
    return response as { organization: Organization };
  },

  /**
   * GET /api/organizations
   * Listar organizaciones (para agencias)
   */
  list: async (filters?: { country?: string }): Promise<{ organizations: Organization[]; count: number }> => {
    const params = new URLSearchParams();
    if (filters?.country) {
      params.append('country', filters.country);
    }

    const url = params.toString() ? `/organizations?${params}` : '/organizations';
    const response = await api.get(url);
    return response as { organizations: Organization[]; count: number };
  },
};
