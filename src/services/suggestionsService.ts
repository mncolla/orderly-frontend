import { api } from './api';
import type { SuggestionsResponse, Suggestion } from '../types/suggestions';

export const suggestionsService = {
  /**
   * GET /api/suggestions
   *
   * Lista sugerencias con filtros
   */
  getSuggestions: async (params?: {
    organizationId?: string;
    status?: string;
    type?: string;
  }): Promise<SuggestionsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.organizationId) queryParams.set('organizationId', params.organizationId);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.type) queryParams.set('type', params.type);

    const response = await api.get(`/suggestions?${queryParams.toString()}`);
    return response as SuggestionsResponse;
  },

  /**
   * GET /api/suggestions/:id
   *
   * Obtiene detalle de una sugerencia
   */
  getSuggestion: async (id: string): Promise<Suggestion> => {
    const response = await api.get(`/suggestions/${id}`);
    return response as Suggestion;
  },

  /**
   * POST /api/suggestions/:id/apply
   *
   * Aceptar sugerencia (OWNER)
   */
  applySuggestion: async (id: string): Promise<Suggestion> => {
    const response = await api.post(`/suggestions/${id}/apply`);
    return response as Suggestion;
  },

  /**
   * POST /api/suggestions/:id/dismiss
   *
   * Rechazar sugerencia (OWNER)
   */
  dismissSuggestion: async (id: string): Promise<Suggestion> => {
    const response = await api.post(`/suggestions/${id}/dismiss`);
    return response as Suggestion;
  },

  /**
   * POST /api/suggestions/:id/complete
   *
   * Completar medición (AGENCY)
   */
  completeSuggestion: async (id: string): Promise<Suggestion> => {
    const response = await api.post(`/suggestions/${id}/complete`);
    return response as Suggestion;
  },
};
