import { useState, useEffect } from 'react';
import { Save, Loader2, Settings as SettingsIcon, Store, Check, AlertCircle, SlidersHorizontal, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { platformIntegrationsService } from '../services/platformIntegrationsService';
import { storesService } from '../services/storesService';
import type { OrganizationCosts, OrganizationObjective } from '../types/organization';
import { objectiveTypeLabels, ObjectiveType, ObjectiveUnit } from '../types/organization';
import type { StoreConfig, ConfigSource } from '../types/integrations';
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

  const [stores, setStores] = useState<StoreWithConfig[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);

  const [selectedStore, setSelectedStore] = useState<StoreWithConfig | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isLoadingStoreConfig, setIsLoadingStoreConfig] = useState(false);
  const [isSavingStoreConfig, setIsSavingStoreConfig] = useState(false);

  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    platformCommission: null,
    markupPercentage: null,
    costOfGoods: null,
    fixedMonthlyCosts: null,
    packagingCost: null,
    deliveryCost: null,
  });

  const [defaultConfig, setDefaultConfig] = useState<StoreConfig>({
    platformCommission: 15,
    markupPercentage: 30,
    costOfGoods: 30,
    fixedMonthlyCosts: 0,
    packagingCost: 0,
    deliveryCost: 0,
  });

  const [objectives, setObjectives] = useState<OrganizationObjective[]>([]);

  useEffect(() => {
    loadStores();
  }, [user]);

  const loadStores = async () => {
    if (!user?.integrations || user.integrations.length === 0) return;

    setIsLoadingStores(true);
    try {
      const { stores: userStores } = await storesService.list();

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
      costOfGoods: null,
      fixedMonthlyCosts: null,
      packagingCost: null,
      deliveryCost: null,
    });
  };

  const saveStoreConfig = async () => {
    if (!selectedStore) return;

    setIsSavingStoreConfig(true);
    try {
      const configData: Record<string, number> = {};
      if (storeConfig.platformCommission !== null) configData.platformCommission = storeConfig.platformCommission;
      if (storeConfig.markupPercentage !== null) configData.markupPercentage = storeConfig.markupPercentage;
      if (storeConfig.fixedMonthlyCosts !== null) configData.fixedMonthlyCosts = storeConfig.fixedMonthlyCosts;
      if (storeConfig.packagingCost !== null) configData.packagingCost = storeConfig.packagingCost;
      if (storeConfig.deliveryCost !== null) configData.deliveryCost = storeConfig.deliveryCost;

      if (selectedStore.hasCustomConfig) {
        await storesService.updateConfig(selectedStore.id, configData);
      } else {
        await storesService.createConfig(selectedStore.id, configData);
      }

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
            <SettingsIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Configuración
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gestiona los gastos y objetivos de tu negocio
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 animate-in slide-in-from-top">
          <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Configuración guardada exitosamente
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Default Configuration Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <SlidersHorizontal className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Configuración Predeterminada
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Estos valores se aplican a todos tus locales
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSaveDefaultConfig}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 font-medium"
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
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <ConfigInput
                id="defaultPlatformCommission"
                label="Comisión de Plataforma"
                suffix="%"
                value={defaultConfig.platformCommission}
                onChange={(v) => setDefaultConfig({ ...defaultConfig, platformCommission: v })}
                helper="Ej: PedidosYa cobra 15%"
              />
              <ConfigInput
                id="defaultMarkup"
                label="Markup"
                suffix="%"
                value={defaultConfig.markupPercentage}
                onChange={(v) => setDefaultConfig({ ...defaultConfig, markupPercentage: v })}
                helper="Porcentaje de incremento sobre el costo"
              />
              <ConfigInput
                id="defaultCostOfGoods"
                label="CMV - Costo de Mercadería"
                suffix="%"
                value={defaultConfig.costOfGoods}
                onChange={(v) => setDefaultConfig({ ...defaultConfig, costOfGoods: v })}
                helper="Costo de insumos como % del precio"
              />
              <ConfigInput
                id="defaultFixedCosts"
                label="Costos Fijos Mensuales"
                suffix="$"
                value={defaultConfig.fixedMonthlyCosts}
                onChange={(v) => setDefaultConfig({ ...defaultConfig, fixedMonthlyCosts: v })}
                helper="Alquiler, servicios, sueldos"
              />
              <ConfigInput
                id="defaultPackagingCost"
                label="Costo de Packaging"
                suffix="$"
                value={defaultConfig.packagingCost}
                onChange={(v) => setDefaultConfig({ ...defaultConfig, packagingCost: v })}
                helper="Empaquetado por pedido"
              />
              <ConfigInput
                id="defaultDeliveryCost"
                label="Costo de Delivery"
                suffix="$"
                value={defaultConfig.deliveryCost}
                onChange={(v) => setDefaultConfig({ ...defaultConfig, deliveryCost: v })}
                helper="Costo de envío por pedido"
              />
            </div>
          </div>
        </div>

        {/* Store-Specific Configurations Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Store className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Configuración por Local
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Personaliza valores para cada local específico
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isLoadingStores ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : stores.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No hay locales configurados</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {stores.map((store) => (
                  <div
                    key={store.id}
                    className="flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{store.name}</h4>
                        {store.hasCustomConfig ? (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0 text-xs">
                            Personalizado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 border-gray-300 dark:border-gray-600 text-xs">
                            Predeterminado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {store.chainName}
                        {store.city && ` • ${store.city}`}
                        {store.country && ` • ${store.country}`}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openStoreConfig(store)}
                      className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium"
                    >
                      <SettingsIcon className="h-4 w-4 mr-1" />
                      Configurar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Objectives Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Objetivos de Negocio
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Define qué quieres lograr para optimizar tu negocio
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {objectives.map((objective, index) => (
                <div key={index} className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl relative bg-gray-50 dark:bg-gray-800">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Objetivo</Label>
                      <select
                        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                        value={objective.type}
                        onChange={(e) => updateObjective(index, 'type', e.target.value)}
                      >
                        {Object.entries(objectiveTypeLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Valor</Label>
                      <Input
                        type="number"
                        value={objective.target}
                        onChange={(e) => updateObjective(index, 'target', Number(e.target.value))}
                        min="0"
                        className="border-gray-300 dark:border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Unidad</Label>
                      <select
                        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
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
                      className="absolute top-3 right-3 text-red-600 hover:text-red-700 dark:text-red-400 text-sm font-medium"
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
                className="w-full border-2 border-dashed"
              >
                + Agregar Objetivo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Store Config Modal */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Store className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Configurar: {selectedStore?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedStore?.hasCustomConfig
                ? 'Edita la configuración personalizada de este local'
                : 'Configura valores personalizados. Los campos vacíos usarán los valores predeterminados.'}
            </DialogDescription>
          </DialogHeader>

          {isLoadingStoreConfig ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  {selectedStore?.hasCustomConfig
                    ? 'Este local usa configuración personalizada. Todos los valores definidos aquí reemplazan los valores predeterminados.'
                    : 'Deja los campos vacíos para usar los valores predeterminados. Solo completa los campos que quieras personalizar.'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ConfigInputModal
                  id="storePlatformCommission"
                  label="Comisión de Plataforma"
                  suffix="%"
                  value={storeConfig.platformCommission}
                  onChange={(v) => setStoreConfig({ ...storeConfig, platformCommission: v })}
                  placeholder="Predeterminado"
                />
                <ConfigInputModal
                  id="storeMarkup"
                  label="Markup"
                  suffix="%"
                  value={storeConfig.markupPercentage}
                  onChange={(v) => setStoreConfig({ ...storeConfig, markupPercentage: v })}
                  placeholder="Predeterminado"
                />
                <ConfigInputModal
                  id="storeCostOfGoods"
                  label="CMV - Costo de Mercadería"
                  suffix="%"
                  value={storeConfig.costOfGoods}
                  onChange={(v) => setStoreConfig({ ...storeConfig, costOfGoods: v })}
                  placeholder="Predeterminado"
                />
                <ConfigInputModal
                  id="storeFixedCosts"
                  label="Costos Fijos Mensuales"
                  suffix="$"
                  value={storeConfig.fixedMonthlyCosts}
                  onChange={(v) => setStoreConfig({ ...storeConfig, fixedMonthlyCosts: v })}
                  placeholder="Predeterminado"
                />
                <ConfigInputModal
                  id="storePackagingCost"
                  label="Costo de Packaging"
                  suffix="$"
                  value={storeConfig.packagingCost}
                  onChange={(v) => setStoreConfig({ ...storeConfig, packagingCost: v })}
                  placeholder="Predeterminado"
                />
                <ConfigInputModal
                  id="storeDeliveryCost"
                  label="Costo de Delivery"
                  suffix="$"
                  value={storeConfig.deliveryCost}
                  onChange={(v) => setStoreConfig({ ...storeConfig, deliveryCost: v })}
                  placeholder="Predeterminado"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedStore?.hasCustomConfig && (
              <Button
                variant="outline"
                onClick={resetStoreToDefaults}
                disabled={isSavingStoreConfig}
                className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
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
    </div>
  );
}

// Helper components
function ConfigInput({
  id,
  label,
  suffix,
  value,
  onChange,
  helper,
}: {
  id: string;
  label: string;
  suffix: string;
  value: number | null;
  onChange: (value: number | null) => void;
  helper?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || null)}
          min="0"
          max={suffix === '%' ? 100 : undefined}
          className="pr-8 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
          {suffix}
        </span>
      </div>
      {helper && <p className="text-xs text-gray-500 dark:text-gray-400">{helper}</p>}
    </div>
  );
}

function ConfigInputModal({
  id,
  label,
  suffix,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  suffix: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || null)}
          placeholder={placeholder}
          min="0"
          max={suffix === '%' ? 100 : undefined}
          className="pr-8 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
          {suffix}
        </span>
      </div>
    </div>
  );
}
