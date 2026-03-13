export type SuggestionType = 'ITEM_OPTIMIZATION' | 'MENU_ACTIVATION' | 'PRICE_ADJUSTMENT' | 'PROMOTION';
export type SuggestionStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED';

export interface MetricSnapshot {
  totalSales: number;
  orderCount: number;
  avgTicket: number;
  cancelledCount: number;
  cancellationRate: number;
  storeBreakdown?: Record<string, {
    totalSales: number;
    orderCount: number;
  }>;
}

export interface ItemSnapshot {
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  reason: string;
}

export interface SuggestionItem {
  id: string;
  item: {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    price: number;
  };
  itemSnapshot?: ItemSnapshot;
}

export interface Suggestion {
  id: string;
  type: SuggestionType;
  status: SuggestionStatus;
  title: string;
  description: string;
  metricsBefore?: MetricSnapshot;
  metricsAfter?: MetricSnapshot;
  items: SuggestionItem[];
  measurementStart?: Date;
  measurementEnd?: Date;
  measurementDays?: number;
  autoApply: boolean;
  potentialImpact?: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  organization?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
  total: number;
  stats: {
    pending: number;
    accepted: number;
    completed: number;
    rejected: number;
  };
}
