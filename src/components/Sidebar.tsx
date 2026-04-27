import { Link, useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { BarChart3, ShoppingBag, UtensilsCrossed, Lightbulb, LogOut, Calendar, Settings as SettingsIcon, Users, Menu, X, TrendingUp, Store, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LastSyncStatus } from './LastSyncStatus';
import { useSyncStore } from '@/stores/syncStore';
import { platformIntegrationsService } from '@/services/platformIntegrationsService';

const ownerSidebarItems = [
  { href: '/overview', label: 'sidebar.dashboard', icon: BarChart3, requires: 'orders' as const },
  { href: '/operations', label: 'sidebar.operations', icon: ShoppingBag, requires: 'orders' as const },
  { href: '/menu', label: 'sidebar.menu', icon: UtensilsCrossed, requires: 'menu' as const },
  { href: '/stores', label: 'sidebar.stores', icon: Store, requires: null },
  { href: '/suggestions', label: 'sidebar.suggestions', icon: Lightbulb, requires: 'orders' as const },
  { href: '/history', label: 'sidebar.history', icon: Calendar, requires: 'orders' as const },
  { href: '/settings', label: 'sidebar.settings', icon: SettingsIcon, requires: null },
];

const agencySidebarItems = [
  { href: '/agency', label: 'sidebar.agency', icon: Users, requires: null },
  { href: '/users', label: 'sidebar.users', icon: Users, requires: null },
  { href: '/settings', label: 'sidebar.settings', icon: SettingsIcon, requires: null },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { t } = useTranslation();
  const { activeSyncs, isSyncing, updateSyncProgress, clearSync } = useSyncStore();

  console.log('🎨 Sidebar - Render:', {
    activeSyncsKeys: Object.keys(activeSyncs),
    isSyncing,
    activeSyncsData: activeSyncs,
  });

  // Verificar syncs activos al montar el Sidebar
  useEffect(() => {
    const checkForActiveSyncs = async () => {
      if (!user?.integrations) {
        console.log('🎨 Sidebar - No user integrations, skipping sync check');
        return;
      }

      const userPlatforms = user.integrations
        .filter((int: any) => int.connected)
        .map((int: any) => int.platform);

      if (userPlatforms.length === 0) {
        console.log('🎨 Sidebar - No connected platforms, skipping sync check');
        return;
      }

      console.log('🎨 Sidebar - Checking for active syncs on platforms:', userPlatforms);

      for (const platform of userPlatforms) {
        try {
          const result = await platformIntegrationsService.getSyncProgress(platform);
          console.log(`🎨 Sidebar - ${platform} sync status:`, result);

          // Verificar si el sync realmente está en progreso
          // No agregar si ya tiene completedAt (ya terminó)
          if (result.status === 'in_progress' && result.progress) {
            // Verificar si todos los pasos están completados
            const allCompleted = result.progress.steps.every((step: any) => step.status === 'completed');
            const hasCompletedAt = 'completedAt' in result.progress && result.progress.completedAt;

            if (allCompleted || hasCompletedAt) {
              console.log(`🎨 Sidebar - Sync for ${platform} is already completed, clearing from store`);
              clearSync(platform);
            } else {
              console.log(`🎨 Sidebar - Found active sync for ${platform}, updating store`);
              updateSyncProgress(platform, result.progress);
            }
          }
        } catch (error) {
          console.error(`🎨 Sidebar - Error checking sync for ${platform}:`, error);
        }
      }
    };

    // Solo verificar si no hay syncs activos actualmente
    if (!isSyncing) {
      checkForActiveSyncs();
    }
  }, [user, isSyncing, updateSyncProgress, clearSync]);

  // Calcular el estado de los datos directamente en el Sidebar
  const getDataTypeStatus = (dataType: 'stores' | 'menu' | 'orders') => {
    const status = { available: false, loading: false, completed: false };

    console.log(`🎨 getDataTypeStatus(${dataType}):`, {
      activeSyncsCount: Object.keys(activeSyncs).length,
      isSyncing,
      activeSyncs,
    });

    // Verificar si el usuario tiene integraciones conectadas
    const hasConnectedIntegrations = user?.integrations?.some(int => int.connected) || false;
    console.log(`🎨 getDataTypeStatus(${dataType}): hasConnectedIntegrations:`, hasConnectedIntegrations);

    if (!hasConnectedIntegrations) {
      return status;
    }

    // Si no hay sync activo pero hay integraciones conectadas, asumimos que los datos están disponibles
    if (Object.keys(activeSyncs).length === 0) {
      console.log(`🎨 getDataTypeStatus(${dataType}): No active sync, data available`);
      status.available = true;
      status.completed = true;
      return status;
    }

    // Analizar cada sync activo
    for (const [_platform, progress] of Object.entries(activeSyncs)) {
      console.log(`🎨 getDataTypeStatus(${dataType}): Analyzing sync for ${_platform}:`, progress);
      progress.steps.forEach((step) => {
        if (step.step === dataType) {
          console.log(`🎨 getDataTypeStatus(${dataType}): Step ${dataType} found with status:`, step.status);
          if (step.status === 'in_progress') {
            status.loading = true;
          } else if (step.status === 'completed') {
            status.completed = true;
            status.available = true;
          } else if (step.status === 'pending') {
            // Si está pendiente y hay un sync activo, no está disponible
            status.loading = true;
          }
        }
      });
    }

    // Si después de analizar todos los syncs, el dato no está completado ni cargando,
    // asumimos que está disponible (ya pasó por onboarding)
    if (!status.loading && !status.completed) {
      status.available = true;
      status.completed = true;
    }

    console.log(`🎨 getDataTypeStatus(${dataType}) final:`, status);
    return status;
  };

  const sidebarItems = user?.role === 'AGENCY' ? agencySidebarItems : ownerSidebarItems;

  const handleNavigate = () => {
    setIsMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            OrderlyAI
          </span>
        </div>
        {/* Close button on mobile */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* User Info - Removed role badge here, moved to bottom */}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            // Verificar si el dato requerido está siendo sincronizado
            const dataType = item.requires;
            const dataStatus = dataType ? getDataTypeStatus(dataType) : null;
            const isDataLoading = dataType ? (dataStatus?.loading || !dataStatus?.available) : false;
            const isDataAvailable = dataType ? (dataStatus?.available ?? false) : true;

            console.log(`🎨 ${item.href}:`, {
              isDataLoading,
              isDataAvailable,
              dataType,
              dataStatus: dataStatus || 'N/A',
              activeSyncsCount: Object.keys(activeSyncs).length,
            });

            return (
              <li key={item.href}>
                {isDataLoading ? (
                  // Mostrar botón deshabilitado con loading
                  <div
                    className={`
                      flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative
                      opacity-50 cursor-not-allowed
                      text-gray-400 dark:text-gray-600
                    `}
                    title="Sincronizando datos..."
                  >
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="flex-1">{t(item.label as any)}</span>
                    <span className="text-xs">Sincronizando...</span>
                  </div>
                ) : isDataAvailable ? (
                  // Mostrar botón normal
                  <Link
                    href={item.href}
                    onClick={handleNavigate}
                    className={`
                      flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative group
                      ${
                        isActive
                          ? 'bg-blue-600 !text-white shadow-lg shadow-blue-500/30'
                          : 'text-blue-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                    <span className="flex-1">{t(item.label as any)}</span>
                    {isActive && (
                      <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </Link>
                ) : (
                  // Mostrar botón deshabilitado
                  <div
                    className={`
                      flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative
                      opacity-50 cursor-not-allowed
                      text-gray-400 dark:text-gray-600
                    `}
                    title="Datos no disponibles"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex-1">{t(item.label as any)}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Role Badge */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium">
          <span className="text-gray-700 dark:text-gray-300">
            {user?.name}
          </span>
          <span className="text-gray-400">•</span>
          <span className={
            user?.role === 'AGENCY'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-green-600 dark:text-green-400 font-semibold'
          }>
            {user?.role === 'AGENCY' ? t('sidebar.agency') : t('sidebar.owner')}
          </span>
        </div>
      </div>

      {/* Last Sync Status */}
      {user?.role !== 'AGENCY' && (
        <div className="px-4 py-2">
          <LastSyncStatus />
        </div>
      )}

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={() => {
            logout();
            handleNavigate();
          }}
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-900 dark:text-gray-100 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-xl"
        >
          <LogOut className="h-5 w-5" />
          <span>{t('sidebar.logout')}</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on both mobile and desktop */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen
          ${isMobileOpen ? 'w-72' : 'w-0 lg:w-64'}
          transition-all duration-300 ease-in-out
          overflow-hidden
        `}
      >
        <div className="w-72 lg:w-64 h-full">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}
