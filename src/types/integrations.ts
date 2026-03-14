export type DeliveryPlatform = 'PEDIDOS_YA' | 'RAPPI' | 'GLOVO' | 'UBER_EATS';

export interface DeliveryConnection {
  id: string;
  platform: DeliveryPlatform;
  connected: boolean;
  email: string;
  connectedAt: string;
  lastValidatedAt: string;
  organization: {
    id: string;
    name: string;
    country: string;
  };
}

export interface DeliveryStatusResponse {
  connections: DeliveryConnection[];
}

export interface PedidosYaConnectRequest {
  email: string;
  password: string;
  otpCode?: string; // Optional OTP code for verification
}

export interface PedidosYaCredential {
  id: string;
  platform: 'PEDIDOS_YA';
  email: string;
  connected: boolean;
  connectedAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  chainName: string;
  status: string;
}

export interface OrganizationInfo {
  id: string;
  name: string;
  country: string;
  created: true;
}

export interface PedidosYaConnectResponse {
  message: string;
  organization?: OrganizationInfo;
  credential: PedidosYaCredential;
  restaurants?: Restaurant[];
  needsOTP?: boolean;
  tempToken?: string;
}

export interface VerifyOTPRequest {
  email: string;
  password: string;
  otp: string;
}

export interface SyncHistory {
  id?: string;
  organizationId: string;
  platform: string;
  status: 'COMPLETED' | 'FAILED';
  storesCreated?: number;
  storesUpdated?: number;
  completedAt?: string;
  error?: string;
}

export interface SyncResponse {
  message: string;
  results: {
    pedidosya?: { stores: number; organizationId: string };
    rappi?: { stores: number; organizationId: string };
    glovo?: { stores: number; organizationId: string };
    uberEats?: { stores: number; organizationId: string };
  };
  syncHistory: SyncHistory[];
}

