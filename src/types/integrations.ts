export type DeliveryPlatform = 'PEDIDOS_YA' | 'RAPPI' | 'GLOVO' | 'UBER_EATS';

export interface PlatformIntegration {
  id: string;
  platform: DeliveryPlatform;
  connected: boolean;
  email: string;
  connectedAt: string | null;
  lastSyncAt: string | null;
  ownerId: string;
  stores?: StoreInfo[];
}

export interface StoreInfo {
  id: string;
  name: string;
  chainName: string;
  city: string | null;
  country: string | null;
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
  integration?: PlatformIntegration;
  restaurants?: Restaurant[];
  needsOTP?: boolean;
  tempToken?: string;
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
