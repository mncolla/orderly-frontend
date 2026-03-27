import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ChevronRight, ChevronLeft, Check, Store, Loader2, UtensilsCrossed, ShoppingCart, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { platformIntegrationsService, type SyncProgress } from '../services/platformIntegrationsService';
import { useConnectPedidosYa } from '../hooks/useIntegrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OrganizationObjective } from '../types/organization';
import { objectiveTypeLabels, objectiveUnitLabels, ObjectiveType, ObjectiveUnit } from '../types/organization';

type Step = 'platform' | 'defaultConfig' | 'storeConfig' | 'objectives' | 'summary';
type DeliveryPlatform = 'PEDIDOS_YA' | 'RAPPI' | 'GLOVO' | 'UBER_EATS';

interface StoreWithConfig {
  id: string;
  name: string;
  chainName: string;
  city: string | null;
  country: string | null;
  useCustomConfig: boolean;
  config?: {
    platformCommission?: number;
    markupPercentage?: number;
    costOfGoods?: number;
    fixedMonthlyCosts?: number;
    packagingCost?: number;
    deliveryCost?: number;
  };
}

export function OnboardingWizard() {
  const [, navigate] = useLocation();
  const { user, refetchUser } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('platform');
  const [isLoading, setIsLoading] = useState(false);

  // Platform connection states
  const [selectedPlatform, setSelectedPlatform] = useState<DeliveryPlatform>('PEDIDOS_YA');
  const [createdIntegration, setCreatedIntegration] = useState<any>(null);
  const [connectionEmail, setConnectionEmail] = useState('');
  const [connectionPassword, setConnectionPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [needsOTP, setNeedsOTP] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  // Sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStarted, setSyncStarted] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [syncError, setSyncError] = useState('');

  // Mutation for platform connection (used for both connect and verify-otp)
  const connectMutation = useConnectPedidosYa();

  // Polling effect for sync progress
  useEffect(() => {
    if (!syncStarted || !isSyncing) return;

    const pollInterval = setInterval(async () => {
      try {
        const result = await platformIntegrationsService.getSyncProgress(selectedPlatform);

        if (result.status === 'no_sync_in_progress') {
          setIsSyncing(false);
          return;
        }

        if (result.progress) {
          setSyncProgress(result.progress);

          // Check if all steps are completed
          const allCompleted = result.progress.steps.every(step => step.status === 'completed');
          if (allCompleted) {
            setIsSyncing(false);
            setSyncStarted(false);
            // Auto-navigate to defaultConfig step after a short delay
            setTimeout(() => {
              setCurrentStep('defaultConfig');
            }, 1000);
          }
        }
      } catch (error: any) {
        console.error('Error polling sync progress:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [syncStarted, isSyncing, selectedPlatform]);

  // Auto-start sync when connection is successful
  useEffect(() => {
    if (createdIntegration && !syncStarted) {
      // Start sync automatically after connection
      handleStartSync();
    }
  }, [createdIntegration]);

  // Default configuration (Step 2)
  const [defaultConfig, setDefaultConfig] = useState({
    platformCommission: 15,
    markupPercentage: 30,
    costOfGoods: 30,
    fixedMonthlyCosts: 0,
    packagingCost: 0,
    deliveryCost: 0,
  });

  // Store configurations (Step 3)
  const [storesWithConfig, setStoresWithConfig] = useState<StoreWithConfig[]>([]);

  // Initialize store configs when integration is created
  useEffect(() => {
    if (createdIntegration?.stores && createdIntegration.stores.length > 0) {
      const stores = createdIntegration.stores.map((store: any) => ({
        id: store.id,
        name: store.name,
        chainName: store.chainName,
        city: store.city,
        country: store.country,
        useCustomConfig: false,
        config: {},
      }));
      setStoresWithConfig(stores);
    }
  }, [createdIntegration]);

  // Step 2: Objectives
  const [objectives, setObjectives] = useState<OrganizationObjective[]>([
    {
      type: 'INCREASE_SALES_VOLUME' as ObjectiveType,
      target: 20,
      unit: 'PERCENTAGE' as ObjectiveUnit,
    },
  ]);

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

  const handleStartSync = async () => {
    setSyncError('');
    setIsSyncing(true);
    setSyncStarted(true);

    try {
      const result = await platformIntegrationsService.startSegmentedSync(selectedPlatform);
      setSyncProgress(result.progress);
    } catch (error: any) {
      setSyncError(error.message || 'Error al iniciar la sincronización');
      setIsSyncing(false);
      setSyncStarted(false);
    }
  };

  // Platform connection handlers
  const handleConnectPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectionError('');

    if (!connectionEmail || !connectionPassword) {
      setConnectionError('Por favor completa todos los campos');
      return;
    }

    try {
      const response = await connectMutation.mutateAsync({
        email: connectionEmail,
        password: connectionPassword,
      });

      if (response.needsOTP) {
        setNeedsOTP(true);
      } else {
        // Connection successful without OTP
        setCreatedIntegration(response.integration);
        // Recargar usuario para obtener la integración
        await refetchUser();
        // NO avanzar automáticamente - mostrar pantalla de sincronización
      }
    } catch (error: any) {
      setConnectionError(error.message || 'Error al conectar. Verifica tus credenciales.');
      console.error('Connection error:', error);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectionError('');

    if (!otpCode || otpCode.length !== 6) {
      setConnectionError('Por favor ingresa el código de 6 dígitos');
      return;
    }

    try {
      const response = await connectMutation.mutateAsync({
        email: connectionEmail,
        password: connectionPassword,
        otpCode: otpCode, // Send OTP code to the same /connect endpoint
      });

      setCreatedIntegration(response.integration);
      setNeedsOTP(false);
      // Recargar usuario para obtener la integración
      await refetchUser();
      // NO avanzar automáticamente - mostrar pantalla de sincronización
    } catch (error: any) {
      setConnectionError(error.message || 'Código incorrecto. Intenta nuevamente.');
      console.error('OTP verification error:', error);
    }
  };

  const toggleStoreCustomConfig = (storeId: string) => {
    setStoresWithConfig(storesWithConfig.map(store => {
      if (store.id === storeId) {
        return {
          ...store,
          useCustomConfig: !store.useCustomConfig,
          config: !store.useCustomConfig ? { ...defaultConfig } : {},
        };
      }
      return store;
    }));
  };

  const updateStoreConfig = (storeId: string, field: string, value: number | null) => {
    setStoresWithConfig(storesWithConfig.map(store => {
      if (store.id === storeId) {
        return {
          ...store,
          config: {
            ...store.config,
            [field]: value !== null ? value : undefined,
          },
        };
      }
      return store;
    }));
  };

  const handleSubmit = async () => {
    // Obtener la integración ya sea de la que acabamos de crear o de las integraciones del usuario
    let integrationId = createdIntegration?.id;

    if (!integrationId && user?.integrations && user.integrations.length > 0) {
      integrationId = user.integrations[0].id;
    }

    if (!integrationId) {
      console.error('No platform integration found');
      alert('Error: No se encontró ninguna integración de plataforma. Por favor conecta una plataforma primero.');
      return;
    }

    setIsLoading(true);
    try {
      // Build store configs array for stores with custom config
      const storeConfigs = storesWithConfig
        .filter(store => store.useCustomConfig)
        .map(store => ({
          storeId: store.id,
          ...store.config,
        }));

      // Map defaultConfig to costs format for backward compatibility
      const costsForBackend = {
        platformCommission: defaultConfig.platformCommission,
        markup: defaultConfig.markupPercentage,
        fixedCosts: defaultConfig.fixedMonthlyCosts,
        variableCosts: defaultConfig.packagingCost + defaultConfig.deliveryCost,
        costOfGoods: defaultConfig.costOfGoods,
      };

      // Complete onboarding
      await platformIntegrationsService.completeOnboarding(integrationId, {
        costs: costsForBackend,
        objectives,
        storeConfigs: storeConfigs.length > 0 ? storeConfigs : undefined,
      });

      // Recargar usuario explícitamente
      await refetchUser();

      // Wait a moment para asegurar que el usuario se actualizó
      await new Promise(resolve => setTimeout(resolve, 200));

      // Navigate to overview
      navigate('/overview');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      alert(error.message || 'Error al completar el onboarding. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'platform':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Conecta tu Plataforma de Delivery</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Conecta una plataforma para crear tu organización y acceder a tus locales
              </p>
            </div>

            {createdIntegration ? (
              // Show success state after connection
              <div className="space-y-4">
                {!syncStarted ? (
                  <>
                    <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-900 dark:text-green-100">¡Conectado exitosamente!</p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              Plataforma conectada: {createdIntegration.platform}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {createdIntegration.stores && createdIntegration.stores.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Store className="h-4 w-4" />
                        <span>Se detectaron {createdIntegration.stores.length} locales</span>
                      </div>
                    )}

                    <div className="text-center py-4">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Iniciando sincronización automática...
                      </p>
                    </div>
                  </>
                ) : (
                  // Sync progress UI
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="font-semibold text-lg">Sincronizando datos...</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Esto puede tomar unos minutos
                      </p>
                    </div>

                    {/* Sync Steps */}
                    <div className="space-y-3">
                      {syncProgress?.steps.map((step) => {
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
                                      {step.progress}/{step.total}
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
                    {syncProgress?.steps.every(s => s.status === 'completed') && (
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <Check className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                        <p className="font-semibold text-green-900 dark:text-green-100">¡Sincronización completada!</p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Redirigiendo al siguiente paso...
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : needsOTP ? (
              // OTP verification form
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <Label htmlFor="otp">Código de Verificación</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Enviamos un código de 6 dígitos a tu correo
                  </p>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                    autoFocus
                  />
                </div>

                {connectionError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-800 dark:text-red-200">{connectionError}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={connectMutation.isPending || otpCode.length !== 6}
                  className="w-full"
                >
                  {connectMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar Código'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNeedsOTP(false)}
                  className="w-full"
                >
                  Volver
                </Button>
              </form>
            ) : (
              // Platform selection and connection form
              <div className="space-y-6">
                {/* Platform selector */}
                <div>
                  <Label>Selecciona una plataforma</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {[
                      { value: 'PEDIDOS_YA' as DeliveryPlatform, name: 'PedidosYa', icon: '🟡', color: 'yellow' },
                      { value: 'RAPPI' as DeliveryPlatform, name: 'Rappi', icon: '🟢', color: 'green' },
                      { value: 'GLOVO' as DeliveryPlatform, name: 'Glovo', icon: '🟠', color: 'orange' },
                      { value: 'UBER_EATS' as DeliveryPlatform, name: 'Uber Eats', icon: '🟢', color: 'green' },
                    ].map((platform) => (
                      <button
                        key={platform.value}
                        type="button"
                        onClick={() => setSelectedPlatform(platform.value)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedPlatform === platform.value
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <span className="text-xl block">{platform.icon}</span>
                        <span className="block mt-1 text-xs font-medium">{platform.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Connection form */}
                <form onSubmit={handleConnectPlatform} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de {selectedPlatform === 'PEDIDOS_YA' ? 'PedidosYa' : selectedPlatform}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={connectionEmail}
                      onChange={(e) => setConnectionEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={connectionPassword}
                      onChange={(e) => setConnectionPassword(e.target.value)}
                      required
                    />
                  </div>

                  {connectionError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                      <p className="text-sm text-red-800 dark:text-red-200">{connectionError}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={connectMutation.isPending || !connectionEmail || !connectionPassword}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {connectMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <Store className="h-4 w-4 mr-2" />
                        Conectar Plataforma
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-xs text-gray-500 text-center">
                  Tus credenciales se almacenan de forma segura y solo se usan para sincronizar tus datos
                </p>
              </div>
            )}
          </div>
        );

      case 'defaultConfig':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Configuración Predeterminada</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Estos valores se aplicarán a todos tus locales. Podrás personalizar locales individuales en el siguiente paso.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultPlatformCommission">Comisión de Plataforma (%)</Label>
                <Input
                  id="defaultPlatformCommission"
                  type="number"
                  value={defaultConfig.platformCommission}
                  onChange={(e) => setDefaultConfig({ ...defaultConfig, platformCommission: Number(e.target.value) })}
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
                  value={defaultConfig.markupPercentage}
                  onChange={(e) => setDefaultConfig({ ...defaultConfig, markupPercentage: Number(e.target.value) })}
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500">Porcentaje de incremento sobre el costo</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultCostOfGoods">CMV - Costo de Mercadería (%)</Label>
                <Input
                  id="defaultCostOfGoods"
                  type="number"
                  value={defaultConfig.costOfGoods}
                  onChange={(e) => setDefaultConfig({ ...defaultConfig, costOfGoods: Number(e.target.value) })}
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500">Costo de insumos como % del precio de venta</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultFixedCosts">Costos Fijos Mensuales ($)</Label>
                <Input
                  id="defaultFixedCosts"
                  type="number"
                  value={defaultConfig.fixedMonthlyCosts}
                  onChange={(e) => setDefaultConfig({ ...defaultConfig, fixedMonthlyCosts: Number(e.target.value) })}
                  min="0"
                />
                <p className="text-xs text-gray-500">Alquiler, servicios, sueldos</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultPackagingCost">Costo de Packaging ($)</Label>
                <Input
                  id="defaultPackagingCost"
                  type="number"
                  value={defaultConfig.packagingCost}
                  onChange={(e) => setDefaultConfig({ ...defaultConfig, packagingCost: Number(e.target.value) })}
                  min="0"
                />
                <p className="text-xs text-gray-500">Empaquetado por pedido</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultDeliveryCost">Costo de Delivery ($)</Label>
                <Input
                  id="defaultDeliveryCost"
                  type="number"
                  value={defaultConfig.deliveryCost}
                  onChange={(e) => setDefaultConfig({ ...defaultConfig, deliveryCost: Number(e.target.value) })}
                  min="0"
                />
                <p className="text-xs text-gray-500">Costo de envío por pedido</p>
              </div>
            </div>
          </div>
        );

      case 'storeConfig':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Configuración por Local</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Se detectaron {storesWithConfig.length} locales. Puedes personalizar la configuración de cada uno individualmente.
              </p>
            </div>

            <div className="space-y-4">
              {storesWithConfig.map((store) => (
                <Card key={store.id} className={`border-2 transition-all ${
                  store.useCustomConfig ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-200 dark:border-gray-700'
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{store.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {store.chainName}
                          {store.city && ` • ${store.city}`}
                          {store.country && ` • ${store.country}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleStoreCustomConfig(store.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          store.useCustomConfig
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {store.useCustomConfig ? 'Personalizado' : 'Usar valores predeterminados'}
                      </button>
                    </div>

                    {store.useCustomConfig && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="space-y-2">
                          <Label>Comisión de Plataforma (%)</Label>
                          <Input
                            type="number"
                            value={(store.config?.platformCommission ?? defaultConfig.platformCommission) ?? 0}
                            onChange={(e) => updateStoreConfig(store.id, 'platformCommission', Number(e.target.value))}
                            min="0"
                            max="100"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Markup (%)</Label>
                          <Input
                            type="number"
                            value={(store.config?.markupPercentage ?? defaultConfig.markupPercentage) ?? 0}
                            onChange={(e) => updateStoreConfig(store.id, 'markupPercentage', Number(e.target.value))}
                            min="0"
                            max="100"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>CMV - Costo de Mercadería (%)</Label>
                          <Input
                            type="number"
                            value={(store.config?.costOfGoods ?? defaultConfig.costOfGoods) ?? 0}
                            onChange={(e) => updateStoreConfig(store.id, 'costOfGoods', Number(e.target.value))}
                            min="0"
                            max="100"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Costos Fijos Mensuales ($)</Label>
                          <Input
                            type="number"
                            value={(store.config?.fixedMonthlyCosts ?? defaultConfig.fixedMonthlyCosts) ?? 0}
                            onChange={(e) => updateStoreConfig(store.id, 'fixedMonthlyCosts', Number(e.target.value))}
                            min="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Costo de Packaging ($)</Label>
                          <Input
                            type="number"
                            value={(store.config?.packagingCost ?? defaultConfig.packagingCost) ?? 0}
                            onChange={(e) => updateStoreConfig(store.id, 'packagingCost', Number(e.target.value))}
                            min="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Costo de Delivery ($)</Label>
                          <Input
                            type="number"
                            value={(store.config?.deliveryCost ?? defaultConfig.deliveryCost) ?? 0}
                            onChange={(e) => updateStoreConfig(store.id, 'deliveryCost', Number(e.target.value))}
                            min="0"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStoresWithConfig(storesWithConfig.map(store => ({
                    ...store,
                    useCustomConfig: false,
                    config: {},
                  })));
                }}
                className="text-gray-600 dark:text-gray-400"
              >
                Restablecer todos a valores predeterminados
              </Button>
            </div>
          </div>
        );

      case 'objectives':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Configura tus Objetivos</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Define qué quieres lograr para que tu agencia pueda ayudarte mejor
              </p>
            </div>

            <div className="space-y-4">
              {objectives.map((objective, index) => (
                <Card key={index} className="relative">
                  <CardContent className="pt-6">
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

                    {objectives.length > 1 && (
                      <button
                        onClick={() => removeObjective(index)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-700 text-sm"
                      >
                        Eliminar
                      </button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addObjective}
              className="w-full"
            >
              + Agregar Otro Objetivo
            </Button>
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Resumen de Configuración</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Revisa tu configuración antes de confirmar
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuración Predeterminada</CardTitle>
                <CardDescription>Estos valores se aplican a todos los locales</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Comisión de plataforma:</span>
                  <span className="font-medium">{defaultConfig.platformCommission}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Markup:</span>
                  <span className="font-medium">{defaultConfig.markupPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span>CMV:</span>
                  <span className="font-medium">{defaultConfig.costOfGoods}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Costos fijos:</span>
                  <span className="font-medium">${defaultConfig.fixedMonthlyCosts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Costo de packaging:</span>
                  <span className="font-medium">${defaultConfig.packagingCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Costo de delivery:</span>
                  <span className="font-medium">${defaultConfig.deliveryCost.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {storesWithConfig.filter(s => s.useCustomConfig).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Locales con Configuración Personalizada</CardTitle>
                  <CardDescription>
                    {storesWithConfig.filter(s => s.useCustomConfig).length} de {storesWithConfig.length} locales
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {storesWithConfig.filter(s => s.useCustomConfig).map((store) => (
                    <div key={store.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-medium mb-2">{store.name}</h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Comisión:</span>
                          <span className="font-medium">{(store.config?.platformCommission ?? defaultConfig.platformCommission) ?? 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Markup:</span>
                          <span className="font-medium">{(store.config?.markupPercentage ?? defaultConfig.markupPercentage) ?? 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">CMV:</span>
                          <span className="font-medium">{(store.config?.costOfGoods ?? defaultConfig.costOfGoods) ?? 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Costos fijos:</span>
                          <span className="font-medium">${((store.config?.fixedMonthlyCosts ?? defaultConfig.fixedMonthlyCosts) ?? 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Objetivos Configurados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {objectives.map((objective, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>{objectiveTypeLabels[objective.type]}</span>
                    <span className="font-medium">
                      {objective.target}{objectiveUnitLabels[objective.unit]}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  const canGoNext = () => {
    if (currentStep === 'platform') {
      return createdIntegration !== null;
    }
    if (currentStep === 'defaultConfig') {
      return defaultConfig.platformCommission >= 0 && defaultConfig.markupPercentage >= 0;
    }
    if (currentStep === 'objectives') {
      return objectives.length > 0 && objectives.every(o => o.target > 0);
    }
    return true;
  };

  const getCurrentStepNumber = () => {
    switch (currentStep) {
      case 'platform': return 1;
      case 'defaultConfig': return 2;
      case 'storeConfig': return 3;
      case 'objectives': return 4;
      case 'summary': return 5;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`flex items-center ${step < 5 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      getCurrentStepNumber() === step
                        ? 'bg-indigo-600 text-white'
                        : getCurrentStepNumber() > step
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {getCurrentStepNumber() > step ? <Check className="h-4 w-4" /> : step}
                  </div>
                  {step < 5 && (
                    <div className="flex-1 h-1 mx-2 bg-gray-200 dark:bg-gray-700">
                      <div
                        className={`h-full transition-all ${
                          getCurrentStepNumber() > step ? 'bg-green-600' : 'bg-indigo-600'
                        }`}
                        style={{ width: getCurrentStepNumber() > step ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <CardTitle className="text-2xl">
            {currentStep === 'platform' && 'Paso 1 de 5'}
            {currentStep === 'defaultConfig' && 'Paso 2 de 5'}
            {currentStep === 'storeConfig' && 'Paso 3 de 5'}
            {currentStep === 'objectives' && 'Paso 4 de 5'}
            {currentStep === 'summary' && 'Paso 5 de 5'}
          </CardTitle>
          <CardDescription>
            {currentStep === 'platform' && 'Conecta una plataforma de delivery'}
            {currentStep === 'defaultConfig' && 'Configura los valores predeterminados'}
            {currentStep === 'storeConfig' && 'Personaliza la configuración por local'}
            {currentStep === 'objectives' && 'Define tus objetivos de negocio'}
            {currentStep === 'summary' && 'Confirma tu configuración'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {renderStep()}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep === 'defaultConfig') setCurrentStep('platform');
                if (currentStep === 'storeConfig') setCurrentStep('defaultConfig');
                if (currentStep === 'objectives') setCurrentStep('storeConfig');
                if (currentStep === 'summary') setCurrentStep('objectives');
              }}
              disabled={currentStep === 'platform'}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            {currentStep !== 'summary' ? (
              <Button
                onClick={() => {
                  if (currentStep === 'platform') setCurrentStep('defaultConfig');
                  if (currentStep === 'defaultConfig') setCurrentStep('storeConfig');
                  if (currentStep === 'storeConfig') setCurrentStep('objectives');
                  if (currentStep === 'objectives') setCurrentStep('summary');
                }}
                disabled={!canGoNext()}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? 'Guardando...' : 'Completar Configuración'}
                <Check className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
