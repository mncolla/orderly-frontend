import { useState, useEffect } from 'react';
import { Package, X, AlertTriangle, Clock, Timer, CheckCircle2, TrendingDown } from 'lucide-react';
import { useOperations } from '../hooks/useOperations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePickerWithRange } from '@/components/DatePIckerWIthRange';
import { type DateRange } from 'react-day-picker';
import { AgencyContextBanner } from '@/components/AgencyContextBanner';
import { StoreSelector, type StoreWithPlatform } from '@/components/menu/StoreSelector';
import { api } from '../services/api';
import { platformIntegrationsService } from '../services/platformIntegrationsService';
import { useAuth } from '../contexts/AuthContext';

export function OperationsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [userHasChangedDates, setUserHasChangedDates] = useState(false);
  const [stores, setStores] = useState<StoreWithPlatform[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  const searchParams = new URLSearchParams(window.location.search);
  const agencyView = searchParams.get('agencyView') === 'true';
  const agencyUserId = searchParams.get('userId');
  const agencyStoreId = searchParams.get('storeId');

  const [agencyUserName, setAgencyUserName] = useState<string>('');
  const [agencyStoreName, setAgencyStoreName] = useState<string>('');

  useEffect(() => {
    if (agencyView && agencyUserId) {
      fetch(`/api/auth/users/${agencyUserId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          setAgencyUserName(data.name || 'Usuario');
        })
        .catch(() => {
          setAgencyUserName('Usuario');
        });

      if (agencyStoreId) {
        fetch(`/api/stores/${agencyStoreId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })
          .then(res => res.json())
          .then(data => {
            setAgencyStoreName(data.store?.name || 'Store');
          })
          .catch(() => {
            setAgencyStoreName('Store');
          });
      }
    }
  }, [agencyView, agencyUserId, agencyStoreId]);

  // Load stores for the store selector
  useEffect(() => {
    const loadStores = async () => {
      try {
        if (agencyView && agencyUserId) {
          // Agency mode: load stores for the specific user
          const response = await api.get(`/platform-integrations?userId=${agencyUserId}`);
          const data = response as { integrations: any[] };

          const allStores: StoreWithPlatform[] = [];
          data.integrations?.forEach((integration: any) => {
            integration.stores?.forEach((store: any) => {
              allStores.push({
                id: store.id,
                name: store.name,
                chainName: store.chainName,
                platform: integration.platform,
              });
            });
          });

          setStores(allStores);

          // Pre-select the specific store if provided
          if (agencyStoreId) {
            setSelectedStoreIds([agencyStoreId]);
          }
        } else if (user?.integrations) {
          // Owner mode: load all user's stores
          const allStores: StoreWithPlatform[] = [];
          for (const integration of user.integrations) {
            const integrationData = await platformIntegrationsService.getById(integration.id);
            if (integrationData?.integration?.stores) {
              integrationData.integration.stores.forEach((store: any) => {
                allStores.push({
                  id: store.id,
                  name: store.name,
                  chainName: store.chainName,
                  platform: integration.platform,
                });
              });
            }
          }
          setStores(allStores);
        }
      } catch (error) {
        console.error('Error loading stores:', error);
      }
    };

    loadStores();
  }, [user, agencyView, agencyUserId, agencyStoreId]);

  const { data: operations, isLoading, error } = useOperations(
    userHasChangedDates && dateRange
      ? {
          storeId: (selectedStoreIds.length === 0 && agencyStoreId) ? agencyStoreId : undefined,
          storeIds: selectedStoreIds.length > 0 ? selectedStoreIds : undefined,
          startDate: dateRange.from?.toISOString(),
          endDate: dateRange.to?.toISOString(),
        }
      : {
          storeId: (selectedStoreIds.length === 0 && agencyStoreId) ? agencyStoreId : undefined,
          storeIds: selectedStoreIds.length > 0 ? selectedStoreIds : undefined,
          period: 'last7days',
        }
  );

  useEffect(() => {
    if (!dateRange && !userHasChangedDates) {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      setDateRange({ from: sevenDaysAgo, to: today });
    }
  }, [dateRange, userHasChangedDates]);

  const handleDateChange = (range: DateRange | undefined) => {
    if (range) {
      setDateRange(range);
      setUserHasChangedDates(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Cargando operaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <div className="text-center">
          <div className="inline-flex p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-red-600 dark:text-red-400 font-semibold text-lg">Error al cargar los datos</p>
          <p className="text-sm text-gray-500 mt-2">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
        </div>
      </div>
    );
  }

  const metrics = operations?.metrics;
  const totalOrders = (metrics?.ordersToday ?? 0) + (metrics?.ordersCancelled ?? 0) + (metrics?.ordersRejected ?? 0);
  const completedOrders = metrics?.ordersToday ?? 0;

  const formatMsToMinutes = (ms: number | null): string => {
    if (!ms) return '0 min';
    const minutes = Math.floor(ms / 60000);
    return `${minutes} min`;
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, color, percentage }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    color: string;
    percentage?: number;
  }) => {
    const colorClasses = {
      blue: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30',
      red: 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30',
      orange: 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/30',
      yellow: 'bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-yellow-500/30',
      green: 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/30',
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${colorClasses[color as keyof typeof colorClasses]} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
            {percentage !== undefined && (
              <div className="mt-2 flex items-center gap-1">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[3rem] text-right">
                  {percentage.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <AgencyContextBanner
        userName={agencyUserName}
        storeName={agencyStoreName}
        currentView="operations"
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Operaciones
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {agencyView && agencyUserName
                  ? `Analizando operaciones de ${agencyUserName}${agencyStoreName ? ` - ${agencyStoreName}` : ''}`
                  : 'Métricas operativas en tiempo real'
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!agencyView && (
                <StoreSelector
                  stores={stores}
                  selectedStoreIds={selectedStoreIds}
                  onSelectionChange={setSelectedStoreIds}
                  mode="multi"
                />
              )}
              <DatePickerWithRange
                value={dateRange}
                onChange={handleDateChange}
              />
            </div>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <MetricCard
            title="Pedidos Totales"
            value={totalOrders}
            subtitle={`${completedOrders} completados`}
            icon={Package}
            color="blue"
          />
          <MetricCard
            title="Cancelados"
            value={metrics?.ordersCancelled ?? 0}
            subtitle={totalOrders > 0 ? `${((metrics?.ordersCancelled ?? 0) / totalOrders * 100).toFixed(1)}% del total` : 'Sin datos'}
            icon={X}
            color="red"
            percentage={totalOrders > 0 ? ((metrics?.ordersCancelled ?? 0) / totalOrders * 100) : undefined}
          />
          <MetricCard
            title="Rechazados"
            value={metrics?.ordersRejected ?? 0}
            subtitle={totalOrders > 0 ? `${((metrics?.ordersRejected ?? 0) / totalOrders * 100).toFixed(1)}% del total` : 'Sin datos'}
            icon={AlertTriangle}
            color="orange"
            percentage={totalOrders > 0 ? ((metrics?.ordersRejected ?? 0) / totalOrders * 100) : undefined}
          />
          <MetricCard
            title="Demorados"
            value={`${metrics?.delayedOrdersPct ?? 0}%`}
            subtitle=">30 min de preparación"
            icon={Clock}
            color="yellow"
          />
        </div>

        {/* Time Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {/* Prep Time */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                <Timer className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tiempo de Preparación</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Promedio del periodo</p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                {formatMsToMinutes(metrics?.avgPrepTime ?? null)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 pb-1">promedio</span>
            </div>
          </div>

          {/* Acceptance Time */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tiempo de Aceptación</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Promedio del periodo</p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                {formatMsToMinutes(metrics?.orderAcceptanceTime ?? null)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 pb-1">promedio</span>
            </div>
          </div>
        </div>

        {/* Cancellations Table */}
        {metrics?.cancellationReasons && metrics.cancellationReasons.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Razones de Cancelación</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Detecta problemas de stock y operacionales
              </p>
            </div>
            <div className="p-6 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Razón</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.cancellationReasons.map((item, index) => {
                    const totalCancellations = metrics.cancellationReasons?.reduce((sum, r) => sum + r.count, 0) || 1;
                    const percentage = (item.count / totalCancellations * 100).toFixed(1);

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold">
                              {index + 1}
                            </div>
                            {item.reason}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-gray-600 dark:text-gray-400">
                          {item.count}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            {percentage}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* No Data State */}
        {(!metrics?.cancellationReasons || metrics.cancellationReasons.length === 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 border border-gray-100 dark:border-gray-700 text-center">
            <div className="inline-flex p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
              <CheckCircle2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              ¡Excelente! Sin cancelaciones
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No hay datos de cancelaciones en el periodo seleccionado
            </p>
          </div>
        )}
      </div>
    </>
  );
}
