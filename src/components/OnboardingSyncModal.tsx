import { Loader2, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useOnboardingSync } from '@/contexts/OnboardingSyncContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function OnboardingSyncModal() {
  const { state, unblock } = useOnboardingSync();
  const { isBlocked, currentSync } = state;

  if (!currentSync) {
    return null;
  }

  const getIcon = () => {
    switch (currentSync.status) {
      case 'in_progress':
        return <Loader2 className="h-12 w-12 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-12 w-12 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (currentSync.status) {
      case 'in_progress':
        return 'text-blue-600 dark:text-blue-400';
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getProgressBarColor = () => {
    if (currentSync.status === 'error') {
      return 'bg-red-500';
    }
    return 'bg-blue-500';
  };

  return (
    <Dialog open={true} onOpenChange={() => unblock()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {isBlocked && (
              <Lock className="h-5 w-5 text-amber-600" />
            )}
            <DialogTitle className="text-xl">
              Conectando con su proveedor
            </DialogTitle>
          </div>
        </DialogHeader>

        <DialogDescription className="text-center space-y-4">
          <div className="space-y-4">
            {/* Icono según estado */}
            <div className="flex justify-center mb-4">
              {getIcon()}
            </div>

            {/* Mensaje principal */}
            <div className="space-y-2">
              <h3 className={`text-lg font-semibold ${getStatusColor()}`}>
                {currentSync.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentSync.description}
              </p>
            </div>

            {/* Barra de progreso */}
            {currentSync.status === 'in_progress' && (
              <div className="space-y-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${getProgressBarColor()} transition-all duration-300 ease-out`}
                    style={{ width: `${currentSync.progress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-2">
                  {currentSync.progress}%
                </p>
              </div>
            )}

            {/* Mensaje de estado completo/error */}
            {currentSync.status === 'completed' && (
              <div className="space-y-3">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  ¡Listo!
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Por favor espera mientras procesamos tus datos
                </p>
              </div>
            )}

            {currentSync.status === 'error' && (
              <div className="space-y-3">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  Hubo un error
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {currentSync.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                  Intentaremos reconectar automáticamente...
                </p>
              </div>
            )}

            {/* Advertencia importante */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                    Importante: No cierres esta ventana ni actualices la página
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Espera a que finalice la conexión para ver tus datos completos. La información actual puede no estar actualizada.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
