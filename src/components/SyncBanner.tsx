import { useSyncStore } from '@/stores/syncStore';
import { Loader2, RefreshCw, AlertTriangle, Calendar, Store, Smartphone } from 'lucide-react';
import { useMemo } from 'react';

/**
 * SyncBanner - Banner persistente que muestra el estado de sincronización
 *
 * Características:
 * - Aparece en TODAS las páginas cuando hay una sincronización activa
 * - NO se puede cerrar manualmente (persistente)
 * - Indica claramente que los datos pueden no estar actualizados
 * - Muestra progreso en tiempo real
 *
 * Este banner reemplaza al toast volátil para dar feedback persistente
 * durante sincronizaciones largas (especialmente orders sync que puede tardar horas)
 */
export function SyncBanner() {
  const { activeSyncs, isSyncing } = useSyncStore();

  // Obtener la primera sincronización activa (generalmente solo hay una a la vez)
  const firstSync = Object.values(activeSyncs)[0];
  const platform = Object.keys(activeSyncs)[0];

  // Calcular progreso total (siempre ejecutar useMemo, incluso si no hay sync)
  const totalProgress = useMemo(() => {
    if (!firstSync || !platform) return 0;
    const totalSteps = firstSync.steps.length;
    const completedSteps = firstSync.steps.filter(s => s.status === 'completed').length;
    return Math.round((completedSteps / totalSteps) * 100);
  }, [firstSync, platform]);

  // Obtener el nombre legible de la plataforma (definir antes del return condicional)
  const getPlatformName = (platformName: string) => {
    switch (platformName) {
      case 'PEDIDOS_YA':
        return 'PedidosYa';
      case 'RAPPI':
        return 'Rappi';
      case 'GLOVO':
        return 'Glovo';
      case 'UBER_EATS':
        return 'Uber Eats';
      default:
        return platformName;
    }
  };

  // Si no hay sincronizaciones activas, no mostrar nada
  if (!isSyncing || !firstSync || !platform || Object.keys(activeSyncs).length === 0) {
    return null;
  }

  // Obtener el paso actual en progreso
  const currentStep = firstSync.steps.find(s => s.status === 'in_progress');

  // Obtener el step name y descripción en español
  const getStepInfo = (step: string, progress: number, total: number) => {
    switch (step) {
      case 'stores':
        return {
          name: 'Locales',
          description: `${progress} de ${total} locales encontrados`
        };
      case 'menu':
        return {
          name: 'Menú',
          description: `${progress} de ${total} grupos sincronizados`
        };
      case 'orders':
        return {
          name: 'Órdenes',
          description: `${progress} de ${total} stores procesados`
        };
      default:
        return {
          name: step,
          description: `${progress}/${total}`
        };
    }
  };

  const stepInfo = currentStep ? getStepInfo(currentStep.step, currentStep.progress, currentStep.total) : { name: 'Procesando...', description: '0/0' };

  // Color de fondo según estado
  const getBannerColor = () => {
    if (currentStep?.step === 'orders') {
      // Orders sync es muy largo, usar color advertencia
      return 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800';
    }
    // Otros pasos usan color info
    return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
  };

  return (
    <div className={`border-b ${getBannerColor()} shadow-lg`}>
      <div className="px-4 py-3 lg:px-6 lg:ml-64">
        <div className="flex items-center justify-between gap-4">
          {/* Icono y mensaje principal */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {currentStep?.step === 'orders' ? (
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 animate-pulse" />
            ) : (
              <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 animate-spin" />
            )}

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                {currentStep?.step === 'orders' ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                    Sincronización Extendida en Progreso
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                    Sincronizando con {getPlatformName(platform)}
                  </>
                )}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {stepInfo.name}: {stepInfo.description} ({totalProgress}%)
              </p>

              {/* Show orders details when syncing orders */}
              {currentStep?.step === 'orders' && currentStep.details && (
                <div className="mt-2 space-y-1">
                  {currentStep.details.totalOrders !== undefined && (
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {currentStep.details.totalOrders} órdenes encontradas
                    </p>
                  )}
                  {currentStep.details.ordersByMonth && currentStep.details.ordersByMonth.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>Por mes: {currentStep.details.ordersByMonth.slice(0, 2).map(m => `${m.month} (${m.count})`).join(', ')}</span>
                    </div>
                  )}
                  {currentStep.details.ordersByStore && currentStep.details.ordersByStore.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <Store className="h-3 w-3" />
                      <span>Por local: {currentStep.details.ordersByStore.slice(0, 2).map(s => `${s.storeName} (${s.count})`).join(', ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Advertencia sobre datos */}
          <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50">
              <Smartphone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getPlatformName(platform)}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                ⚠️ Los datos pueden no estar actualizados
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Esta sincronización puede tardar varios minutos
              </p>
            </div>
            <RefreshCw className="h-4 w-4 text-gray-500 dark:text-gray-400 animate-spin" />
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
