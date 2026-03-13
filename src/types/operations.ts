export interface OperationsMetrics {
  ordersToday: number;
  ordersCancelled: number;
  ordersRejected: number;
  delayedOrdersPct: number;
  avgPrepTime: number | null;
  orderAcceptanceTime: number | null;
  cancellationReasons: CancellationReason[];
}

export interface CancellationReason {
  reason: string;
  count: number;
  percentage?: number;
}

export interface OperationsResponse {
  period: {
    start: string;
    end: string;
  };
  metrics: OperationsMetrics;
}
