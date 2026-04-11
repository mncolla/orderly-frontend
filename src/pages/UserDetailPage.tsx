import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { usersService } from '@/services/usersService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Building2,
  Mail,
  Calendar,
  TrendingUp,
  Settings,
  BarChart3,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// @ts-ignore
const _accountTypeConfig = {
  FREE: { label: 'Free', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', icon: Clock },
  PRO: { label: 'Pro', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Zap },
  ENTERPRISE: { label: 'Enterprise', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: TrendingUp },
};

const platformConfig: Record<string, { label: string; color: string }> = {
  PEDIDOS_YA: { label: 'PedidosYa', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  RAPPI: { label: 'Rappi', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  GLOVO: { label: 'Glovo', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  UBER_EATS: { label: 'UberEats', color: 'bg-gray-800 text-white dark:bg-gray-700 dark:text-gray-200' },
};

export function UserDetailPage() {
  const [, navigate] = useLocation();
  const params = useParams();
  const userId = params.id || '';

  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersService.getById(userId),
    enabled: !!userId,
  });

  const [isUpdating, setIsUpdating] = useState(false);

  const handleAccountTypeChange = async (newAccountType: string) => {
    if (!userId || isUpdating) return;

    setIsUpdating(true);
    try {
      await usersService.updateAccountType(userId, newAccountType as any);
      // Refetch user data
      window.location.reload();
    } catch (error) {
      console.error('Error updating account type:', error);
      alert('Error al actualizar el tipo de cuenta');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Cargando usuario...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Usuario no encontrado
          </h2>
          <Button onClick={() => navigate('/users')} variant="outline">
            Volver a usuarios
          </Button>
        </div>
      </div>
    );
  }

  const user = data.user;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <Button
          onClick={() => navigate('/users')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a usuarios
        </Button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {user.name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Miembro desde {new Date(user.createdAt).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Account Type Selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo de cuenta:
            </label>
            <Select
              value={user.accountType}
              onValueChange={handleAccountTypeChange}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FREE">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Free
                  </div>
                </SelectItem>
                <SelectItem value="PRO">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Pro
                  </div>
                </SelectItem>
                <SelectItem value="ENTERPRISE">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Enterprise
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Integraciones
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {user._count.integrations}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Sugerencias
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {user._count.createdSuggestions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Estado
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                Activo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Integraciones
          </h2>
        </div>

        {user.integrations.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Este usuario no tiene integraciones
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {user.integrations.map((integration) => {
              const platformConf = platformConfig[integration.platform] || {
                label: integration.platform,
                color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
              };

              return (
                <div
                  key={integration.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {platformConf.label}
                        </h3>
                        <Badge
                          variant={integration.connected ? 'default' : 'secondary'}
                          className={integration.connected
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-0'
                          }
                        >
                          {integration.connected ? 'Conectado' : 'No conectado'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {integration.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {integration._count.stores} tienda{integration._count.stores !== 1 ? 's' : ''}
                      </div>
                      {integration.lastSyncAt && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Sync: {new Date(integration.lastSyncAt).toLocaleDateString('es-AR')}
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/overview?agencyView=true&userId=${user.id}`)}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Ver dashboard
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="h-auto p-4 flex items-center justify-start"
          onClick={() => navigate(`/overview?agencyView=true&userId=${user.id}`)}
        >
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900 dark:text-white">Dashboard</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Ver métricas y KPIs</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-4 flex items-center justify-start"
          onClick={() => navigate(`/operations?agencyView=true&userId=${user.id}`)}
        >
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
            <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900 dark:text-white">Operaciones</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Ver órdenes y stock</div>
          </div>
        </Button>
      </div>
    </div>
  );
}
