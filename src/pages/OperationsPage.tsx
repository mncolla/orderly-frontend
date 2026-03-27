import { useState, useEffect } from 'react';
import { Package, X, AlertTriangle, Clock } from 'lucide-react';
import { useOperations } from '../hooks/useOperations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePickerWithRange } from '@/components/DatePIckerWIthRange';
import { type DateRange } from 'react-day-picker';
import { AgencyContextBanner } from '@/components/AgencyContextBanner';

export function OperationsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [userHasChangedDates, setUserHasChangedDates] = useState(false);

  // Parse search params from window.location (Wouter's useLocation doesn't include query params)
  const searchParams = new URLSearchParams(window.location.search);
  const agencyView = searchParams.get('agencyView') === 'true';
  const agencyUserId = searchParams.get('userId');
  const agencyStoreId = searchParams.get('storeId');

  // DEBUG
  console.log('📍 Operations - window.location.href:', window.location.href);
  console.log('✅ Operations - agencyView:', agencyView);
  console.log('👤 Operations - agencyUserId:', agencyUserId);

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

  const { data: operations, isLoading, error } = useOperations(
    userHasChangedDates && dateRange
      ? {
          storeId: agencyStoreId || undefined,
          startDate: dateRange.from?.toISOString(),
          endDate: dateRange.to?.toISOString(),
        }
      : {
          storeId: agencyStoreId || undefined,
          period: 'last7days',
        }
  );

  // Sync with backend period on first load
  useEffect(() => {
    // Default to last 7 days if not set
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
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-600 dark:text-red-400">
          Error loading data
        </div>
      </div>
    );
  }

  const metrics = operations?.metrics;

  // Calculate total orders in the selected range
  // Total = Completed (inferred) + Cancelled + Rejected
  const totalOrders = (metrics?.ordersToday ?? 0) + (metrics?.ordersCancelled ?? 0) + (metrics?.ordersRejected ?? 0);
  const completedOrders = metrics?.ordersToday ?? 0;

  // Helper to format milliseconds to minutes
  const formatMsToMinutes = (ms: number | null): string => {
    if (!ms) return '0 min';
    const minutes = Math.floor(ms / 60000);
    return `${minutes} min`;
  };

  // Calculate date range label for KPIs
  const getDateRangeLabel = () => {
    if (!dateRange?.from) return 'Orders';

    const from = dateRange.from;
    const to = dateRange.to || from;

    const isSameDay = from.toDateString() === to.toDateString();
    const isToday = from.toDateString() === new Date().toDateString();

    if (isToday && isSameDay) {
      return 'Total Orders';
    }

    return 'Total Orders';
  };

  return (
    <>
      {/* Agency Context Banner */}
      <AgencyContextBanner
        userName={agencyUserName}
        storeName={agencyStoreName}
        currentView="operations"
      />

      <main className={`${agencyView ? 'pt-0' : 'py-6'} sm:px-6 lg:px-8`}>
        <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="gap-6 mb-6 flex flex-col items-start">
          <div className="">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {agencyView ? 'Operaciones' : 'Operations'}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {agencyView && agencyUserName
                ? `Analizando operaciones de ${agencyUserName}${agencyStoreName ? ` - ${agencyStoreName}` : ''}`
                : 'Real-time operational metrics'
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
          {/* Total Orders */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {getDateRangeLabel()}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {totalOrders}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {completedOrders} completed
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
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cancelled</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {metrics?.ordersCancelled ?? 0}
                  </p>
                  {totalOrders > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {((metrics?.ordersCancelled ?? 0) / totalOrders * 100).toFixed(1)}% of total
                    </p>
                  )}
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
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rejected</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {metrics?.ordersRejected ?? 0}
                  </p>
                  {totalOrders > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {((metrics?.ordersRejected ?? 0) / totalOrders * 100).toFixed(1)}% of total
                    </p>
                  )}
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
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Delayed</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {metrics?.delayedOrdersPct ?? 0}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    &gt;30 min prep time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Metrics */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5 mb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Time Metrics</h3>
          </div>
          <div className="grid grid-cols-2 gap-6 mt-4">
            {/* Prep Time */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Prep Time (avg)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatMsToMinutes(metrics?.avgPrepTime ?? null)}
              </p>
            </div>

            {/* Acceptance Time */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Acceptance Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatMsToMinutes(metrics?.orderAcceptanceTime ?? null)}
              </p>
            </div>
          </div>
        </div>

        {/* Cancellations Table */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Cancellations</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Helps detect stock-outs and operational issues
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
                      No cancellation data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </main>
    </>
  );
}
