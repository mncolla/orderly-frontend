import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { platformIntegrationsService } from '../services/platformIntegrationsService';
import type { OrganizationCosts, OrganizationObjective } from '../types/organization';
import { objectiveTypeLabels, ObjectiveType, ObjectiveUnit } from '../types/organization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SettingsPage() {
  const { user, refetchUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Costs state
  const [costs, setCosts] = useState<OrganizationCosts>({
    platformCommission: 15,
    markup: 30,
    fixedCosts: 0,
    variableCosts: 0,
    costOfGoods: 0,
  });

  // Objectives state
  const [objectives, setObjectives] = useState<OrganizationObjective[]>([]);

  // Cargar configuración actual
  useEffect(() => {
    if (user?.integrations && user.integrations.length > 0) {
      const integrationId = user.integrations[0].id;
      platformIntegrationsService.getById(integrationId).then(() => {
        // Por ahora, no hay settings en la nueva estructura
        // Se pueden cargar valores por defecto si es necesario
        setCosts({
          platformCommission: 15,
          markup: 30,
          fixedCosts: 0,
          variableCosts: 0,
          costOfGoods: 0,
        });
        setObjectives([]);
      });
    }
  }, [user]);

  const addObjective = () => {
    setObjectives([
      ...objectives,
      {
        type: 'INCREASE_SALES_VOLUME' as ObjectiveType,
        target: 10,
        unit: 'PERCENTAGE' as ObjectiveUnit,
      },
    ]);
  };

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const updateObjective = (index: number, field: keyof OrganizationObjective, value: any) => {
    const newObjectives = [...objectives];
    newObjectives[index] = { ...newObjectives[index], [field]: value };
    setObjectives(newObjectives);
  };

  const handleSave = async () => {
    if (!user?.integrations || user.integrations.length === 0) return;

    const integrationId = user.integrations[0].id;

    setIsLoading(true);
    setSaveSuccess(false);
    try {
      // Completar onboarding con los settings actuales
      await platformIntegrationsService.completeOnboarding(integrationId, {
        costs,
        objectives,
      });

      // Recargar usuario para obtener datos actualizados
      await refetchUser?.();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.integrations || user.integrations.length === 0) {
    return (
      <main className="py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center text-gray-600 dark:text-gray-400">
            Cargando configuración...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuración</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Gestiona los gastos y objetivos de tu negocio
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>

        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Configuración guardada exitosamente
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Costs Section */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos y Costos</CardTitle>
              <CardDescription>
                Configura los costos de tu operación para calcular márgenes reales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platformCommission">Comisión de Platajeta (%)</Label>
                  <Input
                    id="platformCommission"
                    type="number"
                    value={costs.platformCommission}
                    onChange={(e) => setCosts({ ...costs, platformCommission: Number(e.target.value) })}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500">Ej: PedidosYa cobra 15%</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="markup">Markup (%)</Label>
                  <Input
                    id="markup"
                    type="number"
                    value={costs.markup}
                    onChange={(e) => setCosts({ ...costs, markup: Number(e.target.value) })}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500">Porcentaje de incremento sobre el costo</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fixedCosts">Costos Fijos Mensuales ($)</Label>
                  <Input
                    id="fixedCosts"
                    type="number"
                    value={costs.fixedCosts}
                    onChange={(e) => setCosts({ ...costs, fixedCosts: Number(e.target.value) })}
                    min="0"
                  />
                  <p className="text-xs text-gray-500">Alquiler, servicios, sueldos</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="variableCosts">Costos Variables ($)</Label>
                  <Input
                    id="variableCosts"
                    type="number"
                    value={costs.variableCosts || 0}
                    onChange={(e) => setCosts({ ...costs, variableCosts: Number(e.target.value) })}
                    min="0"
                  />
                  <p className="text-xs text-gray-500">Packaging, delivery (si aplica)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Objectives Section */}
          <Card>
            <CardHeader>
              <CardTitle>Objetivos de Negocio</CardTitle>
              <CardDescription>
                Define qué quieres lograr para que tu agencia pueda ayudarte mejor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {objectives.map((objective, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Objetivo</Label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
                          value={objective.type}
                          onChange={(e) => updateObjective(index, 'type', e.target.value)}
                        >
                          {Object.entries(objectiveTypeLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Valor</Label>
                        <Input
                          type="number"
                          value={objective.target}
                          onChange={(e) => updateObjective(index, 'target', Number(e.target.value))}
                          min="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Unidad</Label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
                          value={objective.unit}
                          onChange={(e) => updateObjective(index, 'unit', e.target.value)}
                        >
                          <option value="PERCENTAGE">%</option>
                          <option value="CURRENCY">$</option>
                          <option value="MINUTES">min</option>
                        </select>
                      </div>
                    </div>

                    {objectives.length > 0 && (
                      <button
                        onClick={() => removeObjective(index)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-700 text-sm"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addObjective}
                  className="w-full"
                >
                  + Agregar Objetivo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
