const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Obtener token del localStorage
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Mapear códigos de error HTTP a mensajes amigables
const getErrorMessage = (status: number, endpoint: string): string => {
  switch (status) {
    case 400:
      return 'Invalid data. Please check your inputs.';
    case 401:
      return 'Invalid email or password.';
    case 409:
      if (endpoint.includes('/register')) {
        return 'This email is already registered. Please use a different email or login.';
      }
      return 'Resource already exists.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return `An error occurred. Please try again.`;
  }
};

// Manejar errores de autenticación
const handleAuthError = (status: number) => {
  if (status === 401) {
    // Solo redirigir si NO estamos ya en la página de login
    if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
  }
};

export const api = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() && { 'Authorization': `Bearer ${getToken()}` }),
      },
    });

    if (!response.ok) {
      handleAuthError(response.status);
      throw new Error(getErrorMessage(response.status, endpoint));
    }

    return response.json();
  },

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() && { 'Authorization': `Bearer ${getToken()}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      handleAuthError(response.status);
      throw new Error(getErrorMessage(response.status, endpoint));
    }

    return response.json();
  },

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() && { 'Authorization': `Bearer ${getToken()}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      handleAuthError(response.status);
      throw new Error(getErrorMessage(response.status, endpoint));
    }

    return response.json();
  },

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() && { 'Authorization': `Bearer ${getToken()}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      handleAuthError(response.status);
      throw new Error(getErrorMessage(response.status, endpoint));
    }

    return response.json();
  },

  async delete<T>(endpoint: string, options?: { data?: unknown }): Promise<T> {
    const requestOptions: RequestInit = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() && { 'Authorization': `Bearer ${getToken()}` }),
      },
    };

    if (options?.data) {
      requestOptions.body = JSON.stringify(options.data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

    if (!response.ok) {
      handleAuthError(response.status);
      throw new Error(getErrorMessage(response.status, endpoint));
    }

    return response.json();
  },
};
