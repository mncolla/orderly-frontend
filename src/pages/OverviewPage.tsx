import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOverview } from '../hooks/useOverview';
import { ChartLineMultiple } from '@/components/ChartLineMultiple';
import { ObjectivesCard } from '@/components/ObjectivesCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePickerWithRange } from '@/components/DatePIckerWIthRange';
import { type DateRange } from 'react-day-picker';
import { platformIntegrationsService } from '../services/platformIntegrationsService';
import { AgencyContextBanner } from '@/components/AgencyContextBanner';

export function OverviewPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [userHasChangedDates, setUserHasChangedDates] = useState(false);
  const [objectives, setObjectives] = useState<any[]>([]);

  // Parse search params from window.location (Wouter's useLocation doesn't include query params)
  const searchParams = new URLSearchParams(window.location.search);
  const agencyView = searchParams.get('agencyView') === 'true';
  const agencyUserId = searchParams.get('userId');
  const agencyStoreId = searchParams.get('storeId');

  // DEBUG: Log para verificar qué se está detectando
  console.log('📍 window.location.href:', window.location.href);
  console.log('📍 window.location.search:', window.location.search);
  console.log('🔍 searchParams:', Object.fromEntries(searchParams));
  console.log('✅ agencyView:', agencyView);
  console.log('👤 agencyUserId:', agencyUserId);
  console.log('🏪 agencyStoreId:', agencyStoreId);

  const [agencyUserName, setAgencyUserName] = useState<string>('');
  const [agencyStoreName, setAgencyStoreName] = useState<string>('');

  // Fetch agency user/store info when in agency mode
  useEffect(() => {
    if (agencyView && agencyUserId) {
      console.log('🔍 Agency mode: fetching user info', { agencyUserId });

      // Fetch user info
      fetch(`/api/auth/users/${agencyUserId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
        .then(res => {
          console.log('📡 User API response status:', res.status);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('✅ User data received:', data);
          setAgencyUserName(data.name || 'Usuario');
        })
        .catch(err => {
          console.error('❌ Error fetching user:', err);
          setAgencyUserName('Usuario');
        });

      // Fetch store info if storeId provided
      if (agencyStoreId) {
        console.log('🔍 Agency mode: fetching store info', { agencyStoreId });

        fetch(`/api/stores/${agencyStoreId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })
          .then(res => {
            console.log('📡 Store API response status:', res.status);
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return res.json();
          })
          .then(data => {
            console.log('✅ Store data received:', data);
            setAgencyStoreName(data.store?.name || 'Store');
          })
          .catch(err => {
            console.error('❌ Error fetching store:', err);
            setAgencyStoreName('Store');
          });
      }
    }
  }, [agencyView, agencyUserId, agencyStoreId]);

  const { data: overview, isLoading, error } = useOverview(
    userHasChangedDates && dateRange
      ? {
          storeId: agencyStoreId || undefined,
          startDate: dateRange.from?.toISOString(),
          endDate: dateRange.to?.toISOString(),
        }
      : {
          storeId: agencyStoreId || undefined,
        }
  );

  // Cargar objetivos del usuario
  useEffect(() => {
    if (user?.integrations && user.integrations.length > 0) {
      // Obtener la primera integración (los owners típicamente tienen una sola)
      const integrationId = user.integrations[0].id;
      platformIntegrationsService.getById(integrationId).then(() => {
        // Por ahora, no hay objetivos en la nueva estructura
        // Se pueden agregar más tarde si es necesario
        setObjectives([]);
      });
    }
  }, [user]);

  // Sincronizar el estado con el periodo que devuelve el backend (solo primera carga)
  useEffect(() => {
    if (overview?.period && !userHasChangedDates) {
      setDateRange({
        from: new Date(overview.period.start),
        to: new Date(overview.period.end),
      });
    }
  }, [overview?.period, userHasChangedDates]);

  // Handler para cuando el usuario selecciona fechas
  const handleDateChange = (range: DateRange | undefined) => {
    if (range) {
      setDateRange(range);
      setUserHasChangedDates(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600 dark:text-gray-400">Cargando...</div>
      </div>
    );
  }

  if (error) {
    console.error('❌ Overview error:', error);
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-red-600 dark:text-red-400 text-center">
          <p className="font-semibold text-lg">Error al cargar los datos</p>
          <p className="text-sm mt-2">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
        </div>
        {agencyView && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-w-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Modo Agencia:</strong> Verifica que tengas permisos para ver las métricas de este usuario/store.
            </p>
          </div>
        )}
      </div>
    );
  }

  const kpis = overview?.kpis;

  return (
    <>
      {/* Agency Context Banner */}
      <AgencyContextBanner
        userName={agencyUserName}
        storeName={agencyStoreName}
        currentView="overview"
      />

      <main className={`${agencyView ? 'pt-0' : 'py-6'} sm:px-6 lg:px-8`}>
        <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="gap-6 mb-6 flex flex-col items-start">
          <div className="">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {agencyView ? 'Dashboard' : 'Overview'}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {agencyView && agencyUserName
                ? `Analizando métricas de ${agencyUserName}${agencyStoreName ? ` - ${agencyStoreName}` : ''}`
                : `Bienvenido, ${user?.name}`
              }
            </p>
          </div>
          <DatePickerWithRange
            value={dateRange}
            onChange={handleDateChange}
          />
        </div>

        

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Revenue */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                      {kpis?.revenue.formatted || '$0'}
                    </p>
                  </div>
                </div>
                {(kpis?.revenue?.change ?? 0) !== 0 && (
                  <div className={`flex items-center ${(kpis?.revenue?.change ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(kpis?.revenue?.change ?? 0) > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="ml-1 text-sm font-medium">{Math.abs(kpis?.revenue?.change ?? 0)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Orders */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Orders</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                      {kpis?.orders.current || 0}
                    </p>
                  </div>
                </div>
                {(kpis?.orders?.change ?? 0) !== 0 && (
                  <div className={`flex items-center ${(kpis?.orders?.change ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(kpis?.orders?.change ?? 0) > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="ml-1 text-sm font-medium">{Math.abs(kpis?.orders?.change ?? 0)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Avg Ticket */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Ticket</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                      {kpis?.avgTicket.formatted || '$0'}
                    </p>
                  </div>
                </div>
                {(kpis?.avgTicket?.change ?? 0) !== 0 && (
                  <div className={`flex items-center ${(kpis?.avgTicket?.change ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(kpis?.avgTicket?.change ?? 0) > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="ml-1 text-sm font-medium">{Math.abs(kpis?.avgTicket?.change ?? 0)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cancel Rate */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cancel Rate</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                      {kpis?.cancelRate.formatted || '0%'}
                    </p>
                  </div>
                </div>
                {(kpis?.cancelRate?.change ?? 0) !== 0 && (
                  <div className={`flex items-center ${(kpis?.cancelRate?.change ?? 0) < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(kpis?.cancelRate?.change ?? 0) < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                    <span className="ml-1 text-sm font-medium">{Math.abs(kpis?.cancelRate?.change ?? 0)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Objectives Card */}
        {user?.integrations && user.integrations.length > 0 && (
          <div className="mb-8">
            <ObjectivesCard objectives={objectives} />
          </div>
        )}

        {/* Principal Chart */}
        {overview?.chart && (
          <ChartLineMultiple
            data={overview.chart.daily}
            period={overview.period}
          />
        )}

        {/* Alerts */}
        {overview?.alerts && overview.alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 mt-6">Alertas y Sugerencias</h2>
            <div className="space-y-4">
              {overview.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`bg-white dark:bg-gray-800 shadow rounded-lg p-4 border-l-4 ${alert.severity === 'high' ? 'border-red-500' :
                    alert.severity === 'medium' ? 'border-yellow-500' :
                      'border-blue-500'
                    }`}
                >
                  <div className="flex items-start">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${alert.severity === 'high' ? 'text-red-600 dark:text-red-400' :
                      alert.severity === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`} />
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">{alert.title}</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{alert.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${alert.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items Ranking and Platform Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 mt-6 gap-6 mb-8">
          {/* Items Ranking */}
          {overview?.itemsRanking && overview.itemsRanking.length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ranking de Productos</h3>
              </div>
              <div className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.itemsRanking.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.quantitySold}</TableCell>
                        <TableCell>${item.totalRevenue.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Platform Distribution */}
          {overview?.platformDistribution && overview.platformDistribution.length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Distribución por Plataforma</h3>
              </div>
              <div className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plataforma</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.platformDistribution.map((platform) => (
                      <TableRow key={platform.platform}>
                        <TableCell className="font-medium">{platform.platform}</TableCell>
                        <TableCell>{platform.orders}</TableCell>
                        <TableCell>${platform.revenue.toLocaleString()}</TableCell>
                        <TableCell>{platform.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
    </>
  );
}
