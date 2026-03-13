// Integra exactamente con los endpoints del backend
import { api } from './api';
import type { LoginCredentials, SignupCredentials, AuthResponse, User, AuthMeResponse } from '../types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/login', credentials);
  },

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/register', credentials);
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<AuthMeResponse>('/auth/me');
    return response.user;
  }
};
