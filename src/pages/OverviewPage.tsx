import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOverview } from '../hooks/useOverview';
import { ChartLineMultiple } from '@/components/ChartLineMultiple';
import { ObjectivesCard } from '@/components/ObjectivesCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePickerWithRange } from '@/components/DatePIckerWIthRange';
import { type DateRange } from 'react-day-picker';
import { organizationsService } from '../services/organizationsService';

export function OverviewPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [userHasChangedDates, setUserHasChangedDates] = useState(false);
  const [objectives, setObjectives] = useState<any[]>([]);

  const { data: overview, isLoading, error } = useOverview(
    userHasChangedDates && dateRange
      ? {
          startDate: dateRange.from?.toISOString(),
          endDate: dateRange.to?.toISOString(),
        }
      : {}
  );

  // Cargar objetivos del usuario
  useEffect(() => {
    if (user?.organization?.id) {
      organizationsService.getById(user.organization.id).then((response) => {
        if (response.organization.settings?.objectives) {
          setObjectives(response.organization.settings.objectives);
        }
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
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-600 dark:text-red-400">
          Error al cargar los datos
        </div>
      </div>
    );
  }

  const kpis = overview?.kpis;

  return (
    <main className="py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="gap-6 mb-6 flex flex-col items-start">
          <div className="">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Overview</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Bienvenido, {user?.name}
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
        {user?.organization && (
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
  );
}
