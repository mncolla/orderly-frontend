export interface OverviewPeriod {
  start: string;
  end: string;
}

export interface OverviewKPI {
  current: number;
  previous: number;
  change: number;
  formatted?: string;
}

export interface OverviewKPIs {
  revenue: OverviewKPI;
  orders: OverviewKPI;
  avgTicket: OverviewKPI;
  cancelRate: OverviewKPI;
  avgPrepTime: { current: number; formatted: string };
}

export interface OverviewDailyData {
  date: string;
  revenue: number;
  orders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface OverviewChart {
  daily: OverviewDailyData[];
}

export interface PlatformDistribution {
  platform: string;
  revenue: number;
  orders: number;
  percentage: number;
}

export interface ItemsRanking {
  productName: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface OverviewAlert {
  type: 'suggestion' | 'warning' | 'weather';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metric?: string;
  currentValue?: number;
  previousValue?: number;
  createdAt?: string;
}

export interface OverviewResponse {
  period: OverviewPeriod;
  kpis: OverviewKPIs;
  chart: OverviewChart;
  platformDistribution: PlatformDistribution[];
  itemsRanking?: ItemsRanking[];
  alerts: OverviewAlert[];
}
