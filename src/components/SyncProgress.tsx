import { Home, UtensilsCrossed, ShoppingCart, Check, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { SyncProgress } from '../services/platformIntegrationsService';

interface SyncProgressDisplayProps {
  syncProgress: SyncProgress | null;
  syncError?: string;
}

export function SyncProgressDisplay({ syncProgress, syncError }: SyncProgressDisplayProps) {
  if (!syncProgress) return null;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="font-semibold text-lg">Sincronizando datos...</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Esto puede tomar unos minutos
        </p>
      </div>

      {/* Sync Steps */}
      <div className="space-y-3">
        {syncProgress.steps.map((step) => {
          const StepIcon = step.step === 'stores' ? Home :
                          step.step === 'menu' ? UtensilsCrossed :
                          ShoppingCart;

          return (
            <Card key={step.step} className={`border-2 transition-all ${
              step.status === 'completed' ? 'border-green-500 dark:border-green-600' :
              step.status === 'in_progress' ? 'border-indigo-500 dark:border-indigo-600' :
              step.status === 'failed' ? 'border-red-500 dark:border-red-600' :
              'border-gray-200 dark:border-gray-700'
            }`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                    step.status === 'in_progress' ? 'bg-indigo-100 dark:bg-indigo-900/30' :
                    step.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30' :
                    'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {step.status === 'completed' ? (
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : step.status === 'in_progress' ? (
                      <Loader2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                    ) : step.status === 'failed' ? (
                      <span className="text-red-600 dark:text-red-400">✕</span>
                    ) : (
                      <StepIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">
                        {step.step === 'stores' ? 'Locales' :
                         step.step === 'menu' ? 'Menú (Categorías + Productos)' :
                         'Órdenes'}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {step.step === 'stores' ? `${step.progress} de ${step.total} locales` :
                         step.step === 'menu' ? `${step.progress} de ${step.total} grupos` :
                         `${step.progress} de ${step.total} stores`}
                      </span>
                    </div>

                    {/* Progress bar */}
                    {step.status === 'in_progress' || step.status === 'completed' ? (
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            step.status === 'completed' ? 'bg-green-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${(step.progress / step.total) * 100}%` }}
                        />
                      </div>
                    ) : null}

                    {/* Message */}
                    {step.message && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {step.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sync error */}
      {syncError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200">{syncError}</p>
        </div>
      )}

      {/* All completed message */}
      {syncProgress.steps.every(s => s.status === 'completed') && (
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <Check className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
          <p className="font-semibold text-green-900 dark:text-green-100">¡Sincronización completada!</p>
        </div>
      )}
    </div>
  );
}
