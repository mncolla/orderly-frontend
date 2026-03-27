import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { weatherService, type ForecastData } from '@/services/weatherService';
import { storesService } from '../services/storesService';
import type { SuggestionType, SuggestionTypeConfig, DeliveryPlatform, StoreConfig, ConfigSource } from '@/types/integrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Clock, TrendingUp, Sparkles, DollarSign, Percent, Timer, Edit3, Store, Zap, Package, Star, Settings, Loader2, Save, AlertCircle, BarChart3, Activity, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Cloud, CloudRain, Sun, Snowflake, Wind, Droplets, Thermometer } from 'lucide-react';

type SuggestionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'APPLIED';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Store {
  id: string;
  name: string;
  chainName: string;
  city: string | null;
  country: string | null;
  platform?: DeliveryPlatform;
}

interface StoreWithGroup {
  chainName: string;
  stores: Store[];
}

interface Suggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  status: SuggestionStatus;
  createdAt: string;
  appliedAt?: string;
  evaluationEnd?: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

interface PlatformIntegration {
  id: string;
  platform: DeliveryPlatform;
  email: string;
  owner: User;
  stores?: Array<{
    id: string;
    name: string;
    chainName: string;
    city: string | null;
    country: string | null;
  }>;
}

interface StoreItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryName: string;
  price: number;
}

interface CategoryWithItems {
  category: string;
  items: StoreItem[];
}

const SUGGESTION_TYPES: SuggestionTypeConfig[] = [
  // Generic types (work on all platforms)
  { value: 'PRICE_CHANGE', label: 'Price Change', icon: DollarSign, description: 'Change the price of an item', platform: null },
  { value: 'PROMOTION', label: 'Promotion', icon: Percent, description: 'Create a time-limited promotion', platform: null },
  { value: 'TEMPORARY_DISABLE', label: 'Temporary Disable', icon: Timer, description: 'Temporarily disable an item', platform: null },
  { value: 'ITEM_IMPROVEMENT', label: 'Item Improvement', icon: Edit3, description: 'Improve item presentation', platform: null },

  // PedidosYa-specific types
  {
    value: 'PEDIDOS_YA_DESCUENTO_FUGAZ',
    label: 'Descuento Fugaz',
    icon: Zap,
    description: 'Descuento por tiempo limitado (PedidosYa)',
    platform: 'PEDIDOS_YA'
  },
  {
    value: 'PEDIDOS_YA_MENU_COMPLETO',
    label: 'Menú Completo',
    icon: Package,
    description: 'Descuento en menú completo (PedidosYa)',
    platform: 'PEDIDOS_YA'
  },
  {
    value: 'PEDIDOS_YA_PRODUCTOS_DESTACADOS',
    label: 'Productos Destacados',
    icon: Star,
    description: 'Destacar en homepage (PedidosYa)',
    platform: 'PEDIDOS_YA'
  },
];

const weatherIcons: Record<string, React.ReactNode> = {
  '01d': <Sun className="h-8 w-8 text-yellow-500" />,
  '01n': <Sun className="h-8 w-8 text-yellow-300" />,
  '02d': <Cloud className="h-8 w-8 text-gray-400" />,
  '02n': <Cloud className="h-8 w-8 text-gray-500" />,
  '03d': <Cloud className="h-8 w-8 text-gray-400" />,
  '03n': <Cloud className="h-8 w-8 text-gray-500" />,
  '04d': <Cloud className="h-8 w-8 text-gray-500" />,
  '04n': <Cloud className="h-8 w-8 text-gray-600" />,
  '09d': <CloudRain className="h-8 w-8 text-blue-500" />,
  '09n': <CloudRain className="h-8 w-8 text-blue-600" />,
  '10d': <CloudRain className="h-8 w-8 text-blue-400" />,
  '10n': <CloudRain className="h-8 w-8 text-blue-500" />,
  '11d': <Cloud className="h-8 w-8 text-gray-600" />,
  '11n': <Cloud className="h-8 w-8 text-gray-700" />,
  '13d': <Snowflake className="h-8 w-8 text-blue-200" />,
  '13n': <Snowflake className="h-8 w-8 text-blue-300" />,
  '50d': <Wind className="h-8 w-8 text-gray-400" />,
  '50n': <Wind className="h-8 w-8 text-gray-500" />,
};

// Componente WeatherForecast
function WeatherForecast({ forecast }: { forecast: ForecastData }) {
  const getDailySummary = (dataPoints: ForecastData['forecast'][0]['dataPoints']) => {
    const temps = dataPoints.map(d => d.temperature.current);
    const minTemp = Math.min(...dataPoints.map(d => d.temperature.min));
    const maxTemp = Math.max(...dataPoints.map(d => d.temperature.max));
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const avgHumidity = dataPoints.reduce((sum, d) => sum + d.atmosphere.humidity, 0) / dataPoints.length;
    const maxPrecipitation = Math.max(...dataPoints.map(d => d.precipitation.probability));

    const conditions = dataPoints.map(d => d.conditions.main);
    const modeCondition = conditions.sort((a, b) =>
      conditions.filter(v => v === a).length - conditions.filter(v => v === b).length
    )[0];

    const middayIcon = dataPoints.find(d => d.datetime.includes('12:00:00'))?.conditions.icon ||
                       dataPoints[0]?.conditions.icon;

    return {
      minTemp,
      maxTemp,
      avgTemp,
      avgHumidity,
      maxPrecipitation,
      modeCondition,
      icon: middayIcon || '01d',
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="space-y-3">
      {forecast.forecast.slice(0, 5).map((day) => {
        const summary = getDailySummary(day.dataPoints);

        return (
          <div key={day.date} className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="text-sm font-medium">{formatDate(day.date)}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {weatherIcons[summary.icon] || <Cloud className="h-8 w-8 text-gray-400" />}
                <div>
                  <p className="text-sm capitalize text-muted-foreground">{summary.modeCondition}</p>
                  <p className="text-xs text-muted-foreground">
                    {summary.avgHumidity.toFixed(0)}% humidity
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    <span className="text-lg font-bold">{Math.round(summary.maxTemp)}°</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Thermometer className="h-3 w-3 text-blue-500" />
                    <span className="text-sm">{Math.round(summary.minTemp)}°</span>
                  </div>
                </div>

                {summary.maxPrecipitation > 30 && (
                  <div className="flex items-center gap-1 text-blue-500" title="Precipitation probability">
                    <Droplets className="h-4 w-4" />
                    <span className="text-sm font-medium">{Math.round(summary.maxPrecipitation)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AgencyPage() {
  // Estado
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userStores, setUserStores] = useState<StoreWithGroup[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Formulario de creación
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedType, setSelectedType] = useState<SuggestionType>('PRICE_CHANGE');

  // Datos del formulario específico
  const [formData, setFormData] = useState({
    itemId: '',
    newPrice: '',
    promotionStart: '',
    promotionEnd: '',
    disableStart: '',
    disableEnd: '',
    newDescription: '',
    newImageUrl: '',
    newPriceImprovement: '',
    // PedidosYa-specific fields
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: '',
    minOrderValue: '',
    maxDiscountAmount: '',
    bundleMainItems: [] as string[],
    bundleDrinkItems: [] as string[],
    bundleSideItems: [] as string[],
    bundlePrice: '',
    bundleName: '',
    featuredPlacement: 'HOMEPAGE_BANNER' as 'HOMEPAGE_BANNER' | 'CATEGORY_TOP' | 'SEARCH_RESULTS',
    featuredPriority: '1',
    bannerType: 'highlight',
    featuredDuration: '',
  });

  // Store config modal state
  const [isStoreConfigModalOpen, setIsStoreConfigModalOpen] = useState(false);
  const [isLoadingStoreConfig, setIsLoadingStoreConfig] = useState(false);
  const [isSavingStoreConfig, setIsSavingStoreConfig] = useState(false);
  const [storeConfigData, setStoreConfigData] = useState<{
    config: StoreConfig;
    source: ConfigSource;
  } | null>(null);
  const [storeConfigForm, setStoreConfigForm] = useState<StoreConfig>({
    platformCommission: null,
    markupPercentage: null,
    costOfGoods: null,
    fixedMonthlyCosts: null,
    packagingCost: null,
    deliveryCost: null,
  });

  // Obtener clima de la store seleccionada
  const { data: weatherForecast, isLoading: weatherLoading } = useQuery({
    queryKey: ['weather-forecast', selectedStoreId],
    queryFn: async () => {
      if (!selectedStoreId) return null;

      const selectedStore = userStores
        .flatMap(g => g.stores)
        .find(s => s.id === selectedStoreId);

      if (!selectedStore?.city) return null;

      const country = selectedStore.country || undefined;
      return weatherService.getForecast(selectedStore.city, country);
    },
    enabled: !!selectedStoreId,
  });

  // Obtener items de la store seleccionada
  const { data: storeItemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['store-items', selectedStoreId],
    queryFn: async () => {
      if (!selectedStoreId) return { store: null };

      console.log('🔍 Fetching store items for:', selectedStoreId);
      console.log('📡 Request URL:', `/api/stores/${selectedStoreId}`);

      try {
        const response = await fetch(`/api/stores/${selectedStoreId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Request failed:', response.status, errorText);
          throw new Error(`Failed to fetch store items: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        console.log('📄 Response text (first 200 chars):', text.substring(0, 200));

        const data = JSON.parse(text);
        console.log('✅ Store data received:', {
          store: data.store?.name,
          storeItems: data.store?.storeItems?.length || 0,
          activeItems: data.store?.storeItems?.filter((si: any) => si.active).length || 0,
        });

        return data;
      } catch (error) {
        console.error('❌ Error fetching store items:', error);
        throw error;
      }
    },
    enabled: !!selectedStoreId,
  });

  // Agrupar items por categoría
  const itemsByCategory: CategoryWithItems[] = useMemo(() => {
    if (!storeItemsData?.store?.storeItems) return [];

    const categoryMap = new Map<string, StoreItem[]>();

    storeItemsData.store.storeItems.forEach((storeItem: any) => {
      const category = storeItem.item.category?.name || 'Uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }

      categoryMap.get(category)!.push({
        id: storeItem.item.id,
        name: storeItem.item.name,
        description: storeItem.item.description,
        imageUrl: storeItem.item.imageUrl,
        categoryName: category,
        price: Number(storeItem.price),
      });
    });

    return Array.from(categoryMap.entries())
      .map(([category, items]) => ({ category, items }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [storeItemsData]);

  // Get selected store with platform info
  const selectedStore = useMemo(() => {
    if (!selectedStoreId) return null;
    return userStores
      .flatMap(g => g.stores)
      .find(s => s.id === selectedStoreId) || null;
  }, [selectedStoreId, userStores]);

  // Filter suggestion types by selected store's platform
  const filteredSuggestionTypes = useMemo(() => {
    if (!selectedStore?.platform) {
      // No platform selected, show only generic types
      return SUGGESTION_TYPES.filter(t => !t.platform);
    }
    return SUGGESTION_TYPES.filter(
      type => !type.platform || type.platform === selectedStore.platform
    );
  }, [selectedStore]);

  // Cargar usuarios al montar
  useEffect(() => {
    fetchUsers();
  }, []);

  // Función para cargar usuarios
  const fetchUsers = async () => {
    try {
      const response = await api.get('/platform-integrations');
      const data = response as { integrations: PlatformIntegration[] };

      const uniqueUsers = Array.from(
        new Map(data.integrations.map((int: PlatformIntegration) => [int.owner.id, int.owner] as [string, User]))
        .values()
      );

      setUsers(uniqueUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Cargar stores del usuario seleccionado
  useEffect(() => {
    if (selectedUserId) {
      fetchUserStores(selectedUserId);
    } else {
      setUserStores([]);
      setSelectedStoreId('');
    }
  }, [selectedUserId]);

  const fetchUserStores = async (userId: string) => {
    try {
      console.log('🔍 Fetching stores for user:', userId);

      const response = await api.get(`/platform-integrations?userId=${userId}`);
      const data = response as { integrations: PlatformIntegration[] };

      console.log('✅ Integrations received:', data.integrations?.length || 0);

      const allStores: Store[] = [];
      data.integrations?.forEach((integration: PlatformIntegration) => {
        console.log(`📦 Integration ${integration.platform}:`, integration.stores?.length || 0, 'stores');
        integration.stores?.forEach((store) => {
          allStores.push({
            id: store.id,
            name: store.name,
            chainName: store.chainName,
            city: store.city,
            country: store.country,
            platform: integration.platform as DeliveryPlatform,
          });
        });
      });

      console.log('🏪 Total stores:', allStores.length);

      // Agrupar por chainName
      const chainGroups = new Map<string, Store[]>();
      allStores.forEach((store) => {
        const chain = store.chainName || 'Other';
        if (!chainGroups.has(chain)) {
          chainGroups.set(chain, []);
        }
        chainGroups.get(chain)!.push(store);
      });

      const grouped = Array.from(chainGroups.entries())
        .map(([chainName, stores]) => ({ chainName, stores }))
        .sort((a, b) => a.chainName.localeCompare(b.chainName));

      console.log('📊 Grouped stores:', grouped.map(g => `${g.chainName}: ${g.stores.length}`));

      setUserStores(grouped);

      // Resetear selectedStoreId y auto-seleccionar si hay una sola store
      setSelectedStoreId('');
      if (allStores.length === 1) {
        setSelectedStoreId(allStores[0].id);
        console.log('✅ Auto-selected single store:', allStores[0].id);
      }
    } catch (error) {
      console.error('❌ Error loading stores:', error);
    }
  };

  // Función para cargar sugerencias del usuario seleccionado
  const fetchSuggestions = async (userId: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/suggestions?userId=${userId}&status=PENDING,ACCEPTED`);
      const data = response as { suggestions: Suggestion[] };

      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open store config modal and load config
  const openStoreConfigModal = async () => {
    if (!selectedStoreId || !selectedUserId) return;

    setIsLoadingStoreConfig(true);
    setIsStoreConfigModalOpen(true);

    try {
      const configData = await storesService.getAgencyStoreConfig(selectedUserId, selectedStoreId);
      setStoreConfigData(configData);
      setStoreConfigForm(configData.config);
    } catch (error) {
      console.error('Error loading store config:', error);
    } finally {
      setIsLoadingStoreConfig(false);
    }
  };

  // Save store config
  const saveStoreConfig = async () => {
    if (!selectedStoreId || !selectedUserId) return;

    setIsSavingStoreConfig(true);

    try {
      // Convert StoreConfig to update request (only include non-null values)
      const updateData: Record<string, number> = {};
      if (storeConfigForm.platformCommission !== null) updateData.platformCommission = storeConfigForm.platformCommission;
      if (storeConfigForm.markupPercentage !== null) updateData.markupPercentage = storeConfigForm.markupPercentage;
      if (storeConfigForm.fixedMonthlyCosts !== null) updateData.fixedMonthlyCosts = storeConfigForm.fixedMonthlyCosts;
      if (storeConfigForm.packagingCost !== null) updateData.packagingCost = storeConfigForm.packagingCost;
      if (storeConfigForm.deliveryCost !== null) updateData.deliveryCost = storeConfigForm.deliveryCost;
      if (storeConfigForm.costOfGoods !== null) updateData.costOfGoods = storeConfigForm.costOfGoods;

      if (storeConfigData?.source === 'store') {
        // Update existing config
        await storesService.updateAgencyStoreConfig(selectedUserId, selectedStoreId, updateData);
      } else {
        // Create new config
        await storesService.updateAgencyStoreConfig(selectedUserId, selectedStoreId, updateData);
      }

      // Reload config
      const configResponse = await storesService.getAgencyStoreConfig(selectedUserId, selectedStoreId);
      setStoreConfigData(configResponse);
      setIsStoreConfigModalOpen(false);
    } catch (error) {
      console.error('Error saving store config:', error);
    } finally {
      setIsSavingStoreConfig(false);
    }
  };

  // Reset store to defaults
  const resetStoreToDefaults = async () => {
    if (!selectedStoreId || !selectedUserId) return;

    setIsSavingStoreConfig(true);

    try {
      await storesService.updateAgencyStoreConfig(selectedUserId, selectedStoreId, {
        platformCommission: undefined,
        markupPercentage: undefined,
        costOfGoods: undefined,
        fixedMonthlyCosts: undefined,
        packagingCost: undefined,
        deliveryCost: undefined,
      });

      // Reload config
      const configResponse = await storesService.getAgencyStoreConfig(selectedUserId, selectedStoreId);
      setStoreConfigData(configResponse);
      setStoreConfigForm(configResponse.config);
    } catch (error) {
      console.error('Error resetting store config:', error);
    } finally {
      setIsSavingStoreConfig(false);
    }
  };

  // Cuando se selecciona un usuario, cargar sus sugerencias
  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    setShowCreateForm(false);
    setSelectedStoreId(''); // Reset store selection
    if (userId) {
      fetchSuggestions(userId);
    } else {
      setSuggestions([]);
    }
  };

  // Crear nueva sugerencia
  const handleCreateSuggestion = async () => {
    if (!selectedUserId) {
      alert('Please select a user first');
      return;
    }

    if (!selectedStoreId) {
      alert('Please select a store first');
      return;
    }

    let action: any = {};
    let title = '';
    let description = '';

    // Obtener info de la store
    const selectedStore = userStores
      .flatMap(g => g.stores)
      .find(s => s.id === selectedStoreId);

    // Obtener item seleccionado
    const allItems = itemsByCategory.flatMap(c => c.items);
    const selectedItem = allItems.find(i => i.id === formData.itemId);

    // Construir action y descripción según el tipo
    switch (selectedType) {
      case 'PRICE_CHANGE':
        if (!formData.itemId || !formData.newPrice) {
          alert('Please select an item and enter the new price');
          return;
        }
        action = {
          storeId: selectedStoreId,
          storeName: selectedStore?.name,
          itemId: formData.itemId,
          itemName: selectedItem?.name,
          oldPrice: selectedItem?.price,
          newPrice: parseFloat(formData.newPrice),
        };
        title = `Price change: ${selectedItem?.name} @ ${selectedStore?.name}`;
        description = `Change price from $${selectedItem?.price} to $${formData.newPrice} at ${selectedStore?.name}`;
        break;

      case 'PROMOTION':
        if (!formData.itemId || !formData.promotionStart || !formData.promotionEnd) {
          alert('Please select an item, start date and end date');
          return;
        }
        action = {
          storeId: selectedStoreId,
          storeName: selectedStore?.name,
          itemId: formData.itemId,
          itemName: selectedItem?.name,
          originalPrice: selectedItem?.price,
          promotionPrice: parseFloat(formData.newPrice),
          start: formData.promotionStart,
          end: formData.promotionEnd,
        };
        title = `Promotion: ${selectedItem?.name} @ ${selectedStore?.name}`;
        description = `Promotional price $${formData.newPrice} from ${new Date(formData.promotionStart).toLocaleDateString()} to ${new Date(formData.promotionEnd).toLocaleDateString()} at ${selectedStore?.name}`;
        break;

      case 'TEMPORARY_DISABLE':
        if (!formData.itemId || !formData.disableStart || !formData.disableEnd) {
          alert('Please select an item, start date and end date');
          return;
        }
        action = {
          storeId: selectedStoreId,
          storeName: selectedStore?.name,
          itemId: formData.itemId,
          itemName: selectedItem?.name,
          start: formData.disableStart,
          end: formData.disableEnd,
        };
        title = `Temporarily disable: ${selectedItem?.name} @ ${selectedStore?.name}`;
        description = `Disable from ${new Date(formData.disableStart).toLocaleDateString()} to ${new Date(formData.disableEnd).toLocaleDateString()} at ${selectedStore?.name}`;
        break;

      case 'ITEM_IMPROVEMENT':
        if (!formData.itemId) {
          alert('Please select an item');
          return;
        }
        action = {
          storeId: selectedStoreId,
          storeName: selectedStore?.name,
          itemId: formData.itemId,
          itemName: selectedItem?.name,
          currentDescription: selectedItem?.description,
          currentImageUrl: selectedItem?.imageUrl,
          newDescription: formData.newDescription || undefined,
          newImageUrl: formData.newImageUrl || undefined,
          newPrice: formData.newPriceImprovement ? parseFloat(formData.newPriceImprovement) : undefined,
        };
        title = `Improve: ${selectedItem?.name} @ ${selectedStore?.name}`;
        description = formData.newDescription || 'Update item presentation';
        break;

      // PedidosYa-specific types
      case 'PEDIDOS_YA_DESCUENTO_FUGAZ':
        if (!formData.itemId || !formData.discountValue || !formData.promotionStart || !formData.promotionEnd) {
          alert('Please select an item, discount value, and schedule');
          return;
        }
        action = {
          items: [formData.itemId],
          discount: {
            type: formData.discountType,
            value: parseFloat(formData.discountValue),
          },
          schedule: {
            start: new Date(formData.promotionStart).toISOString(),
            end: new Date(formData.promotionEnd).toISOString(),
          },
          platformSpecific: {
            pedidosYa: {
              campaignType: 'flash',
              minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : undefined,
              maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
            },
          },
        };
        title = `Descuento Fugaz: ${selectedItem?.name}`;
        description = `Flash discount ${formData.discountValue}${formData.discountType === 'PERCENTAGE' ? '%' : '$'} from ${new Date(formData.promotionStart).toLocaleDateString()} to ${new Date(formData.promotionEnd).toLocaleDateString()}`;
        break;

      case 'PEDIDOS_YA_MENU_COMPLETO':
        if (formData.bundleMainItems.length === 0 || formData.bundleDrinkItems.length === 0 || !formData.bundlePrice) {
          alert('Please select at least one main item, one drink, and enter bundle price');
          return;
        }
        action = {
          bundleItems: {
            main: formData.bundleMainItems,
            drink: formData.bundleDrinkItems,
            side: formData.bundleSideItems,
          },
          bundlePrice: parseFloat(formData.bundlePrice),
          platformSpecific: {
            pedidosYa: {
              campaignType: 'bundle',
              bundleName: formData.bundleName || 'Menú Completo',
            },
          },
        };
        title = `Menú Completo: ${formData.bundleName || 'Bundle'}`;
        description = `Complete menu bundle for $${formData.bundlePrice}`;
        break;

      case 'PEDIDOS_YA_PRODUCTOS_DESTACADOS':
        if (!formData.itemId || !formData.featuredPlacement) {
          alert('Please select an item and placement');
          return;
        }
        action = {
          items: [formData.itemId],
          placement: formData.featuredPlacement,
          priority: parseInt(formData.featuredPriority),
          platformSpecific: {
            pedidosYa: {
              campaignType: 'featured',
              bannerType: formData.bannerType,
              duration: formData.featuredDuration,
            },
          },
        };
        title = `Productos Destacados: ${selectedItem?.name}`;
        description = `Featured product on ${formData.featuredPlacement.replace('_', ' ').toLowerCase()}`;
        break;
    }

    try {
      await api.post('/suggestions', {
        userId: selectedUserId,
        type: selectedType,
        title,
        description,
        action: JSON.stringify(action),
        storeId: selectedStoreId,
      });

      // Resetear formulario
      setSelectedType('PRICE_CHANGE');
      setFormData({
        itemId: '',
        newPrice: '',
        promotionStart: '',
        promotionEnd: '',
        disableStart: '',
        disableEnd: '',
        newDescription: '',
        newImageUrl: '',
        newPriceImprovement: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minOrderValue: '',
        maxDiscountAmount: '',
        bundleMainItems: [],
        bundleDrinkItems: [],
        bundleSideItems: [],
        bundlePrice: '',
        bundleName: '',
        featuredPlacement: 'HOMEPAGE_BANNER',
        featuredPriority: '1',
        bannerType: 'highlight',
        featuredDuration: '',
      });
      setShowCreateForm(false);

      // Recargar sugerencias
      fetchSuggestions(selectedUserId);

      alert('Suggestion created successfully');
    } catch (error) {
      console.error('Error creating suggestion:', error);
      alert('Error creating suggestion');
    }
  };

  // Obtener badge de estado
  const getStatusBadge = (status: SuggestionStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="w-3 h-3" />
          Pendiente
        </span>;
      case 'ACCEPTED':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <TrendingUp className="w-3 h-3" />
          En progreso
        </span>;
      case 'APPLIED':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-3 h-3" />
          Aplicada
        </span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <XCircle className="w-3 h-3" />
          Rechazada
        </span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>;
    }
  };

  // Renderizar formulario específico
  const renderSpecificForm = () => {
    if (itemsLoading) {
      return <div className="text-center py-8 text-muted-foreground">Loading items...</div>;
    }

    if (itemsByCategory.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No items found for this store
          {storeItemsData?.store?.storeItems && storeItemsData.store.storeItems.length > 0 && (
            <p className="text-xs mt-2">
              ({storeItemsData.store.storeItems.length} items found but may be inactive)
            </p>
          )}
        </div>
      );
    }

    const allItems = itemsByCategory.flatMap(c => c.items);

    switch (selectedType) {
      case 'PRICE_CHANGE':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="item-price">Select Item</Label>
              <Select value={formData.itemId} onValueChange={(value) => setFormData({ ...formData, itemId: value })}>
                <SelectTrigger id="item-price">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {itemsByCategory.map((cat) => (
                    <div key={cat.category}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                        {cat.category}
                      </div>
                      {cat.items.map((item) => (
                        <SelectItem key={item.id} value={item.id} className="pl-6">
                          {item.name} - ${item.price}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="new-price">New Price ($)</Label>
              <Input
                id="new-price"
                type="number"
                step="0.01"
                placeholder="Enter new price"
                value={formData.newPrice}
                onChange={(e) => setFormData({ ...formData, newPrice: e.target.value })}
              />
            </div>
          </div>
        );

      case 'PROMOTION':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="item-promo">Select Item</Label>
              <Select value={formData.itemId} onValueChange={(value) => setFormData({ ...formData, itemId: value })}>
                <SelectTrigger id="item-promo">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {itemsByCategory.map((cat) => (
                    <div key={cat.category}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                        {cat.category}
                      </div>
                      {cat.items.map((item) => (
                        <SelectItem key={item.id} value={item.id} className="pl-6">
                          {item.name} - ${item.price}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="promo-price">Promotional Price ($)</Label>
              <Input
                id="promo-price"
                type="number"
                step="0.01"
                placeholder="Enter promotional price"
                value={formData.newPrice}
                onChange={(e) => setFormData({ ...formData, newPrice: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="promo-start">Start Date</Label>
                <Input
                  id="promo-start"
                  type="datetime-local"
                  value={formData.promotionStart}
                  onChange={(e) => setFormData({ ...formData, promotionStart: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="promo-end">End Date</Label>
                <Input
                  id="promo-end"
                  type="datetime-local"
                  value={formData.promotionEnd}
                  onChange={(e) => setFormData({ ...formData, promotionEnd: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 'TEMPORARY_DISABLE':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="item-disable">Select Item to Temporarily Disable</Label>
              <Select value={formData.itemId} onValueChange={(value) => setFormData({ ...formData, itemId: value })}>
                <SelectTrigger id="item-disable">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {itemsByCategory.map((cat) => (
                    <div key={cat.category}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                        {cat.category}
                      </div>
                      {cat.items.map((item) => (
                        <SelectItem key={item.id} value={item.id} className="pl-6">
                          {item.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ This item will be temporarily disabled and will not be visible to customers during the selected period.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="disable-start">Start Date</Label>
                <Input
                  id="disable-start"
                  type="datetime-local"
                  value={formData.disableStart}
                  onChange={(e) => setFormData({ ...formData, disableStart: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="disable-end">End Date</Label>
                <Input
                  id="disable-end"
                  type="datetime-local"
                  value={formData.disableEnd}
                  onChange={(e) => setFormData({ ...formData, disableEnd: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 'ITEM_IMPROVEMENT':
        const selectedItem = allItems.find(i => i.id === formData.itemId);
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="item-improve">Select Item to Improve</Label>
              <Select value={formData.itemId} onValueChange={(value) => setFormData({ ...formData, itemId: value })}>
                <SelectTrigger id="item-improve">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {itemsByCategory.map((cat) => (
                    <div key={cat.category}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                        {cat.category}
                      </div>
                      {cat.items.map((item) => (
                        <SelectItem key={item.id} value={item.id} className="pl-6">
                          {item.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedItem && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium mb-2">Current Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {selectedItem.name}</p>
                    <p><span className="text-muted-foreground">Price:</span> ${selectedItem.price}</p>
                    <p><span className="text-muted-foreground">Description:</span> {selectedItem.description || 'No description'}</p>
                    {selectedItem.imageUrl && (
                      <div className="mt-2">
                        <span className="text-muted-foreground">Image:</span>
                        <img src={selectedItem.imageUrl} alt={selectedItem.name} className="mt-1 w-20 h-20 object-cover rounded" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="new-description">New Description</Label>
              <Textarea
                id="new-description"
                placeholder="Enter an improved description to make the item more appealing..."
                value={formData.newDescription}
                onChange={(e) => setFormData({ ...formData, newDescription: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="new-image-url">New Image URL</Label>
              <Input
                id="new-image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.newImageUrl}
                onChange={(e) => setFormData({ ...formData, newImageUrl: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="new-price-improve">New Price (optional)</Label>
              <Input
                id="new-price-improve"
                type="number"
                step="0.01"
                placeholder="Leave empty to keep current price"
                value={formData.newPriceImprovement}
                onChange={(e) => setFormData({ ...formData, newPriceImprovement: e.target.value })}
              />
            </div>

            <Button type="button" variant="outline" className="w-full gap-2">
              <Sparkles className="h-4 w-4" />
              Analyze with AI
            </Button>
          </div>
        );

      case 'PEDIDOS_YA_DESCUENTO_FUGAZ':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="item-flash">Select Item for Flash Discount</Label>
              <Select value={formData.itemId} onValueChange={(value) => setFormData({ ...formData, itemId: value })}>
                <SelectTrigger id="item-flash">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {itemsByCategory.map((cat) => (
                    <div key={cat.category}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                        {cat.category}
                      </div>
                      {cat.items.map((item) => (
                        <SelectItem key={item.id} value={item.id} className="pl-6">
                          {item.name} - ${item.price}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount-type">Discount Type</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value) => setFormData({ ...formData, discountType: value as 'PERCENTAGE' | 'FIXED' })}
                >
                  <SelectTrigger id="discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="discount-value">Discount Value</Label>
                <Input
                  id="discount-value"
                  type="number"
                  step="0.01"
                  placeholder={formData.discountType === 'PERCENTAGE' ? '30' : '500'}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-order">Min Order Value (optional)</Label>
                <Input
                  id="min-order"
                  type="number"
                  step="0.01"
                  placeholder="1000"
                  value={formData.minOrderValue}
                  onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="max-discount">Max Discount Amount (optional)</Label>
                <Input
                  id="max-discount"
                  type="number"
                  step="0.01"
                  placeholder="500"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="flash-start">Start Date</Label>
                <Input
                  id="flash-start"
                  type="datetime-local"
                  value={formData.promotionStart}
                  onChange={(e) => setFormData({ ...formData, promotionStart: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="flash-end">End Date</Label>
                <Input
                  id="flash-end"
                  type="datetime-local"
                  value={formData.promotionEnd}
                  onChange={(e) => setFormData({ ...formData, promotionEnd: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ⚡ Flash discounts appear prominently in the app for a limited time. High conversion rates!
              </p>
            </div>
          </div>
        );

      case 'PEDIDOS_YA_MENU_COMPLETO':
        const allItemsList = itemsByCategory.flatMap(c => c.items);
        return (
          <div className="space-y-4">
            <div>
              <Label>Bundle Name</Label>
              <Input
                placeholder="Menú Ejecutivo"
                value={formData.bundleName}
                onChange={(e) => setFormData({ ...formData, bundleName: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="bundle-main">Main Course (select one or more)</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {allItemsList.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.bundleMainItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, bundleMainItems: [...formData.bundleMainItems, item.id] });
                        } else {
                          setFormData({ ...formData, bundleMainItems: formData.bundleMainItems.filter(id => id !== item.id) });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{item.name} - ${item.price}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="bundle-drink">Drink (select one or more)</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {allItemsList.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.bundleDrinkItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, bundleDrinkItems: [...formData.bundleDrinkItems, item.id] });
                        } else {
                          setFormData({ ...formData, bundleDrinkItems: formData.bundleDrinkItems.filter(id => id !== item.id) });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{item.name} - ${item.price}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="bundle-side">Side Dishes (optional)</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {allItemsList.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.bundleSideItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, bundleSideItems: [...formData.bundleSideItems, item.id] });
                        } else {
                          setFormData({ ...formData, bundleSideItems: formData.bundleSideItems.filter(id => id !== item.id) });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{item.name} - ${item.price}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="bundle-price">Bundle Price ($)</Label>
              <Input
                id="bundle-price"
                type="number"
                step="0.01"
                placeholder="1500"
                value={formData.bundlePrice}
                onChange={(e) => setFormData({ ...formData, bundlePrice: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is the price customers will pay for the complete bundle
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                📦 Complete menu bundles increase average order value and customer satisfaction
              </p>
            </div>
          </div>
        );

      case 'PEDIDOS_YA_PRODUCTOS_DESTACADOS':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="item-featured">Select Item to Feature</Label>
              <Select value={formData.itemId} onValueChange={(value) => setFormData({ ...formData, itemId: value })}>
                <SelectTrigger id="item-featured">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {itemsByCategory.map((cat) => (
                    <div key={cat.category}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                        {cat.category}
                      </div>
                      {cat.items.map((item) => (
                        <SelectItem key={item.id} value={item.id} className="pl-6">
                          {item.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="placement">Placement</Label>
              <Select
                value={formData.featuredPlacement}
                onValueChange={(value) => setFormData({
                  ...formData,
                  featuredPlacement: value as 'HOMEPAGE_BANNER' | 'CATEGORY_TOP' | 'SEARCH_RESULTS'
                })}
              >
                <SelectTrigger id="placement">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOMEPAGE_BANNER">Homepage Banner</SelectItem>
                  <SelectItem value="CATEGORY_TOP">Category Top</SelectItem>
                  <SelectItem value="SEARCH_RESULTS">Search Results</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority (1-10)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={formData.featuredPriority}
                onChange={(e) => setFormData({ ...formData, featuredPriority: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Higher priority = more prominent display
              </p>
            </div>

            <div>
              <Label htmlFor="banner-type">Banner Type</Label>
              <Input
                id="banner-type"
                placeholder="highlight"
                value={formData.bannerType}
                onChange={(e) => setFormData({ ...formData, bannerType: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (optional)</Label>
              <Input
                id="duration"
                placeholder="7d"
                value={formData.featuredDuration}
                onChange={(e) => setFormData({ ...formData, featuredDuration: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Example: 7d, 24h, etc.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⭐ Featured products appear in high-visibility areas, increasing click-through rates
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header simple */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Panel de Agencia
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Selecciona un usuario, una store y gestiona sus sugerencias
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Selector de Usuario */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Usuario</CardTitle>
              <CardDescription>
                Elige el dueño/restaurante para ver y gestionar sus sugerencias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="user-select">Usuario</Label>
                <select
                  id="user-select"
                  value={selectedUserId}
                  onChange={(e) => handleUserChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Selecciona un usuario...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Store agrupado por chainName */}
              {userStores.length > 0 && (
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label htmlFor="store-select">Store</Label>
                      <select
                        id="store-select"
                        value={selectedStoreId}
                        onChange={(e) => {
                          setSelectedStoreId(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="">Selecciona una store...</option>
                        {userStores.map((group) => (
                          <optgroup key={group.chainName} label={group.chainName}>
                            {group.stores.map((store) => (
                              <option key={store.id} value={store.id}>
                                {store.name} {store.city ? `(${store.city})` : ''}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    {selectedStoreId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openStoreConfigModal}
                        className="mt-6"
                        title="Configurar store"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {selectedUserId && suggestions.length === 0 && !loading && (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Este usuario no tiene sugerencias pendientes
                </div>
              )}

              {/* Agency Navigation Buttons - Show when user and store are selected */}
              {selectedUserId && selectedStoreId && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Ver Métricas del Cliente
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                      onClick={() => window.location.href = `/overview?agencyView=true&userId=${selectedUserId}&storeId=${selectedStoreId}`}
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Dashboard</span>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700 transition-colors"
                      onClick={() => window.location.href = `/operations?agencyView=true&userId=${selectedUserId}&storeId=${selectedStoreId}`}
                    >
                      <Activity className="h-4 w-4" />
                      <span>Operaciones</span>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Grid: Pronóstico + Formulario o Lista */}
        {selectedStoreId && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Columna Izquierda: Clima */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5" />
                    Weather Forecast
                  </CardTitle>
                  {userStores.length > 0 && (
                    <CardDescription>
                      {userStores
                        .flatMap(g => g.stores)
                        .find(s => s.id === selectedStoreId)?.name}
                      {userStores
                        .flatMap(g => g.stores)
                        .find(s => s.id === selectedStoreId)?.city && ` - ${userStores
                        .flatMap(g => g.stores)
                        .find(s => s.id === selectedStoreId)?.city}`}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {weatherLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading forecast...</div>
                  ) : weatherForecast ? (
                    <WeatherForecast forecast={weatherForecast} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No weather data available for this store
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Columna Derecha: Sugerencias o Formulario */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Sugerencias
                </h2>
                <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                  {showCreateForm ? 'Cancelar' : '+ Nueva Sugerencia'}
                </Button>
              </div>

              {/* Formulario de creación */}
              {showCreateForm ? (
                <Card className="border-2 border-blue-500 dark:border-blue-600">
                  <CardHeader>
                    <CardTitle>Crear Nueva Sugerencia</CardTitle>
                    <CardDescription>
                      Select the type of suggestion and fill in the required information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Selector de tipo */}
                    <div>
                      <Label>Suggestion Type</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {filteredSuggestionTypes.map((type) => {
                          const Icon = type.icon;
                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => setSelectedType(type.value as SuggestionType)}
                              className={`p-3 rounded-lg border text-left transition-colors ${
                                selectedType === type.value
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className="h-4 w-4" />
                                <span className="font-medium text-sm">{type.label}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{type.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Formulario específico */}
                    {renderSpecificForm()}

                    <Button onClick={handleCreateSuggestion} className="w-full">
                      Create Suggestion
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                /* Lista de sugerencias */
                <>
                  {loading ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Cargando sugerencias...
                    </div>
                  ) : suggestions.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                          No hay sugerencias para este usuario
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {suggestions.map((suggestion) => (
                        <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {getStatusBadge(suggestion.status)}
                                  <Badge variant="outline">{suggestion.type}</Badge>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(suggestion.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {suggestion.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {suggestion.description}
                                </p>
                                {suggestion.appliedAt && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    Aplicada: {new Date(suggestion.appliedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Store Config Modal */}
        <Dialog open={isStoreConfigModalOpen} onOpenChange={setIsStoreConfigModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Configurar: {userStores.flatMap(g => g.stores).find(s => s.id === selectedStoreId)?.name}
              </DialogTitle>
              <DialogDescription>
                {storeConfigData?.source === 'store'
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
                    {storeConfigData?.source === 'store'
                      ? 'Este local usa configuración personalizada. Todos los valores definidos aquí reemplazan los valores predeterminados.'
                      : 'Deja los campos vacíos para usar los valores predeterminados. Solo completa los campos que quieras personalizar.'}
                  </div>
                </div>

                {storeConfigData?.source === 'store' && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                      Personalizado
                    </Badge>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Este local tiene configuración personalizada
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="agencyStorePlatformCommission">Comisión de Plataforma (%)</Label>
                    <Input
                      id="agencyStorePlatformCommission"
                      type="number"
                      value={storeConfigForm.platformCommission || ''}
                      onChange={(e) => setStoreConfigForm({ ...storeConfigForm, platformCommission: Number(e.target.value) || null })}
                      placeholder="Predeterminado"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agencyStoreMarkup">Markup (%)</Label>
                    <Input
                      id="agencyStoreMarkup"
                      type="number"
                      value={storeConfigForm.markupPercentage || ''}
                      onChange={(e) => setStoreConfigForm({ ...storeConfigForm, markupPercentage: Number(e.target.value) || null })}
                      placeholder="Predeterminado"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agencyStoreCostOfGoods">CMV - Costo de Mercadería (%)</Label>
                    <Input
                      id="agencyStoreCostOfGoods"
                      type="number"
                      value={storeConfigForm.costOfGoods || ''}
                      onChange={(e) => setStoreConfigForm({ ...storeConfigForm, costOfGoods: Number(e.target.value) || null })}
                      placeholder="Predeterminado"
                      min="0"
                      max="100"
                    />
                    <p className="text-xs text-gray-500">Costo de insumos como % del precio</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agencyStoreFixedCosts">Costos Fijos Mensuales ($)</Label>
                    <Input
                      id="agencyStoreFixedCosts"
                      type="number"
                      value={storeConfigForm.fixedMonthlyCosts || ''}
                      onChange={(e) => setStoreConfigForm({ ...storeConfigForm, fixedMonthlyCosts: Number(e.target.value) || null })}
                      placeholder="Predeterminado"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agencyStorePackagingCost">Costo de Packaging ($)</Label>
                    <Input
                      id="agencyStorePackagingCost"
                      type="number"
                      value={storeConfigForm.packagingCost || ''}
                      onChange={(e) => setStoreConfigForm({ ...storeConfigForm, packagingCost: Number(e.target.value) || null })}
                      placeholder="Predeterminado"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agencyStoreDeliveryCost">Costo de Delivery ($)</Label>
                    <Input
                      id="agencyStoreDeliveryCost"
                      type="number"
                      value={storeConfigForm.deliveryCost || ''}
                      onChange={(e) => setStoreConfigForm({ ...storeConfigForm, deliveryCost: Number(e.target.value) || null })}
                      placeholder="Predeterminado"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              {storeConfigData?.source === 'store' && (
                <Button
                  variant="outline"
                  onClick={resetStoreToDefaults}
                  disabled={isSavingStoreConfig}
                  className="text-red-600 hover:text-red-700"
                >
                  Restablecer a Predeterminados
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsStoreConfigModalOpen(false)} disabled={isSavingStoreConfig}>
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
    </div>
  );
}
