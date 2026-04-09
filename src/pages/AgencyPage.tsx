import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { storesService } from '../services/storesService';
import type { SuggestionType, SuggestionTypeConfig, DeliveryPlatform } from '@/types/integrations';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Clock, Sparkles, Edit3, Store, Zap, Package, Star, Settings, Loader2, Save, BarChart3, Activity, ExternalLink } from 'lucide-react';
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

// Types configuration
const SUGGESTION_TYPES: SuggestionTypeConfig[] = [
  // Generic types
  {
    value: 'ITEM_IMPROVEMENT',
    label: 'Item Improvement',
    icon: Edit3,
    description: 'Improve item presentation',
    platform: null,
  },
  // PedidosYa-specific types
  {
    value: 'PEDIDOS_YA_DESCUENTO_FUGAZ',
    label: 'Descuento Fugaz',
    icon: Zap,
    description: 'Flash discount (4-8 hours)',
    platform: 'PEDIDOS_YA',
  },
  {
    value: 'PEDIDOS_YA_MENU_COMPLETO',
    label: 'Menú Completo',
    icon: Package,
    description: 'Full menu sync',
    platform: 'PEDIDOS_YA',
  },
  {
    value: 'PEDIDOS_YA_PRODUCTOS_DESTACADOS',
    label: 'Productos Destacados',
    icon: Star,
    description: 'Featured products',
    platform: 'PEDIDOS_YA',
  },
];

export function AgencyPage() {
  // Estado
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userStores, setUserStores] = useState<StoreWithGroup[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [selectedType, setSelectedType] = useState<SuggestionType>('ITEM_IMPROVEMENT');
  const [formData, setFormData] = useState({
    itemId: '',
    newDescription: '',
    newImageUrl: '',
    newPriceImprovement: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: '',
    promotionStart: '',
    promotionEnd: '',
    reason: '',
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'create' | 'suggestions'>('create');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isStoreConfigModalOpen, setIsStoreConfigModalOpen] = useState(false);

  // Image upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/platform-integrations') as { integrations: PlatformIntegration[] };
        // Extract unique users from integrations
        const uniqueUsers = new Map<string, User>();
        response.integrations.forEach((integration: PlatformIntegration) => {
          if (!uniqueUsers.has(integration.owner.id)) {
            uniqueUsers.set(integration.owner.id, integration.owner);
          }
        });
        setUsers(Array.from(uniqueUsers.values()));
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Fetch user stores when user is selected
  useEffect(() => {
    if (!selectedUserId) {
      setUserStores([]);
      setSelectedStoreId('');
      return;
    }

    const fetchUserStores = async () => {
      try {
        const response = await api.get(`/platform-integrations?userId=${selectedUserId}`) as { integrations: PlatformIntegration[] };
        const integrations = response.integrations || [];

        const groupedStores: StoreWithGroup[] = [];
        integrations.forEach((integration: PlatformIntegration) => {
          if (integration.stores && integration.stores.length > 0) {
            groupedStores.push({
              chainName: integration.stores[0].chainName,
              stores: integration.stores.map(store => ({
                id: store.id,
                name: store.name,
                chainName: store.chainName,
                city: store.city,
                country: store.country,
                platform: integration.platform,
              })),
            });
          }
        });

        setUserStores(groupedStores);
        setSelectedStoreId('');
      } catch (error) {
        console.error('Error fetching stores:', error);
      }
    };

    fetchUserStores();
  }, [selectedUserId]);

  // Fetch suggestions when store is selected
  useEffect(() => {
    if (!selectedStoreId) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/suggestions?storeId=${selectedStoreId}`) as { suggestions: Suggestion[] };
        setSuggestions(response.suggestions || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [selectedStoreId]);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery) return users;
    const query = userSearchQuery.toLowerCase();
    return users.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  }, [users, userSearchQuery]);

  // Filter suggestion types based on selected store platform
  const filteredSuggestionTypes = useMemo(() => {
    if (!selectedStoreId) {
      // No store selected, show only generic types
      return SUGGESTION_TYPES.filter(type => type.platform === null);
    }

    const selectedStore = userStores
      .flatMap(group => group.stores)
      .find(store => store.id === selectedStoreId);

    if (!selectedStore?.platform) {
      return SUGGESTION_TYPES.filter(type => type.platform === null);
    }

    // Show generic types + platform-specific types
    return SUGGESTION_TYPES.filter(type =>
      type.platform === null || type.platform === selectedStore.platform
    );
  }, [selectedStoreId, userStores]);

  // Query to fetch store items
  const { data: storeItemsData } = useQuery({
    queryKey: ['store-items', selectedStoreId],
    queryFn: async () => {
      if (!selectedStoreId) return null;
      return await storesService.getById(selectedStoreId);
    },
    enabled: !!selectedStoreId,
  });

  const storeItems = useMemo(() => {
    if (!storeItemsData?.store?.storeItems) return [];
    return storeItemsData.store.storeItems.map((si: any) => ({
      id: si.id,
      name: si.item.name,
      description: si.item.description,
      imageUrl: si.item.imageUrl,
      categoryName: si.item.category?.name || 'Sin categoría',
      price: si.price,
    }));
  }, [storeItemsData]);

  const selectedItem = useMemo(() => {
    if (!formData.itemId) return null;
    return storeItems.find(item => item.id === formData.itemId) || null;
  }, [formData.itemId, storeItems]);

  // Query to fetch options for the selected item
  const { data: itemOptionsData } = useQuery({
    queryKey: ['item-options', selectedStoreId, formData.itemId],
    queryFn: async () => {
      if (!selectedStoreId || !formData.itemId) return null;
      return await storesService.getOptions(selectedStoreId);
    },
    enabled: !!selectedStoreId && !!formData.itemId,
  });

  // Filter options to only show those related to the selected item
  const itemOptions = useMemo(() => {
    if (!itemOptionsData?.options || !formData.itemId) return [];
    // TODO: Filter by item-option relationships when the API provides this data
    // For now, showing all options for the store
    return itemOptionsData.options;
  }, [itemOptionsData, formData.itemId]);

  // Pre-fill form with current item data when item is selected
  useEffect(() => {
    if (selectedItem && selectedType === 'ITEM_IMPROVEMENT') {
      setFormData(prev => ({
        ...prev,
        newDescription: selectedItem.description || '',
        newImageUrl: selectedItem.imageUrl || '',
        newPriceImprovement: selectedItem.price.toString(),
      }));
    }
  }, [selectedItem, selectedType]);

  // Store config
  const { data: storeConfigData } = useQuery({
    queryKey: ['store-config', selectedStoreId],
    queryFn: async () => {
      if (!selectedStoreId) return null;
      return await storesService.getConfig(selectedStoreId);
    },
    enabled: !!selectedStoreId,
  });

  const handleCreateSuggestion = async () => {
    if (!selectedStoreId) return;

    let action: any = {};
    let title = '';
    let description = '';

    // Build action and description based on type
    switch (selectedType) {
      case 'ITEM_IMPROVEMENT':
        if (!formData.itemId) {
          alert('Please select an item');
          return;
        }

        // Create suggestion with proposed changes
        action = {
          storeId: selectedStoreId,
          storeName: userStores.flatMap(g => g.stores).find(s => s.id === selectedStoreId)?.name,
          itemId: formData.itemId,
          itemName: selectedItem?.name,
          currentDescription: selectedItem?.description,
          currentImageUrl: selectedItem?.imageUrl,
          currentPrice: selectedItem?.price,
          proposedDescription: formData.newDescription || undefined,
          proposedImageUrl: formData.newImageUrl || undefined,
          proposedPrice: formData.newPriceImprovement ? parseFloat(formData.newPriceImprovement) : undefined,
        };
        title = `Improve: ${selectedItem?.name}`;
        description = formData.newDescription || 'Update item presentation';
        break;

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
          startTime: new Date(formData.promotionStart).toISOString(),
          endTime: new Date(formData.promotionEnd).toISOString(),
        };
        title = `Flash Discount: ${selectedItem?.name}`;
        description = `${formData.discountValue}${formData.discountType === 'PERCENTAGE' ? '%' : '$'} off from ${new Date(formData.promotionStart).toLocaleDateString()} to ${new Date(formData.promotionEnd).toLocaleDateString()}`;
        break;

      case 'PEDIDOS_YA_MENU_COMPLETO':
        action = {
          storeId: selectedStoreId,
        };
        title = 'Full Menu Sync';
        description = 'Synchronize complete menu with PedidosYa';
        break;

      case 'PEDIDOS_YA_PRODUCTOS_DESTACADOS':
        if (!formData.itemId) {
          alert('Please select at least one item');
          return;
        }
        action = {
          items: [formData.itemId],
        };
        title = 'Featured Products';
        description = `Feature ${selectedItem?.name} on PedidosYa`;
        break;

      default:
        alert('Invalid suggestion type');
        return;
    }

    try {
      await api.post('/suggestions', {
        type: selectedType,
        title,
        description,
        action,
        userId: selectedUserId,
        storeId: selectedStoreId,
      });

      // Reset form and show suggestions
      setFormData({
        itemId: '',
        newDescription: '',
        newImageUrl: '',
        newPriceImprovement: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        promotionStart: '',
        promotionEnd: '',
        reason: '',
      });
      setSelectedType('ITEM_IMPROVEMENT');
      setActiveTab('suggestions');

      // Refetch suggestions
      const suggestionsResponse = await api.get(`/suggestions?storeId=${selectedStoreId}`) as { suggestions: Suggestion[] };
      setSuggestions(suggestionsResponse.suggestions || []);
    } catch (error: any) {
      console.error('Error creating suggestion:', error);
      alert(error.message || 'Error creating suggestion');
    }
  };

  const handleApplySuggestion = async (suggestionId: string) => {
    try {
      await api.post(`/suggestions/${suggestionId}/apply`);
      // Refetch suggestions
      const suggestionsResponse = await api.get(`/suggestions?storeId=${selectedStoreId}`) as { suggestions: Suggestion[] };
      setSuggestions(suggestionsResponse.suggestions || []);
    } catch (error: any) {
      console.error('Error applying suggestion:', error);
      alert(error.message || 'Error applying suggestion');
    }
  };

  const handleDismissSuggestion = async (suggestionId: string) => {
    try {
      await api.post(`/suggestions/${suggestionId}/dismiss`);
      // Refetch suggestions
      const suggestionsResponse = await api.get(`/suggestions?storeId=${selectedStoreId}`) as { suggestions: Suggestion[] };
      setSuggestions(suggestionsResponse.suggestions || []);
    } catch (error: any) {
      console.error('Error dismissing suggestion:', error);
      alert(error.message || 'Error dismissing suggestion');
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!selectedStoreId || !formData.itemId) {
      setUploadError('Please select a store and item first');
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      uploadFormData.append('storeId', selectedStoreId);
      uploadFormData.append('productId', formData.itemId);

      console.log('Uploading image to:', `${import.meta.env.VITE_API_URL}/suggestions/upload-image`);
      console.log('FormData:', { storeId: selectedStoreId, productId: formData.itemId });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/suggestions/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: uploadFormData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Get response text first for debugging
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!response.ok) {
        let error = 'Failed to upload image';
        try {
          const errorData = JSON.parse(responseText);
          error = errorData.error || error;
        } catch {
          error = responseText || error;
        }
        throw new Error(error);
      }

      // Parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      console.log('Parsed data:', data);

      if (data.success && data.imageUrl) {
        setFormData(prev => ({ ...prev, newImageUrl: data.imageUrl }));
        console.log('Image uploaded successfully:', data.imageUrl);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(error.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const getStatusBadge = (status: SuggestionStatus) => {
    const variants: Record<SuggestionStatus, { color: string; icon: any; label: string }> = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock, label: 'Pendiente' },
      ACCEPTED: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle, label: 'Aceptada' },
      REJECTED: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, label: 'Rechazada' },
      APPLIED: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, label: 'Aplicada' },
    };

    const variant = variants[status];
    const Icon = variant.icon;

    return (
      <Badge className={variant.color}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const renderSpecificForm = () => {
    switch (selectedType) {
      case 'ITEM_IMPROVEMENT':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Item</Label>
              <Select value={formData.itemId} onValueChange={(value) => setFormData({ ...formData, itemId: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {storeItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} - ${item.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedItem && itemOptions.length > 0 && (
              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                  <Settings className="h-4 w-4" />
                  Item Options ({itemOptions.length})
                </h4>
                <div className="space-y-2">
                  {itemOptions.slice(0, 5).map((option) => (
                    <div key={option.id} className="text-xs bg-white dark:bg-gray-800 p-2 rounded border border-blue-100 dark:border-blue-900">
                      <div className="font-medium text-gray-900 dark:text-white">{option.name}</div>
                      <div className="text-gray-600 dark:text-gray-400 mt-1">
                        {option.values.slice(0, 3).map((v) => (
                          <span key={v.id} className="inline-block mr-2">
                            {v.name} (${v.unitPrice})
                          </span>
                        ))}
                        {option.values.length > 3 && <span>+{option.values.length - 3} more</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium mb-2 block">New Description</Label>
              <Textarea
                value={formData.newDescription}
                onChange={(e) => setFormData({ ...formData, newDescription: e.target.value })}
                placeholder="Enter new description for the item..."
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Image</Label>
              <div className="space-y-3">
                {/* Current/Preview image */}
                {formData.newImageUrl && (
                  <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img
                      src={formData.newImageUrl}
                      alt="Item preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                )}

                {/* Upload button */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    disabled={isUploadingImage}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploadingImage}
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="flex items-center gap-2"
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Edit3 className="h-4 w-4" />
                        {formData.newImageUrl ? 'Replace Image' : 'Upload Image'}
                      </>
                    )}
                  </Button>
                  {formData.newImageUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, newImageUrl: '' })}
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Upload error */}
                {uploadError && (
                  <p className="text-sm text-red-500">{uploadError}</p>
                )}

                {/* Helper text */}
                <p className="text-xs text-gray-500">
                  Upload an image to PedidosYa. Max size: 5MB. Supported formats: JPG, PNG, GIF.
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">New Price</Label>
              <Input
                type="number"
                value={formData.newPriceImprovement}
                onChange={(e) => setFormData({ ...formData, newPriceImprovement: e.target.value })}
                placeholder="Enter new price"
                step="0.01"
              />
            </div>
          </div>
        );

      case 'PEDIDOS_YA_DESCUENTO_FUGAZ':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Item</Label>
              <Select value={formData.itemId} onValueChange={(value) => setFormData({ ...formData, itemId: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {storeItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} - ${item.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Discount Type</Label>
                <Select value={formData.discountType} onValueChange={(value: any) => setFormData({ ...formData, discountType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Discount Value</Label>
                <Input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  placeholder={formData.discountType === 'PERCENTAGE' ? '10-50' : '100-500'}
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Start Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.promotionStart}
                  onChange={(e) => setFormData({ ...formData, promotionStart: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">End Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.promotionEnd}
                  onChange={(e) => setFormData({ ...formData, promotionEnd: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 'PEDIDOS_YA_MENU_COMPLETO':
        return (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              This will synchronize the complete menu with PedidosYa
            </p>
          </div>
        );

      case 'PEDIDOS_YA_PRODUCTOS_DESTACADOS':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Featured Item</Label>
              <Select value={formData.itemId} onValueChange={(value) => setFormData({ ...formData, itemId: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an item to feature" />
                </SelectTrigger>
                <SelectContent>
                  {storeItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} - ${item.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return <div className="text-center py-8 text-gray-500">Unknown type</div>;
    }
  };

  const openStoreConfigModal = () => {
    setIsStoreConfigModalOpen(true);
  };

  const selectedStore = userStores
    .flatMap(g => g.stores)
    .find(s => s.id === selectedStoreId);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          Agency Panel
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create and manage suggestions for your clients
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - User & Store Selection */}
        <div className="lg:col-span-4 space-y-6">
          {/* User Selection Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Store className="h-4 w-4" />
              Select Client
            </Label>
            <div className="relative">
              <input
                id="user-search"
                type="text"
                placeholder="Search by name or email..."
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  setShowUserDropdown(true);
                }}
                onFocus={() => setShowUserDropdown(true)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {showUserDropdown && filteredUsers.length > 0 && (
                <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setUserSearchQuery(user.name);
                        setShowUserDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Store Selection Card */}
          {selectedUserId && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Store className="h-4 w-4" />
                Select Store
              </Label>
              <div className="space-y-2">
                {userStores.map((group) => (
                  <div key={group.chainName}>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      {group.chainName}
                    </div>
                    {group.stores.map((store) => (
                      <button
                        key={store.id}
                        onClick={() => setSelectedStoreId(store.id)}
                        className={`w-full px-4 py-2.5 text-left rounded-lg transition-all ${
                          selectedStoreId === store.id
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="font-medium text-sm">{store.name}</div>
                        {store.city && (
                          <div className={`text-xs ${selectedStoreId === store.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {store.city}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links Card */}
          {selectedUserId && selectedStoreId && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Client Analytics
              </Label>
              <div className="space-y-2">
                <a
                  href={`/overview?agencyView=true&userId=${selectedUserId}&storeId=${selectedStoreId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all group border border-blue-100 dark:border-blue-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg shadow-lg">
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">Dashboard</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">View metrics & KPIs</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-blue-500 group-hover:text-blue-600" />
                </a>

                <a
                  href={`/operations?agencyView=true&userId=${selectedUserId}&storeId=${selectedStoreId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all group border border-purple-100 dark:border-purple-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-lg shadow-lg">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">Operations</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">View orders & stock</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-purple-500 group-hover:text-purple-600" />
                </a>
              </div>
            </div>
          )}

          {/* Store Config */}
          {selectedStoreId && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Store Settings
                </Label>
              </div>
              <button
                onClick={openStoreConfigModal}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
              >
                Configure Store
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Main Content */}
        <div className="lg:col-span-8">
          {selectedStoreId ? (
            <div>
              {/* Store Header */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedStore?.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {selectedStore?.chainName} {selectedStore?.city && `· ${selectedStore.city}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeTab === 'suggestions' && (
                      <Button
                        onClick={() => setActiveTab('create')}
                        className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        New Suggestion
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'create' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                  <div className="mb-6">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                      Suggestion Type
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {filteredSuggestionTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setSelectedType(type.value as SuggestionType)}
                            className={`p-4 rounded-xl border text-left transition-all ${
                              selectedType === type.value
                                ? 'border-blue-500 bg-blue-500 text-white shadow-lg'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${selectedType === type.value ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-semibold text-sm">{type.label}</div>
                                <div className={`text-xs mt-0.5 ${selectedType === type.value ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                  {type.description}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Form */}
                  <div className="mb-6">
                    {renderSpecificForm()}
                  </div>

                  {/* Create Button */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={handleCreateSuggestion}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                      size="lg"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Suggestion
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'suggestions' && (
                <div className="space-y-4">
                  {loading ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 border border-gray-100 dark:border-gray-700 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                      <p className="text-gray-600 dark:text-gray-400">Loading suggestions...</p>
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 border border-gray-100 dark:border-gray-700 text-center">
                      <Sparkles className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No Suggestions Yet
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Create your first suggestion for this store
                      </p>
                      <Button
                        onClick={() => setActiveTab('create')}
                        className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Create First Suggestion
                      </Button>
                    </div>
                  ) : (
                    suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {suggestion.title}
                              </h3>
                              {getStatusBadge(suggestion.status as SuggestionStatus)}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {suggestion.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                              <span>Created: {new Date(suggestion.createdAt).toLocaleString()}</span>
                              {suggestion.appliedAt && (
                                <span>Applied: {new Date(suggestion.appliedAt).toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                          {suggestion.status === 'PENDING' && (
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleApplySuggestion(suggestion.id)}
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Apply
                              </Button>
                              <Button
                                onClick={() => handleDismissSuggestion(suggestion.id)}
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Dismiss
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 border border-gray-100 dark:border-gray-700 text-center">
              <Store className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Store Selected
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Select a client and store to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Store Config Modal */}
      <Dialog open={isStoreConfigModalOpen} onOpenChange={setIsStoreConfigModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Configure: {selectedStore?.name}
            </DialogTitle>
            <DialogDescription>
              {storeConfigData?.source === 'store'
                ? 'Edit the store-specific configuration'
                : 'Configure default settings for this store'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Store configuration settings will be available here.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsStoreConfigModalOpen(false)}
              variant="outline"
            >
              Close
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
