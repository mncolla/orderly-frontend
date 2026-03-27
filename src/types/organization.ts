// Organization Settings Types

export interface OrganizationCosts {
  platformCommission: number; // % de comisión de la plataforma
  markup: number; // % de markup
  fixedCosts: number; // Costos fijos mensuales
  variableCosts?: number; // Costos variables (packaging, etc.)
  costOfGoods?: number; // Costo de goods (% o monto)
}

export const ObjectiveType = {
  INCREASE_SALES_VOLUME: 'INCREASE_SALES_VOLUME',
  INCREASE_AVG_TICKET: 'INCREASE_AVG_TICKET',
  REDUCE_CANCELLATION_RATE: 'REDUCE_CANCELLATION_RATE',
  IMPROVE_PREP_TIME: 'IMPROVE_PREP_TIME',
  ACTIVATE_SPECIAL_MENU: 'ACTIVATE_SPECIAL_MENU',
  OPTIMIZE_ITEMS: 'OPTIMIZE_ITEMS',
} as const;

export type ObjectiveType = (typeof ObjectiveType)[keyof typeof ObjectiveType];

export const ObjectiveUnit = {
  PERCENTAGE: 'PERCENTAGE',
  CURRENCY: 'CURRENCY',
  MINUTES: 'MINUTES',
  BOOLEAN: 'BOOLEAN',
} as const;

export type ObjectiveUnit = (typeof ObjectiveUnit)[keyof typeof ObjectiveUnit];

export interface OrganizationObjective {
  type: ObjectiveType;
  target: number;
  currentValue?: number;
  unit: ObjectiveUnit;
  description?: string;
}

export interface OrganizationSettings {
  costs: OrganizationCosts;
  objectives: OrganizationObjective[];
}

export interface OrganizationOwner {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'AGENCY' | 'ADMIN';
}

export interface OrganizationStore {
  id: string;
  name: string;
  platform: string;
  platformId: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    orders: number;
    items: number;
    categories: number;
  };
}

export interface Organization {
  id: string;
  name: string;
  country: string;
  ownerId: string;
  owner?: OrganizationOwner;
  settings?: OrganizationSettings;
  commissionRate?: number;
  markup?: number;
  fixedCosts?: number;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  stores?: OrganizationStore[];
  _count?: {
    stores: number;
    expenses: number;
    suggestions: number;
    orders?: number;
  };
}

export interface StoreConfigData {
  storeId: string;
  platformCommission?: number;
  markupPercentage?: number;
  fixedMonthlyCosts?: number;
  packagingCost?: number;
  deliveryCost?: number;
}

export interface OnboardingData {
  costs: OrganizationCosts;
  objectives: OrganizationObjective[];
  storeConfigs?: StoreConfigData[];
}

// Objective labels for UI
export const objectiveTypeLabels: Record<ObjectiveType, string> = {
  [ObjectiveType.INCREASE_SALES_VOLUME]: 'Aumentar volumen de ventas',
  [ObjectiveType.INCREASE_AVG_TICKET]: 'Aumentar ticket promedio',
  [ObjectiveType.REDUCE_CANCELLATION_RATE]: 'Bajar % de cancelación',
  [ObjectiveType.IMPROVE_PREP_TIME]: 'Mejorar tiempo de preparación',
  [ObjectiveType.ACTIVATE_SPECIAL_MENU]: 'Activar menú especial',
  [ObjectiveType.OPTIMIZE_ITEMS]: 'Optimizar items',
};

export const objectiveUnitLabels: Record<ObjectiveUnit, string> = {
  [ObjectiveUnit.PERCENTAGE]: '%',
  [ObjectiveUnit.CURRENCY]: '$',
  [ObjectiveUnit.MINUTES]: 'min',
  [ObjectiveUnit.BOOLEAN]: '',
};
