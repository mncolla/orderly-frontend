import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

/**
 * LastSyncStatus - Muestra el estado de la última sincronización
 *
 * Muestra información sobre cuándo fue la última sincronización
 * y su estado (exitosa, fallida, en progreso)
 */
export function LastSyncStatus() {
  const { user } = useAuth();
  const [timeAgo, setTimeAgo] = useState('');

  // Obtener la integración principal del usuario
  const integration = user?.integrations?.[0];

  useEffect(() => {
    if (!integration || (!integration.lastSyncAt && !('lastSyncCompletedAt' in integration && integration.lastSyncCompletedAt))) {
      return;
    }

    const updateTimeAgo = () => {
      const lastSync = ('lastSyncCompletedAt' in integration && integration.lastSyncCompletedAt) || integration?.lastSyncAt;
      if (!lastSync) return;

      const now = new Date();
      const syncDate = new Date(lastSync);
      const diffMs = now.getTime() - syncDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timeStr = '';
      if (diffMins < 1) {
        timeStr = 'hace un momento';
      } else if (diffMins < 60) {
        timeStr = `hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
      } else if (diffHours < 24) {
        timeStr = `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
      } else {
        timeStr = `hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
      }

      setTimeAgo(timeStr);
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [integration?.lastSyncAt, integration?.lastSyncCompletedAt]);

  // Si no hay sincronización previa, no mostrar nada
  if (!integration || (!integration.lastSyncAt && !('lastSyncCompletedAt' in integration && integration.lastSyncCompletedAt))) {
    return null;
  }

  // Determinar el estado y el icono
  const getStatusInfo = () => {
    const lastSyncStatus = 'lastSyncStatus' in integration ? integration.lastSyncStatus : undefined;

    if (lastSyncStatus === 'IN_PROGRESS') {
      return {
        icon: RefreshCw,
        iconClass: 'animate-spin text-blue-600 dark:text-blue-400',
        text: 'Sincronizando...',
        bgClass: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
        textClass: 'text-blue-700 dark:text-blue-300'
      };
    }

    if (lastSyncStatus === 'FAILED') {
      return {
        icon: XCircle,
        iconClass: 'text-red-600 dark:text-red-400',
        text: 'Falló',
        bgClass: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
        textClass: 'text-red-700 dark:text-red-300'
      };
    }

    // COMPLETED o null (backwards compatibility)
    return {
      icon: CheckCircle,
      iconClass: 'text-green-600 dark:text-green-400',
      text: 'Exitosa',
      bgClass: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
      textClass: 'text-green-700 dark:text-green-300'
    };
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${status.bgClass}`}>
      <StatusIcon className={`h-4 w-4 ${status.iconClass}`} />
      <div className="flex flex-col">
        <span className={`text-xs font-medium ${status.textClass}`}>
          {integration.lastSyncStatus === 'IN_PROGRESS' ? 'Sincronizando...' : `Última sync: ${status.text}`}
        </span>
        {timeAgo && (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {timeAgo}
          </span>
        )}
      </div>
    </div>
  );
}
