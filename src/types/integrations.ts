export type DeliveryPlatform = 'PEDIDOS_YA' | 'RAPPI' | 'GLOVO' | 'UBER_EATS';

export type SyncStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export type SuggestionType =
  // Generic types (work across all platforms)
  | 'PRICE_CHANGE'
  | 'ITEM_IMPROVEMENT'
  | 'TEMPORARY_DISABLE'
  | 'PROMOTION'
  // PedidosYa-specific types
  | 'PEDIDOS_YA_DESCUENTO_FUGAZ'
  | 'PEDIDOS_YA_MENU_COMPLETO'
  | 'PEDIDOS_YA_PRODUCTOS_DESTACADOS';

export interface SuggestionTypeConfig {
  value: SuggestionType;
  label: string;
  icon: any;
  description: string;
  platform?: DeliveryPlatform | null;  // null = works on all platforms
}

export interface PlatformIntegration {
  id: string;
  platform: DeliveryPlatform;
  connected: boolean;
  email: string;
  connectedAt: string | null;
  lastSyncAt: string | null;
  lastSyncStatus?: SyncStatus;
  lastSyncStartedAt?: string | null;
  lastSyncCompletedAt?: string | null;
  lastSyncError?: string | null;
  ownerId: string;
  stores?: StoreInfo[];
}

export interface StoreInfo {
  id: string;
  name: string;
  chainName: string;
  city: string | null;
  country: string | null;
  platform?: DeliveryPlatform;
  hasCustomConfig?: boolean; // Indicates if store has custom configuration
  configSource?: ConfigSource; // 'store' if has custom config, 'user' if using default
}

export interface StoreWithPlatform extends StoreInfo {
  platform?: DeliveryPlatform;
}

export interface DeliveryStatusResponse {
  connections: PlatformIntegration[];
}

export interface PedidosYaConnectRequest {
  email: string;
  password: string;
  otpCode?: string; // Optional OTP code for verification
}

export interface Restaurant {
  id: string;
  name: string;
  chainName: string;
  status: string;
}

export interface PedidosYaConnectResponse {
  message: string;
  platform?: string;
  integration?: PlatformIntegration & {
    stores?: StoreInfo[];
  };
  restaurants?: Restaurant[];
  needsOTP?: boolean;
  tempToken?: string;
  stores?: {
    total: number;
    byChainName: Record<string, number>;
  };
}

export interface VerifyOTPRequest {
  email: string;
  password: string;
  otp: string;
}

export interface SyncResponse {
  message: string;
  results: {
    platform: string;
    storesCreated: number;
    storesUpdated: number;
  }[];
}

// PedidosYa-specific action structures
export interface PedidosYaFlashDiscountAction {
  items: string[];
  discount: {
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
  };
  schedule: {
    start: string;
    end: string;
  };
  platformSpecific: {
    pedidosYa: {
      campaignType: 'flash';
      minOrderValue?: number;
      maxDiscountAmount?: number;
    };
  };
}

export interface PedidosYaMenuCompletoAction {
  bundleItems: {
    main: string[];
    drink: string[];
    side?: string[];
  };
  bundlePrice: number;
  platformSpecific: {
    pedidosYa: {
      campaignType: 'bundle';
      bundleName?: string;
    };
  };
}

export interface PedidosYaProductosDestacadosAction {
  items: string[];
  placement: 'HOMEPAGE_BANNER' | 'CATEGORY_TOP' | 'SEARCH_RESULTS';
  priority?: number;
  platformSpecific: {
    pedidosYa: {
      campaignType: 'featured';
      bannerType?: string;
      duration?: string;
    };
  };
}

//
// Store Configuration Types
//

export type ConfigSource = 'store' | 'user';

export interface StoreConfig {
  platformCommission: number | null;
  markupPercentage: number | null;
  costOfGoods: number | null;
  fixedMonthlyCosts: number | null;
  packagingCost: number | null;
  deliveryCost: number | null;
}

export interface StoreConfigWithSource {
  config: StoreConfig;
  source: ConfigSource;
}

export interface StoreConfigResponse {
  config: StoreConfig;
  source: ConfigSource;
}

export interface StoreConfigCreateRequest {
  platformCommission?: number;
  markupPercentage?: number;
  costOfGoods?: number;
  fixedMonthlyCosts?: number;
  packagingCost?: number;
  deliveryCost?: number;
}

export interface StoreConfigUpdateRequest {
  platformCommission?: number;
  markupPercentage?: number;
  costOfGoods?: number;
  fixedMonthlyCosts?: number;
  packagingCost?: number;
  deliveryCost?: number;
}

export interface StoreConfigResetRequest {
  fields: (keyof StoreConfig)[];
}
