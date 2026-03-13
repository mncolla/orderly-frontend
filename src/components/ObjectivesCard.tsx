import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { OrganizationObjective } from '../types/organization';
import { objectiveTypeLabels } from '../types/organization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ObjectivesCardProps {
  objectives: OrganizationObjective[];
  currentValues?: Record<string, number>; // Para calcular progreso (clave: objective type, valor: actual)
}

export function ObjectivesCard({ objectives, currentValues }: ObjectivesCardProps) {
  if (!objectives || objectives.length === 0) {
    return null;
  }

  const getObjectiveStatus = (objective: OrganizationObjective) => {
    if (currentValues && objective.currentValue !== undefined) {
      const current = objective.currentValue;
      const target = objective.target;
      const isIncrease = objective.type.includes('INCREASE') || objective.type.includes('IMPROVE');
      const isReduce = objective.type.includes('REDUCE') || objective.type.includes('IMPROVE');

      if (isIncrease) {
        if (current >= target) return 'success';
        if (current >= target * 0.9) return 'warning';
        return 'danger';
      }
      if (isReduce) {
        if (current <= target) return 'success';
        if (current <= target * 1.1) return 'warning';
        return 'danger';
      }
    }
    return 'neutral';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'danger': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <TrendingUp className="h-4 w-4" />;
      case 'danger': return <TrendingDown className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const getProgress = (objective: OrganizationObjective) => {
    if (currentValues && objective.currentValue !== undefined) {
      const current = objective.currentValue;
      const target = objective.target;
      const isIncrease = objective.type.includes('INCREASE') || objective.type.includes('IMPROVE');
      const isReduce = objective.type.includes('REDUCE');

      if (isIncrease) {
        return Math.min(Math.round((current / target) * 100), 100);
      }
      if (isReduce) {
        // Para reducciones, calculamos inversamente
        const baseline = currentValues[`${objective.type}_baseline`] || current * 1.2;
        const reduction = baseline - current;
        const targetReduction = baseline - target;
        return Math.min(Math.round((reduction / targetReduction) * 100), 100);
      }
    }
    return 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-600" />
          Objetivos
        </CardTitle>
        <CardDescription>
          Progreso hacia tus objetivos de negocio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {objectives.map((objective, index) => {
            const status = getObjectiveStatus(objective);
            const progress = getProgress(objective);
            const isIncrease = objective.type.includes('INCREASE');
            const isReduce = objective.type.includes('REDUCE');

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {objectiveTypeLabels[objective.type]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)} flex items-center gap-1`}>
                      {getStatusIcon(status)}
                      {status === 'success' && '¡Logrado!'}
                      {status === 'warning' && 'Cerca'}
                      {status === 'danger' && 'En progreso'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {objective.currentValue !== undefined ? (
                      <>
                        {objective.currentValue}
                        {objective.unit === 'PERCENTAGE' && '%'}
                        {objective.unit === 'CURRENCY' && '$'}
                        {objective.unit === 'MINUTES' && ' min'}
                        <span className="text-gray-500 font-normal"> / {objective.target}</span>
                      </>
                    ) : (
                      `Meta: ${objective.target}${objective.unit === 'PERCENTAGE' ? '%' : objective.unit === 'CURRENCY' ? '$' : ''}`
                    )}
                  </span>
                </div>

                {/* Progress bar */}
                {objective.currentValue !== undefined && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        status === 'success' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {/* Trend indicator */}
                {objective.currentValue !== undefined && (
                  <div className="flex items-center gap-1 text-xs">
                    {isIncrease && (
                      <span className={progress >= 100 ? 'text-green-600' : 'text-gray-500'}>
                        {progress >= 100 ? '✓ Objetivo alcanzado' : `${progress}% completado`}
                      </span>
                    )}
                    {isReduce && (
                      <span className={progress >= 100 ? 'text-green-600' : 'text-gray-500'}>
                        {progress >= 100 ? '✓ Objetivo alcanzado' : `${progress}% completado`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {objectives.length === 0 && (
          <div className="text-center py-8">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              No hay objetivos configurados
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Ve a Settings para configurar tus objetivos
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
