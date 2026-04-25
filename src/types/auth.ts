// Tipos de autenticación que coinciden exactamente con el backend

export type UserRole = 'OWNER' | 'AGENCY' | 'ADMIN';

export type AccountType = 'FREE' | 'PRO' | 'ENTERPRISE';

export type SyncStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  accountType: AccountType;
  integrations?: Array<{
    id: string;
    platform: string;
    connected: boolean;
    email?: string;
    lastSyncAt?: string | null;
    lastSyncStatus?: SyncStatus;
    lastSyncCompletedAt?: string | null;
    lastSyncStartedAt?: string | null;
    lastSyncError?: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  role?: UserRole; // Opcional, default: OWNER
}

// Respuesta del backend
export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface AuthMeResponse {
  user: User;
}
