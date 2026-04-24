import { Home, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const currentPath = window.location.pathname;

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12">
            <div className="flex items-center justify-center gap-4">
              <AlertTriangle className="h-16 w-16 text-white" />
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-2">
                  404
                </h1>
                <p className="text-blue-100 text-lg">
                  Página No Encontrada
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-12">
            <div className="text-center space-y-6">
              {/* Mensaje principal */}
              <div className="space-y-3">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Oops! La página que buscas no existe.
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  La ruta <code className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg text-sm font-mono text-gray-900 dark:text-white">
                    {currentPath}
                  </code>{' '}
                  no está disponible o ha sido movida.
                </p>
              </div>

              {/* Icono ilustrativo */}
              <div className="flex justify-center my-8">
                <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/20 dark:to-red-900/40 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleGoHome}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
                  size="lg"
                >
                  <Home className="h-5 w-5" />
                  Ir al Inicio
                </Button>

                <Button
                  onClick={handleGoBack}
                  variant="outline"
                  className="flex items-center gap-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  size="lg"
                  disabled={window.history.length <= 1}
                >
                  <ArrowLeft className="h-5 w-5" />
                  Volver Atrás
                </Button>
              </div>

              {/* Botón de recargar */}
              <div className="pt-4">
                <Button
                  onClick={() => window.location.reload()}
                  variant="ghost"
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  Recargar Página
                </Button>
              </div>

              {/* Sugerencias adicionales */}
              <div className="text-sm text-gray-500 dark:text-gray-500 space-y-2">
                <p>
                  💡 Si crees que esto es un error, por favor:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4">
                  <li>Verifica que la URL sea correcta</li>
                  <li>Intenta recargar la página</li>
                  <li>Contacta al soporte si el problema persiste</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-8 py-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Orderly AI - Decision OS for Business
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Código de error: 404 Not Found
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
