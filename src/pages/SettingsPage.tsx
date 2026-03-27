import { useState, useEffect } from 'react';
import { Save, Loader2, Settings, Store, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { platformIntegrationsService } from '../services/platformIntegrationsService';
import { storesService } from '../services/storesService';
import type { OrganizationCosts, OrganizationObjective } from '../types/organization';
import { objectiveTypeLabels, ObjectiveType, ObjectiveUnit } from '../types/organization';
import type { StoreConfig, ConfigSource } from '../types/integrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface StoreWithConfig {
  id: string;
  name: string;
  chainName: string;
  city: string | null;
  country: string | null;
  configSource: ConfigSource;
  config?: StoreConfig;
  hasCustomConfig: boolean;
}

export function SettingsPage() {
  const { user, refetchUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Stores with config state
  const [stores, setStores] = useState<StoreWithConfig[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);

  // Store config modal state
  const [selectedStore, setSelectedStore] = useState<StoreWithConfig | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isLoadingStoreConfig, setIsLoadingStoreConfig] = useState(false);
  const [isSavingStoreConfig, setIsSavingStoreConfig] = useState(false);

  // Store config form state
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    platformCommission: null,
    markupPercentage: null,
    fixedMonthlyCosts: null,
    packagingCost: null,
    deliveryCost: null,
  });

  // Default config state
  const [defaultConfig, setDefaultConfig] = useState<StoreConfig>({
    platformCommission: 15,
    markupPercentage: 30,
    fixedMonthlyCosts: 0,
    packagingCost: 0,
    deliveryCost: 0,
  });

  // Objectives state
  const [objectives, setObjectives] = useState<OrganizationObjective[]>([]);

  // Load stores with their config status
  useEffect(() => {
    loadStores();
  }, [user]);

  const loadStores = async () => {
    if (!user?.integrations || user.integrations.length === 0) return;

    setIsLoadingStores(true);
    try {
      const { stores: userStores } = await storesService.list();

      // Load config status for each store
      const storesWithConfig = await Promise.all(
        userStores.map(async (store) => {
          try {
            const configData = await storesService.getConfig(store.id);
            return {
              id: store.id,
              name: store.name,
              chainName: store.chainName,
              city: store.city,
              country: store.country,
              configSource: configData.source,
              config: configData.config,
              hasCustomConfig: configData.source === 'store',
            };
          } catch (error) {
            console.error(`Error loading config for store ${store.id}:`, error);
            return {
              id: store.id,
              name: store.name,
              chainName: store.chainName,
              city: store.city,
              country: store.country,
              configSource: 'user' as ConfigSource,
              config: undefined,
              hasCustomConfig: false,
            };
          }
        })
      );

      setStores(storesWithConfig);
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setIsLoadingStores(false);
    }
  };

  // Load store config when modal opens
  useEffect(() => {
    if (selectedStore && isConfigModalOpen) {
      loadStoreConfig(selectedStore.id);
    }
  }, [selectedStore, isConfigModalOpen]);

  const loadStoreConfig = async (storeId: string) => {
    setIsLoadingStoreConfig(true);
    try {
      const configData = await storesService.getConfig(storeId);
      setStoreConfig(configData.config);
    } catch (error) {
      console.error('Error loading store config:', error);
    } finally {
      setIsLoadingStoreConfig(false);
    }
  };

  const openStoreConfig = (store: StoreWithConfig) => {
    setSelectedStore(store);
    setIsConfigModalOpen(true);
  };

  const closeStoreConfig = () => {
    setSelectedStore(null);
    setIsConfigModalOpen(false);
    setStoreConfig({
      platformCommission: null,
      markupPercentage: null,
      fixedMonthlyCosts: null,
      packagingCost: null,
      deliveryCost: null,
    });
  };

  const saveStoreConfig = async () => {
    if (!selectedStore) return;

    setIsSavingStoreConfig(true);
    try {
      // Convert StoreConfig to update request (only include non-null values)
      const configData: Record<string, number> = {};
      if (storeConfig.platformCommission !== null) configData.platformCommission = storeConfig.platformCommission;
      if (storeConfig.markupPercentage !== null) configData.markupPercentage = storeConfig.markupPercentage;
      if (storeConfig.fixedMonthlyCosts !== null) configData.fixedMonthlyCosts = storeConfig.fixedMonthlyCosts;
      if (storeConfig.packagingCost !== null) configData.packagingCost = storeConfig.packagingCost;
      if (storeConfig.deliveryCost !== null) configData.deliveryCost = storeConfig.deliveryCost;

      if (selectedStore.hasCustomConfig) {
        // Update existing config
        await storesService.updateConfig(selectedStore.id, configData);
      } else {
        // Create new config
        await storesService.createConfig(selectedStore.id, configData);
      }

      // Reload stores to update status
      await loadStores();
      closeStoreConfig();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving store config:', error);
    } finally {
      setIsSavingStoreConfig(false);
    }
  };

  const resetStoreToDefaults = async () => {
    if (!selectedStore) return;

    setIsSavingStoreConfig(true);
    try {
      await storesService.deleteConfig(selectedStore.id);
      await loadStores();
      closeStoreConfig();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error resetting store config:', error);
    } finally {
      setIsSavingStoreConfig(false);
    }
  };

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

  const handleSaveDefaultConfig = async () => {
    if (!user?.integrations || user.integrations.length === 0) return;

    const integrationId = user.integrations[0]?.id;

    if (!integrationId) return;

    setIsLoading(true);
    setSaveSuccess(false);
    try {
      // Map StoreConfig to OrganizationCosts format
      const costs: OrganizationCosts = {
        platformCommission: defaultConfig.platformCommission || 0,
        markup: defaultConfig.markupPercentage || 0,
        fixedCosts: defaultConfig.fixedMonthlyCosts || 0,
        variableCosts: (defaultConfig.packagingCost || 0) + (defaultConfig.deliveryCost || 0),
      };

      await platformIntegrationsService.completeOnboarding(integrationId, {
        costs,
        objectives,
      });

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuración</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gestiona los gastos y objetivos de tu negocio
          </p>
        </div>

        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-800 dark:text-green-200">
              Configuración guardada exitosamente
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Default Configuration Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuración Predeterminada
                  </CardTitle>
                  <CardDescription>
                    Estos valores se aplican a todos tus locales. Puedes sobreescribirlos por local abajo.
                  </CardDescription>
                </div>
                <Button
                  onClick={handleSaveDefaultConfig}
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
                      Guardar
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultPlatformCommission">Comisión de Plataforma (%)</Label>
                  <Input
                    id="defaultPlatformCommission"
                    type="number"
                    value={defaultConfig.platformCommission || ''}
                    onChange={(e) => setDefaultConfig({ ...defaultConfig, platformCommission: Number(e.target.value) || null })}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500">Ej: PedidosYa cobra 15%</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultMarkup">Markup (%)</Label>
                  <Input
                    id="defaultMarkup"
                    type="number"
                    value={defaultConfig.markupPercentage || ''}
                    onChange={(e) => setDefaultConfig({ ...defaultConfig, markupPercentage: Number(e.target.value) || null })}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500">Porcentaje de incremento sobre el costo</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultFixedCosts">Costos Fijos Mensuales ($)</Label>
                  <Input
                    id="defaultFixedCosts"
                    type="number"
                    value={defaultConfig.fixedMonthlyCosts || ''}
                    onChange={(e) => setDefaultConfig({ ...defaultConfig, fixedMonthlyCosts: Number(e.target.value) || null })}
                    min="0"
                  />
                  <p className="text-xs text-gray-500">Alquiler, servicios, sueldos</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultPackagingCost">Costo de Packaging ($)</Label>
                  <Input
                    id="defaultPackagingCost"
                    type="number"
                    value={defaultConfig.packagingCost || ''}
                    onChange={(e) => setDefaultConfig({ ...defaultConfig, packagingCost: Number(e.target.value) || null })}
                    min="0"
                  />
                  <p className="text-xs text-gray-500">Empaquetado por pedido</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultDeliveryCost">Costo de Delivery ($)</Label>
                  <Input
                    id="defaultDeliveryCost"
                    type="number"
                    value={defaultConfig.deliveryCost || ''}
                    onChange={(e) => setDefaultConfig({ ...defaultConfig, deliveryCost: Number(e.target.value) || null })}
                    min="0"
                  />
                  <p className="text-xs text-gray-500">Costo de envío por pedido</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store-Specific Configurations Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Configuración por Local
              </CardTitle>
              <CardDescription>
                Configura valores personalizados para cada local
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStores ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : stores.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay locales configurados
                </div>
              ) : (
                <div className="space-y-3">
                  {stores.map((store) => (
                    <div
                      key={store.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{store.name}</h4>
                          {store.hasCustomConfig ? (
                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                              Personalizado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600">
                              Predeterminado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {store.chainName}
                          {store.city && ` • ${store.city}`}
                          {store.country && ` • ${store.country}`}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openStoreConfig(store)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configurar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Store Config Modal */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Configurar: {selectedStore?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedStore?.hasCustomConfig
                ? 'Edita la configuración personalizada de este local'
                : 'Configura valores personalizados para este local. Los campos vacíos usarán los valores predeterminados.'}
            </DialogDescription>
          </DialogHeader>

          {isLoadingStoreConfig ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  {selectedStore?.hasCustomConfig
                    ? 'Este local usa configuración personalizada. Todos los valores definidos aquí reemplazan los valores predeterminados.'
                    : 'Deja los campos vacíos para usar los valores predeterminados. Solo completa los campos que quieras personalizar.'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storePlatformCommission">Comisión de Plataforma (%)</Label>
                  <Input
                    id="storePlatformCommission"
                    type="number"
                    value={storeConfig.platformCommission || ''}
                    onChange={(e) => setStoreConfig({ ...storeConfig, platformCommission: Number(e.target.value) || null })}
                    placeholder="Predeterminado"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeMarkup">Markup (%)</Label>
                  <Input
                    id="storeMarkup"
                    type="number"
                    value={storeConfig.markupPercentage || ''}
                    onChange={(e) => setStoreConfig({ ...storeConfig, markupPercentage: Number(e.target.value) || null })}
                    placeholder="Predeterminado"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeFixedCosts">Costos Fijos Mensuales ($)</Label>
                  <Input
                    id="storeFixedCosts"
                    type="number"
                    value={storeConfig.fixedMonthlyCosts || ''}
                    onChange={(e) => setStoreConfig({ ...storeConfig, fixedMonthlyCosts: Number(e.target.value) || null })}
                    placeholder="Predeterminado"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storePackagingCost">Costo de Packaging ($)</Label>
                  <Input
                    id="storePackagingCost"
                    type="number"
                    value={storeConfig.packagingCost || ''}
                    onChange={(e) => setStoreConfig({ ...storeConfig, packagingCost: Number(e.target.value) || null })}
                    placeholder="Predeterminado"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeDeliveryCost">Costo de Delivery ($)</Label>
                  <Input
                    id="storeDeliveryCost"
                    type="number"
                    value={storeConfig.deliveryCost || ''}
                    onChange={(e) => setStoreConfig({ ...storeConfig, deliveryCost: Number(e.target.value) || null })}
                    placeholder="Predeterminado"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedStore?.hasCustomConfig && (
              <Button
                variant="outline"
                onClick={resetStoreToDefaults}
                disabled={isSavingStoreConfig}
                className="text-red-600 hover:text-red-700"
              >
                Restablecer a Predeterminados
              </Button>
            )}
            <Button variant="outline" onClick={closeStoreConfig} disabled={isSavingStoreConfig}>
              Cancelar
            </Button>
            <Button
              onClick={saveStoreConfig}
              disabled={isSavingStoreConfig}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSavingStoreConfig ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
