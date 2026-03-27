import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight, Target, Calendar } from 'lucide-react';
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

  // Parse search params from window.location
  const searchParams = new URLSearchParams(window.location.search);
  const agencyView = searchParams.get('agencyView') === 'true';
  const agencyUserId = searchParams.get('userId');
  const agencyStoreId = searchParams.get('storeId');

  const [agencyUserName, setAgencyUserName] = useState<string>('');
  const [agencyStoreName, setAgencyStoreName] = useState<string>('');

  // Fetch agency user/store info when in agency mode
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

  useEffect(() => {
    if (user?.integrations && user.integrations.length > 0) {
      const integrationId = user.integrations[0].id;
      platformIntegrationsService.getById(integrationId).then(() => {
        setObjectives([]);
      });
    }
  }, [user]);

  useEffect(() => {
    if (overview?.period && !userHasChangedDates) {
      setDateRange({
        from: new Date(overview.period.start),
        to: new Date(overview.period.end),
      });
    }
  }, [overview?.period, userHasChangedDates]);

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
          <p className="text-gray-600 dark:text-gray-400">Cargando dashboard...</p>
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
        {agencyView && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 max-w-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Modo Agencia:</strong> Verifica que tengas permisos para ver las métricas de este usuario/store.
            </p>
          </div>
        )}
      </div>
    );
  }

  const kpis = overview?.kpis;

  const KPICard = ({ title, value, change, icon: Icon, color, trend }: {
    title: string;
    value: string;
    change?: number;
    icon: any;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => {
    const colorClasses = {
      green: 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/30',
      blue: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30',
      purple: 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/30',
      orange: 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/30',
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-xl ${colorClasses[color as keyof typeof colorClasses]} shadow-lg`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-3">{value}</p>
          </div>
          {change !== undefined && change !== 0 && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-medium ${
              (trend === 'up' || change > 0) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              (trend === 'down' || change < 0) ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
              'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {change > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <AgencyContextBanner
        userName={agencyUserName}
        storeName={agencyStoreName}
        currentView="overview"
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                {agencyView ? 'Dashboard' : 'Resumen'}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {agencyView && agencyUserName
                  ? `Analizando métricas de ${agencyUserName}${agencyStoreName ? ` - ${agencyStoreName}` : ''}`
                  : `Hola, ${user?.name?.split(' ')[0]} 👋`
                }
              </p>
            </div>
            <DatePickerWithRange
              value={dateRange}
              onChange={handleDateChange}
            />
          </div>

          {/* Period Badge */}
          {overview?.period && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                {new Date(overview.period.start).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                {' - '}
                {new Date(overview.period.end).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <KPICard
            title="Ingresos"
            value={kpis?.revenue.formatted || '$0'}
            change={kpis?.revenue?.change}
            icon={DollarSign}
            color="green"
          />
          <KPICard
            title="Pedidos"
            value={kpis?.orders.current.toLocaleString() || '0'}
            change={kpis?.orders?.change}
            icon={ShoppingCart}
            color="blue"
          />
          <KPICard
            title="Ticket Promedio"
            value={kpis?.avgTicket.formatted || '$0'}
            change={kpis?.avgTicket?.change}
            icon={DollarSign}
            color="purple"
          />
          <KPICard
            title="Tasa Cancelación"
            value={kpis?.cancelRate.formatted || '0%'}
            change={kpis?.cancelRate?.change}
            icon={Clock}
            color="orange"
            trend="down"
          />
        </div>

        {/* Objectives Card */}
        {user?.integrations && user.integrations.length > 0 && (
          <div className="mb-8">
            <ObjectivesCard objectives={objectives} />
          </div>
        )}

        {/* Principal Chart */}
        {overview?.chart && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ingresos vs Pedidos</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Evolución diaria del periodo seleccionado</p>
            </div>
            <ChartLineMultiple
              data={overview.chart.daily}
              period={overview.period}
            />
          </div>
        )}

        {/* Alerts */}
        {overview?.alerts && overview.alerts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Alertas y Sugerencias</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {overview.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border-l-4 transition-all hover:shadow-lg ${
                    alert.severity === 'high' ? 'border-red-500' :
                    alert.severity === 'medium' ? 'border-yellow-500' :
                    'border-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      alert.severity === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                      alert.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      <AlertTriangle className={`h-4 w-4 ${
                        alert.severity === 'high' ? 'text-red-600 dark:text-red-400' :
                        alert.severity === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{alert.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.description}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      alert.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {alert.severity === 'high' ? 'Alta' : alert.severity === 'medium' ? 'Media' : 'Baja'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items Ranking and Platform Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Items Ranking */}
          {overview?.itemsRanking && overview.itemsRanking.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Productos Top</h3>
                </div>
              </div>
              <div className="p-6 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cant.</TableHead>
                      <TableHead className="text-right">Ingresos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.itemsRanking.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-white">{item.productName}</TableCell>
                        <TableCell className="text-right text-gray-600 dark:text-gray-400">{item.quantitySold}</TableCell>
                        <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                          ${item.totalRevenue.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Platform Distribution */}
          {overview?.platformDistribution && overview.platformDistribution.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Por Plataforma</h3>
              </div>
              <div className="p-6 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plataforma</TableHead>
                      <TableHead className="text-right">Pedidos</TableHead>
                      <TableHead className="text-right">Ingresos</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.platformDistribution.map((platform, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-gray-900 dark:text-white">{platform.platform}</TableCell>
                        <TableCell className="text-right text-gray-600 dark:text-gray-400">{platform.orders}</TableCell>
                        <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                          ${platform.revenue.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {platform.percentage.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
