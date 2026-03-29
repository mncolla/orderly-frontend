import { useState, useEffect } from 'react';
import { Save, Loader2, Settings as SettingsIcon, Store, AlertCircle, SlidersHorizontal, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { platformIntegrationsService } from '../services/platformIntegrationsService';
import { storesService } from '../services/storesService';
import type { OrganizationCosts } from '../types/organization';
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
import { toast } from 'sonner';

interface StoreWithConfig {
  id: string;
  name: string;
  chainName: string;
  city: string | null;
  country: string | null;
  platform: string;
  configSource: ConfigSource;
  config?: StoreConfig;
  hasCustomConfig: boolean;
}

interface GroupedStores {
  [platform: string]: {
    [chainName: string]: StoreWithConfig[];
  };
}

export function StoresPage() {
  const { user, refetchUser } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

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

  // Expanded groups for accordion
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());
  const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set());

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
              platform: store.platform || 'Unknown',
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
              platform: store.platform || 'Unknown',
              configSource: 'user' as ConfigSource,
              config: undefined,
              hasCustomConfig: false,
            };
          }
        })
      );

      setStores(storesWithConfig);

      // Expand all by default
      const platforms = new Set(storesWithConfig.map(s => s.platform));
      setExpandedPlatforms(platforms);
      setExpandedChains(new Set(storesWithConfig.map(s => `${s.platform}-${s.chainName}`)));
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setIsLoadingStores(false);
    }
  };

  const groupStores = (): GroupedStores => {
    const grouped: GroupedStores = {};
    stores.forEach(store => {
      if (!grouped[store.platform]) {
        grouped[store.platform] = {};
      }
      if (!grouped[store.platform][store.chainName]) {
        grouped[store.platform][store.chainName] = [];
      }
      grouped[store.platform][store.chainName].push(store);
    });
    return grouped;
  };

  const togglePlatform = (platform: string) => {
    const newExpanded = new Set(expandedPlatforms);
    if (newExpanded.has(platform)) {
      newExpanded.delete(platform);
    } else {
      newExpanded.add(platform);
    }
    setExpandedPlatforms(newExpanded);
  };

  const toggleChain = (platform: string, chainName: string) => {
    const key = `${platform}-${chainName}`;
    const newExpanded = new Set(expandedChains);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedChains(newExpanded);
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      'PEDIDOS_YA': '🟡',
      'RAPPI': '🟢',
      'GLOVO': '🟣',
      'UBER_EATS': '🔵',
    };
    return icons[platform] || '⚪';
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
      toast.success(t('stores.toastSaved'));
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
      toast.success(t('stores.toastReset'));
    } catch (error) {
      console.error('Error resetting store config:', error);
    } finally {
      setIsSavingStoreConfig(false);
    }
  };

  const handleSaveDefaultConfig = async () => {
    if (!user?.integrations || user.integrations.length === 0) return;

    const integrationId = user.integrations[0]?.id;
    if (!integrationId) return;

    setIsLoading(true);
    try {
      const costs: OrganizationCosts = {
        platformCommission: defaultConfig.platformCommission || 0,
        markup: defaultConfig.markupPercentage || 0,
        fixedCosts: defaultConfig.fixedMonthlyCosts || 0,
        variableCosts: (defaultConfig.packagingCost || 0) + (defaultConfig.deliveryCost || 0),
      };

      await platformIntegrationsService.completeOnboarding(integrationId, {
        costs,
        objectives: [],
      });

      await refetchUser?.();
      toast.success(t('stores.toastDefaultSaved'));
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
          <p className="text-gray-600 dark:text-gray-400">{t('stores.loading')}</p>
        </div>
      </div>
    );
  }

  const groupedStores = groupStores();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30">
            <Store className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              {t('stores.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('stores.description')}
            </p>
          </div>
        </div>
      </div>

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
                    {t('stores.defaultConfig')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('stores.defaultConfigDesc')}
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
                    {t('stores.saving')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('stores.save')}
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <ConfigInput
                id="defaultPlatformCommission"
                label={t('stores.platformCommission')}
                suffix="%"
                value={defaultConfig.platformCommission}
                onChange={(v) => setDefaultConfig({ ...defaultConfig, platformCommission: v })}
                helper={t('stores.exampleCommission')}
              />
              <ConfigInput
                id="defaultMarkup"
                label={t('stores.markup')}
                suffix="%"
                value={defaultConfig.markupPercentage}
                onChange={(v) => setDefaultConfig({ ...defaultConfig, markupPercentage: v })}
                helper={t('stores.markupDesc')}
              />
              <ConfigInput
                id="defaultCostOfGoods"
                label={t('stores.costOfGoods')}
                suffix="%"
                value={defaultConfig.costOfGoods}
                onChange={(v) => setDefaultConfig({ ...defaultConfig, costOfGoods: v })}
                helper={t('stores.costOfGoodsDesc')}
              />
              <ConfigInput
                id="defaultFixedCosts"
                label={t('stores.fixedMonthlyCosts')}
                suffix="$"
                value={defaultConfig.fixedMonthlyCosts}
                onChange={(v) => setDefaultConfig({ ...defaultConfig, fixedMonthlyCosts: v })}
                helper={t('stores.fixedCostsDesc')}
              />
              <ConfigInput
                id="defaultPackagingCost"
                label={t('stores.packagingCost')}
                suffix="$"
                value={defaultConfig.packagingCost}
                onChange={(v) => setDefaultConfig({ ...defaultConfig, packagingCost: v })}
                helper={t('stores.packagingCostDesc')}
              />
              <ConfigInput
                id="defaultDeliveryCost"
                label={t('stores.deliveryCost')}
                suffix="$"
                value={defaultConfig.deliveryCost}
                onChange={(v) => setDefaultConfig({ ...defaultConfig, deliveryCost: v })}
                helper={t('stores.deliveryCostDesc')}
              />
            </div>
          </div>
        </div>

        {/* Stores List Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Store className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('stores.storeConfig')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('stores.storeConfigDesc')}
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
                <p className="text-gray-500 dark:text-gray-400">{t('stores.noStores')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedStores).map(([platform, chains]) => (
                  <div key={platform} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    {/* Platform Header */}
                    <button
                      onClick={() => togglePlatform(platform)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getPlatformIcon(platform)}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {platform.replace('_', ' ')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {Object.values(chains).flat().length} {t('stores.storesCount')}
                        </Badge>
                      </div>
                      {expandedPlatforms.has(platform) ? (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                      )}
                    </button>

                    {/* Chains */}
                    {expandedPlatforms.has(platform) && (
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {Object.entries(chains).map(([chainName, storeList]) => (
                          <div key={chainName}>
                            {/* Chain Header */}
                            <button
                              onClick={() => toggleChain(platform, chainName)}
                              className="w-full px-6 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between text-sm"
                            >
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {chainName}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {storeList.length}
                                </Badge>
                                {expandedChains.has(`${platform}-${chainName}`) ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                              </div>
                            </button>

                            {/* Stores */}
                            {expandedChains.has(`${platform}-${chainName}`) && (
                              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {storeList.map((store) => (
                                  <div
                                    key={store.id}
                                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">{store.name}</h4>
                                        {store.hasCustomConfig ? (
                                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0 text-xs">
                                            {t('stores.customConfig')}
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-gray-600 border-gray-300 dark:border-gray-600 text-xs">
                                            {t('stores.default')}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {store.city && `${store.city}`}
                                        {store.city && store.country && ' • '}
                                        {store.country && `${store.country}`}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openStoreConfig(store)}
                                      className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20"
                                    >
                                      <SettingsIcon className="h-5 w-5" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Store Config Modal */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Store className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              {t('stores.configure', { name: selectedStore?.name })}
            </DialogTitle>
            <DialogDescription>
              {selectedStore?.hasCustomConfig
                ? t('stores.editCustom')
                : t('stores.setupCustom')}
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
                    ? t('stores.customConfigInfo')
                    : t('stores.emptyFieldsInfo')}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ConfigInputModal
                  id="storePlatformCommission"
                  label={t('stores.platformCommission')}
                  suffix="%"
                  value={storeConfig.platformCommission}
                  onChange={(v) => setStoreConfig({ ...storeConfig, platformCommission: v })}
                  placeholder={t('stores.default')}
                />
                <ConfigInputModal
                  id="storeMarkup"
                  label={t('stores.markup')}
                  suffix="%"
                  value={storeConfig.markupPercentage}
                  onChange={(v) => setStoreConfig({ ...storeConfig, markupPercentage: v })}
                  placeholder={t('stores.default')}
                />
                <ConfigInputModal
                  id="storeCostOfGoods"
                  label={t('stores.costOfGoods')}
                  suffix="%"
                  value={storeConfig.costOfGoods}
                  onChange={(v) => setStoreConfig({ ...storeConfig, costOfGoods: v })}
                  placeholder={t('stores.default')}
                />
                <ConfigInputModal
                  id="storeFixedCosts"
                  label={t('stores.fixedMonthlyCosts')}
                  suffix="$"
                  value={storeConfig.fixedMonthlyCosts}
                  onChange={(v) => setStoreConfig({ ...storeConfig, fixedMonthlyCosts: v })}
                  placeholder={t('stores.default')}
                />
                <ConfigInputModal
                  id="storePackagingCost"
                  label={t('stores.packagingCost')}
                  suffix="$"
                  value={storeConfig.packagingCost}
                  onChange={(v) => setStoreConfig({ ...storeConfig, packagingCost: v })}
                  placeholder={t('stores.default')}
                />
                <ConfigInputModal
                  id="storeDeliveryCost"
                  label={t('stores.deliveryCost')}
                  suffix="$"
                  value={storeConfig.deliveryCost}
                  onChange={(v) => setStoreConfig({ ...storeConfig, deliveryCost: v })}
                  placeholder={t('stores.default')}
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
                {t('stores.resetToDefaults')}
              </Button>
            )}
            <Button variant="outline" onClick={closeStoreConfig} disabled={isSavingStoreConfig}>
              {t('stores.cancel')}
            </Button>
            <Button
              onClick={saveStoreConfig}
              disabled={isSavingStoreConfig}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
            >
              {isSavingStoreConfig ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('stores.saving')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('stores.save')}
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
