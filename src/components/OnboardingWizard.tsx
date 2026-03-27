import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ChevronRight, ChevronLeft, Check, Store, Loader2, TrendingUp, UtensilsCrossed, ShoppingCart, Home, Settings, Target, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { platformIntegrationsService, type SyncProgress } from '../services/platformIntegrationsService';
import { useConnectPedidosYa } from '../hooks/useIntegrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
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
  const { refetchUser } = useAuth();
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

  // Mutation for platform connection
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

          const allCompleted = result.progress.steps.every(step => step.status === 'completed');
          if (allCompleted) {
            setIsSyncing(false);
            setSyncStarted(false);
            setTimeout(() => {
              setCurrentStep('defaultConfig');
            }, 1000);
          }
        }
      } catch (error: any) {
        console.error('Error polling sync progress:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [syncStarted, isSyncing, selectedPlatform]);

  // Auto-start sync when connection is successful
  useEffect(() => {
    if (createdIntegration && !syncStarted) {
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

  // Objectives (Step 4)
  const [objectives, setObjectives] = useState<Array<OrganizationObjective & { id: string }>>([]);

  const handleConnectPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectionError('');
    setIsLoading(true);

    try {
      const result = await connectMutation.mutateAsync({
        email: connectionEmail,
        password: connectionPassword,
      });

      if (result.needsOTP) {
        setNeedsOTP(true);
      } else if (result.integration) {
        setCreatedIntegration(result.integration);
      }
    } catch (error: any) {
      setConnectionError(error.message || 'Error al conectar con la plataforma');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectionError('');
    setIsLoading(true);

    try {
      const result = await connectMutation.mutateAsync({
        email: connectionEmail,
        password: connectionPassword,
        otpCode,
      });

      if (result.integration) {
        setCreatedIntegration(result.integration);
        setNeedsOTP(false);
      }
    } catch (error: any) {
      setConnectionError(error.message || 'Error al verificar el código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSync = async () => {
    try {
      setIsSyncing(true);
      setSyncStarted(true);
      setSyncError('');

      await platformIntegrationsService.startSegmentedSync(selectedPlatform);
    } catch (error: any) {
      setSyncError(error.message || 'Error al iniciar la sincronización');
      setIsSyncing(false);
      setSyncStarted(false);
    }
  };

  const addObjective = () => {
    setObjectives([...objectives, {
      id: crypto.randomUUID(),
      type: ObjectiveType.INCREASE_SALES_VOLUME,
      unit: ObjectiveUnit.PERCENTAGE,
      target: 10,
    }]);
  };

  const updateObjective = (id: string, updates: Partial<OrganizationObjective>) => {
    setObjectives(objectives.map(obj => obj.id === id ? { ...obj, ...updates } : obj));
  };

  const removeObjective = (id: string) => {
    setObjectives(objectives.filter(obj => obj.id !== id));
  };

  const handleCompleteOnboarding = async () => {
    setIsLoading(true);
    try {
      // Save default config
      await fetch('/api/business-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify(defaultConfig),
      });

      // Save store configs
      for (const store of storesWithConfig) {
        if (store.useCustomConfig && store.config) {
          await fetch(`/api/stores/${store.id}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
            body: JSON.stringify(store.config),
          });
        }
      }

      // Save objectives
      for (const objective of objectives) {
        await fetch('/api/objectives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
          body: JSON.stringify(objective),
        });
      }

      await refetchUser();
      navigate('/overview');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 'platform', title: 'Plataforma', icon: Store },
    { id: 'defaultConfig', title: 'Configuración', icon: Settings },
    { id: 'storeConfig', title: 'Locales', icon: Home },
    { id: 'objectives', title: 'Objetivos', icon: Target },
    { id: 'summary', title: 'Resumen', icon: Check },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header - Mobile */}
      <div className="lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 p-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Configura tu cuenta</h1>
            <p className="text-blue-100 text-xs">Paso {currentStepIndex + 1} de {steps.length}</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-blue-600 text-white'
                          : isCurrent
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-2 ring-blue-600'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1 hidden sm:block ${
                        isCurrent ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Step 1: Platform Connection */}
        {currentStep === 'platform' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-4">
                <Store className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Conecta tu plataforma de delivery
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Comienza conectando tu cuenta de PedidosYa para sincronizar tus datos
              </p>
            </div>

            <div className="space-y-6">
              {/* Platform selector */}
              <div>
                <Label className="text-sm sm:text-base font-medium mb-3 block">Selecciona la plataforma</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['PEDIDOS_YA', 'RAPPI', 'GLOVO', 'UBER_EATS'] as DeliveryPlatform[]).map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setSelectedPlatform(platform)}
                      disabled={platform !== 'PEDIDOS_YA'}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        selectedPlatform === platform
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-medium block">
                        {platform === 'PEDIDOS_YA' ? 'PedidosYa' :
                         platform === 'RAPPI' ? 'Rappi' :
                         platform === 'GLOVO' ? 'Glovo' : 'Uber Eats'}
                      </span>
                      {platform !== 'PEDIDOS_YA' && (
                        <span className="text-xs text-gray-500 block mt-1">Próximamente</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Connection form */}
              {!needsOTP ? (
                <form onSubmit={handleConnectPlatform} className="space-y-4">
                  {connectionError && (
                    <div className="p-3 sm:p-4 text-sm text-red-800 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                      {connectionError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm sm:text-base">Email de PedidosYa</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="tu@email.com"
                      value={connectionEmail}
                      onChange={(e) => setConnectionEmail(e.target.value)}
                      className="h-10 sm:h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm sm:text-base">Contraseña de PedidosYa</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={connectionPassword}
                      onChange={(e) => setConnectionPassword(e.target.value)}
                      className="h-10 sm:h-11"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || connectMutation.isPending}
                    className="w-full h-10 sm:h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
                  >
                    {isLoading || connectMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      'Conectar cuenta'
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Enviamos un código de 6 dígitos a tu correo
                    </p>
                  </div>

                  {connectionError && (
                    <div className="p-3 sm:p-4 text-sm text-red-800 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                      {connectionError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm sm:text-base">Código de verificación</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="h-10 sm:h-11 text-center text-2xl tracking-widest"
                      autoFocus
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={connectMutation.isPending || otpCode.length !== 6}
                    className="w-full h-10 sm:h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
                  >
                    {connectMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      'Verificar'
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setNeedsOTP(false)}
                    className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Volver
                  </button>
                </form>
              )}

              {/* Sync progress */}
              {isSyncing && syncProgress && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sincronizando tus datos...</span>
                  </div>

                  {syncProgress.steps.map((step, idx) => {
                    const StepIcon = step.step === 'stores' ? Store :
                                    step.step === 'menu' ? UtensilsCrossed : ShoppingCart;

                    return (
                      <Card key={idx} className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            step.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                            step.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30' :
                            'bg-gray-100 dark:bg-gray-700'
                          }`}>
                            {step.status === 'completed' ? (
                              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : step.status === 'in_progress' ? (
                              <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                            ) : (
                              <StepIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">
                                {step.step === 'stores' ? 'Locales' :
                                 step.step === 'menu' ? 'Menú' : 'Órdenes'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {step.progress}/{step.total}
                              </span>
                            </div>

                            {(step.status === 'in_progress' || step.status === 'completed') && (
                              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    step.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${(step.progress / step.total) * 100}%` }}
                                />
                              </div>
                            )}

                            {step.message && (
                              <p className="text-xs text-gray-500 mt-1">{step.message}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {syncError && (
                <div className="p-3 sm:p-4 text-sm text-red-800 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                  {syncError}
                </div>
              )}

              {syncProgress?.steps.every(s => s.status === 'completed') && (
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="font-semibold text-green-900 dark:text-green-100">¡Sincronización completada!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Default Configuration */}
        {currentStep === 'defaultConfig' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-4">
                <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Configura tus márgenes
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Estos valores nos ayudan a calcular tus ganancias reales
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {Object.entries({
                platformCommission: { label: 'Comisión plataforma', suffix: '%', icon: BarChart3 },
                markupPercentage: { label: 'Margen deseado', suffix: '%', icon: Target },
                costOfGoods: { label: 'Costo de productos', suffix: '%', icon: UtensilsCrossed },
                fixedMonthlyCosts: { label: 'Costos fijos mensuales', suffix: '$', icon: Home },
              }).map(([key, { label, suffix, icon: Icon }]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-sm sm:text-base flex items-center gap-2">
                    <Icon className="h-4 w-4 text-blue-600" />
                    {label}
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={defaultConfig[key as keyof typeof defaultConfig]}
                      onChange={(e) => setDefaultConfig({
                        ...defaultConfig,
                        [key]: parseFloat(e.target.value) || 0
                      })}
                      className="h-10 sm:h-11 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      {suffix}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Store Configuration */}
        {currentStep === 'storeConfig' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-4">
                <Home className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Configura tus locales
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Personaliza la configuración por local si lo necesitas
              </p>
            </div>

            <div className="space-y-4">
              {storesWithConfig.map((store) => (
                <Card key={store.id} className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{store.name}</h3>
                      {store.chainName && (
                        <p className="text-sm text-gray-500">{store.chainName}</p>
                      )}
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={store.useCustomConfig}
                        onChange={(e) => {
                          setStoresWithConfig(storesWithConfig.map(s =>
                            s.id === store.id ? { ...s, useCustomConfig: e.target.checked } : s
                          ));
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span>Configuración personalizada</span>
                    </label>
                  </div>

                  {store.useCustomConfig && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {Object.entries({
                        platformCommission: 'Comisión %',
                        markupPercentage: 'Margen %',
                        costOfGoods: 'Costo %',
                      }).map(([key, label]) => (
                        <div key={key} className="space-y-1">
                          <Label className="text-xs">{label}</Label>
                          <Input
                            type="number"
                            value={store.config?.[key as keyof typeof store.config] || ''}
                            onChange={(e) => {
                              setStoresWithConfig(storesWithConfig.map(s =>
                                s.id === store.id ? {
                                  ...s,
                                  config: { ...s.config, [key]: parseFloat(e.target.value) || 0 }
                                } : s
                              ));
                            }}
                            className="h-9"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Objectives */}
        {currentStep === 'objectives' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-4">
                <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Define tus objetivos
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Establece metas para medir tu progreso
              </p>
            </div>

            <div className="space-y-4">
              {objectives.map((objective) => (
                <Card key={objective.id} className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo</Label>
                      <select
                        value={objective.type}
                        onChange={(e) => updateObjective(objective.id, { type: e.target.value as ObjectiveType })}
                        className="w-full h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-sm"
                      >
                        {Object.entries(objectiveTypeLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Meta</Label>
                      <Input
                        type="number"
                        value={objective.target}
                        onChange={(e) => updateObjective(objective.id, { target: parseFloat(e.target.value) || 0 })}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Unidad</Label>
                      <select
                        value={objective.unit}
                        onChange={(e) => updateObjective(objective.id, { unit: e.target.value as ObjectiveUnit })}
                        className="w-full h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-sm"
                      >
                        {Object.entries(objectiveUnitLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeObjective(objective.id)}
                        className="w-full h-9"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addObjective}
                className="w-full h-10 sm:h-11 border-2 border-dashed"
              >
                + Agregar objetivo
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Summary */}
        {currentStep === 'summary' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-4">
                <Check className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                ¡Todo listo!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Revisa tu configuración antes de comenzar
              </p>
            </div>

            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Plataforma conectada</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  PedidosYa - {createdIntegration?.email}
                </p>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-2">Locales sincronizados</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {storesWithConfig.length} locales configurados
                </p>
              </Card>

              {objectives.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Objetivos establecidos</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {objectives.length} metas definidas
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 gap-4">
          <Button
            variant="outline"
            onClick={() => {
              const prevStep = steps[Math.max(0, currentStepIndex - 1)];
              setCurrentStep(prevStep.id as Step);
            }}
            disabled={currentStepIndex === 0}
            className="flex-1 sm:flex-none h-10 sm:h-11"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>

          {currentStep !== 'summary' ? (
            <Button
              onClick={() => {
                const nextStep = steps[Math.min(steps.length - 1, currentStepIndex + 1)];
                setCurrentStep(nextStep.id as Step);
              }}
              disabled={currentStep === 'platform' && !createdIntegration}
              className="flex-1 sm:flex-none h-10 sm:h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleCompleteOnboarding}
              disabled={isLoading}
              className="flex-1 sm:flex-none h-10 sm:h-11 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Completar
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
