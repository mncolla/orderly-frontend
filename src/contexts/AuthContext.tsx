import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import type { User, LoginCredentials, SignupCredentials } from '../types/auth';
import { useSyncStore } from '@/stores/syncStore';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<User | null>;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasClearedToken, setHasClearedToken] = useState(false); // Prevent infinite loops
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Query para obtener el usuario actual si hay token
  const { data: userData, error: userError, isLoading: isLoadingUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.getCurrentUser,
    enabled: !!localStorage.getItem('auth_token') && !hasClearedToken, // Disable if we just cleared the token
    retry: false,
  });

  // Manejar éxito/error del query de usuario
  useEffect(() => {
    if (userData) {
      setUser(userData);
      // Actualizar localStorage cuando el query devuelve datos frescos
      localStorage.setItem('auth_user', JSON.stringify(userData));
    }
  }, [userData]);

  useEffect(() => {
    if (userError && !hasClearedToken) {
      console.log('🔴 Auth error detected, clearing credentials:', userError);
      // Si falla, limpiar el token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setUser(null);
      setHasClearedToken(true); // Prevent infinite loop
    }
  }, [userError, hasClearedToken]);

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      setUser(data.user);
      setError(null);
      // Redirigir a /agency si es usuario de tipo agencia, sino a /stores
      const redirectPath = data.user.role === 'AGENCY' ? '/agency' : '/stores';
      navigate(redirectPath, { transition: true });
    },
    onError: (err: any) => {
      setError(err.message || 'Login failed');
    },
  });

  // Mutation para signup
  const signupMutation = useMutation({
    mutationFn: authService.signup,
    onSuccess: (data) => {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      setUser(data.user);
      setError(null);
      // Redirigir a /agency si es usuario de tipo agencia, sino a /stores
      const redirectPath = data.user.role === 'AGENCY' ? '/agency' : '/stores';
      navigate(redirectPath, { transition: true });
    },
    onError: (err: any) => {
      setError(err.message || 'Signup failed');
    },
  });

  // Función de login
  const login = async (credentials: LoginCredentials) => {
    setError(null);
    await loginMutation.mutateAsync(credentials);
  };

  // Función de signup
  const signup = async (credentials: SignupCredentials) => {
    setError(null);
    await signupMutation.mutateAsync(credentials);
  };

  // Función de logout
  const logout = () => {
    console.log('🔒 Logging out - clearing all data');

    // Limpiar localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('onboarding_sync_state');

    // Limpiar estado de React Query
    queryClient.clear();

    // Limpiar estado del store de Zustand (syncs activos)
    const { clearAllSyncs } = useSyncStore.getState();
    clearAllSyncs();

    setUser(null);
    setError(null);
    navigate("/login", { transition: true });
  };

  // Función para recargar el usuario actual
  const refetchUser = async () => {
    console.log('🔄 refetchUser: Iniciando...');

    // Invalidar el cache y forzar recarga
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    console.log('🔄 refetchUser: Queries invalidadas');

    // Recargar explícitamente
    const data = await queryClient.fetchQuery({
      queryKey: ['auth', 'me'],
      queryFn: authService.getCurrentUser,
    });

    console.log('🔄 refetchUser: Datos obtenidos:', data);

    if (data) {
      setUser(data);
      localStorage.setItem('auth_user', JSON.stringify(data));
      console.log('🔄 refetchUser: Usuario actualizado en estado y localStorage');
    } else {
      console.warn('🔄 refetchUser: No se obtuvieron datos');
    }

    return data;
  };

  // Cargar usuario del localStorage al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    refetchUser,
    isAuthenticated: !!user,
    isLoading: isLoadingUser || loginMutation.isPending || signupMutation.isPending,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
