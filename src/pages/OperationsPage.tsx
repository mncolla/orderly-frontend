import { useState } from 'react';
import { Package, X, AlertTriangle, Clock } from 'lucide-react';
import { useOperations } from '../hooks/useOperations';
import { type OperationsPeriod } from '../services/operationsService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PeriodSelector } from '@/components/PeriodSelector';

export function OperationsPage() {
  const [period, setPeriod] = useState<OperationsPeriod>('last7days');

  const { data: operations, isLoading, error } = useOperations({
    period,
  });

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

  const metrics = operations?.metrics;

  // Helper para formatear milisegundos a minutos
  const formatMsToMinutes = (ms: number | null): string => {
    if (!ms) return '0 min';
    const minutes = Math.floor(ms / 60000);
    return `${minutes} min`;
  };

  return (
    <main className="py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="gap-6 mb-6 flex flex-col items-start">
          <div className="">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Operations</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Métricas operativas en tiempo real
            </p>
          </div>
          <PeriodSelector
            value={period}
            onChange={setPeriod}
          />
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Orders Today */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Orders Today</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {metrics?.ordersToday ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Cancelled */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <X className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Orders Cancelled</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {metrics?.ordersCancelled ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Rejected */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Orders Rejected</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {metrics?.ordersRejected ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Delayed Orders */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Delayed Orders</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {metrics?.delayedOrdersPct ?? 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tiempos */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tiempos</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prep Time */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Prep Time (avg)</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatMsToMinutes(metrics?.avgPrepTime ?? null)}
                </p>
              </div>

              {/* Acceptance Time */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Order Acceptance Time</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatMsToMinutes(metrics?.orderAcceptanceTime ?? null)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cancelaciones Table */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Cancelaciones</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sirve para detectar stock-outs y problemas operativos
            </p>
          </div>
          <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics?.cancellationReasons && metrics.cancellationReasons.length > 0 ? (
                  metrics.cancellationReasons.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.reason}</TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-gray-500 dark:text-gray-400">
                      No hay datos de cancelaciones
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </main>
  );
}
