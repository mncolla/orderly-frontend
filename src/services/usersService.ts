import { api } from './api';
import type { AccountType, UserRole } from '@/types/auth';

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accountType: AccountType;
  createdAt: string;
  _count: {
    integrations: number;
  };
}

export interface UserDetail extends UserListItem {
  updatedAt: string;
  integrations: Array<{
    id: string;
    platform: string;
    email: string;
    connected: boolean;
    connectedAt: string | null;
    lastSyncAt: string | null;
    _count: {
      stores: number;
    };
  }>;
  _count: {
    integrations: number;
    createdSuggestions: number;
  };
}

export const usersService = {
  /**
   * GET /api/users
   * List all users (AGENCY only)
   */
  list: async (): Promise<{ users: UserListItem[]; count: number }> => {
    const response = await api.get('/users') as { users: UserListItem[]; count: number };
    return response;
  },

  /**
   * GET /api/users/:id
   * Get user details (AGENCY only)
   */
  getById: async (userId: string): Promise<{ user: UserDetail }> => {
    const response = await api.get(`/users/${userId}`) as { user: UserDetail };
    return response;
  },

  /**
   * PATCH /api/users/:id/account-type
   * Update user account type (AGENCY only)
   */
  updateAccountType: async (userId: string, accountType: AccountType): Promise<{ user: UserDetail }> => {
    const response = await api.patch(`/users/${userId}/account-type`, { accountType }) as { user: UserDetail };
    return response;
  },
};
