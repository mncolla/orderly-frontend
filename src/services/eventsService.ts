import { api } from './api';

export type EventType = 'CONCERT' | 'SPORTS_EVENT' | 'HOLIDAY';

export interface ExternalEvent {
  id: string;
  type: EventType;
  title: string;
  country: string;
  city: string | null;
  startDate: string;
  endDate: string | null;
  impactLevel: string;
  createdAt: string;
}

export const eventsService = {
  /**
   * GET /api/events
   * Get all upcoming events, optionally filtered by country and/or city
   */
  getAll: async (country?: string, city?: string): Promise<{ events: ExternalEvent[]; count: number }> => {
    const params = new URLSearchParams();
    if (country) params.append('country', country);
    if (city) params.append('city', city);

    const response = await api.get(`/events?${params.toString()}`) as { events: ExternalEvent[]; count: number };
    return response;
  },

  /**
   * GET /api/events/:id
   * Get event details by ID
   */
  getById: async (id: string): Promise<{ event: ExternalEvent }> => {
    const response = await api.get(`/events/${id}`) as { event: ExternalEvent };
    return response;
  },

  /**
   * POST /api/events
   * Create a new event (for testing/admin purposes)
   */
  create: async (data: {
    type: EventType;
    title: string;
    country: string;
    city?: string;
    startDate: Date;
    endDate?: Date;
    impactLevel: string;
  }): Promise<{ event: ExternalEvent }> => {
    const response = await api.post('/events', data) as { event: ExternalEvent };
    return response;
  },
};
