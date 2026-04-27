import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ChevronRight, ChevronLeft, Check, Store, Loader2, TrendingUp, UtensilsCrossed, ShoppingCart, Home, Settings, Target, BarChart3, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { platformIntegrationsService, type SyncProgress } from '../services/platformIntegrationsService';
import { useConnectPedidosYa } from '../hooks/useIntegrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

// Helper para obtener el nombre legible de la plataforma
const getPlatformName = (platform: DeliveryPlatform): string => {
  switch (platform) {
    case 'PEDIDOS_YA':
      return 'PedidosYa';
    case 'RAPPI':
      return 'Rappi';
    case 'GLOVO':
      return 'Glovo';
    case 'UBER_EATS':
      return 'Uber Eats';
    default:
      return platform;
  }
};

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
  const [isConnecting, setIsConnecting] = useState(false); // Mantener botón deshabilitado mientras se conecta o sincroniza
  const [showSyncWarning, setShowSyncWarning] = useState(false); // Controlar el diálogo de advertencia de sincronización

  // Efecto para recuperar estado de sincronización del localStorage al cargar el componente
  useEffect(() => {
    const savedSyncState = localStorage.getItem('onboarding_sync_state');
    if (savedSyncState) {
      try {
        const state = JSON.parse(savedSyncState);
        console.log('📋 Recuperando estado de sincronización del localStorage:', state);

        // Verificar si el estado está expirado (más de 30 segundos)
        const STATE_EXPIRY_TIME = 30 * 1000; // 30 segundos
        const now = Date.now();
        const isExpired = state.timestamp && (now - state.timestamp > STATE_EXPIRY_TIME);

        if (isExpired) {
          console.log('⏰ Estado de sincronización expirado, limpiando...');
          localStorage.removeItem('onboarding_sync_state');
          return; // No usar estado expirado
        }

        if (state.isSyncing) {
          setIsSyncing(true);
          setSyncStarted(true);
          setIsConnecting(true);
          if (state.syncProgress) {
            setSyncProgress(state.syncProgress);
          }
        } else {
          // Limpiar localStorage si no hay sincronización activa
          localStorage.removeItem('onboarding_sync_state');
        }
      } catch (error) {
        console.error('❌ Error al recuperar estado de sincronización:', error);
        localStorage.removeItem('onboarding_sync_state'); // Limpiar si hay error
      }
    }
  }, []); // Solo ejecutar una vez al montar el componente

  // Efecto para guardar estado de sincronización en localStorage cuando cambia
  useEffect(() => {
    if (isSyncing && syncProgress) {
      const state = {
        isSyncing: true,
        syncStarted: true,
        syncProgress,
        timestamp: Date.now(),
      };
      localStorage.setItem('onboarding_sync_state', JSON.stringify(state));
      console.log('💾 Guardando estado de sincronización en localStorage:', state);
    } else if (!isSyncing) {
      localStorage.removeItem('onboarding_sync_state');
      console.log('🗑️ Limpiando estado de sincronización del localStorage');
    }
  }, [isSyncing, syncProgress]);

  // Mutation for platform connection
  const connectMutation = useConnectPedidosYa();

  // Polling effect for sync progress
  useEffect(() => {
    console.log('🔄 Polling effect check:', { syncStarted, isSyncing, selectedPlatform });
    if (!syncStarted || !isSyncing) return;

    console.log('✅ Starting polling for sync progress...');
    const pollInterval = setInterval(async () => {
      try {
        console.log('📡 Fetching sync progress...');
        const result = await platformIntegrationsService.getSyncProgress(selectedPlatform);
        console.log('📊 Sync progress result:', result);

        if (result.status === 'no_sync_in_progress') {
          console.log('❌ No sync in progress, stopping polling');
          setIsSyncing(false);
          setSyncStarted(false);
          setIsConnecting(false);
          localStorage.removeItem('onboarding_sync_state'); // ✅ Limpiar localStorage
          return;
        }

        if (result.progress) {
          console.log('✅ Updating sync progress state:', result.progress);
          setSyncProgress(result.progress);

          const allCompleted = result.progress.steps.every(step => step.status === 'completed');
          if (allCompleted) {
            console.log('🎉 All steps completed, moving to next step');
            setIsSyncing(false);
            setSyncStarted(false);
            setIsConnecting(false); // Habilitar botón cuando se completa la sincronización
            setShowSyncWarning(false); // Cerrar el diálogo de advertencia si está abierto
            localStorage.removeItem('onboarding_sync_state'); // ✅ Limpiar localStorage cuando termina
            setTimeout(() => {
              setCurrentStep('defaultConfig');
            }, 1000);
          }
        }
      } catch (error: any) {
        console.error('❌ Error polling sync progress:', error);
      }
    }, 2000);

    return () => {
      console.log('🛑 Cleaning up polling interval');
      clearInterval(pollInterval);
    };
  }, [syncStarted, isSyncing, selectedPlatform]);

  // Auto-start sync when connection is successful
  useEffect(() => {
    console.log('🔗 Auto-start sync effect check:', { createdIntegration: !!createdIntegration, syncStarted });
    if (createdIntegration && !syncStarted) {
      console.log('🎯 Auto-starting sync...');
      handleStartSync();
    }
  }, [createdIntegration]);

  // Default configuration (Step 2)
  const [defaultConfig, setDefaultConfig] = useState({
    platformCommission: 15,
    markupPercentage: 30,
    costOfGoods: 30,
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

  const handleConnectPlatform = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setConnectionError('');
    setIsLoading(true);
    setIsConnecting(true); // Mantener botón deshabilitado

    try {
      const result = await connectMutation.mutateAsync({
        email: connectionEmail,
        password: connectionPassword,
      });

      if (result.needsOTP) {
        setNeedsOTP(true);
        setIsConnecting(false); // Habilitar botón si solo necesita OTP
      } else if (result.integration) {
        setCreatedIntegration(result.integration);
        // NO poner setIsConnecting(false) aquí - mantener deshabilitado mientras se sincroniza
      }
    } catch (error: any) {
      setConnectionError(error.message || 'Error al conectar con la plataforma');
      setIsConnecting(false); // Habilitar botón si hay error
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setConnectionError('');
    setIsLoading(true);
    setIsConnecting(true); // Mantener botón deshabilitado

    try {
      const result = await connectMutation.mutateAsync({
        email: connectionEmail,
        password: connectionPassword,
        otpCode,
      });

      if (result.integration) {
        setCreatedIntegration(result.integration);
        setNeedsOTP(false);
        // NO poner setIsConnecting(false) aquí - mantener deshabilitado mientras se sincroniza
      }
    } catch (error: any) {
      setConnectionError(error.message || 'Error al verificar el código');
      setIsConnecting(false); // Habilitar botón si hay error
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSync = async () => {
    console.log('🚀 handleStartSync called for platform:', selectedPlatform);
    try {
      setIsSyncing(true);
      setSyncStarted(true);
      setSyncError('');
      setIsConnecting(true); // Mantener botón deshabilitado mientras se sincroniza

      console.log('📡 Calling startSegmentedSync...');
      const result = await platformIntegrationsService.startSegmentedSync(selectedPlatform);
      console.log('✅ startSegmentedSync result:', result);

      // Guardar estado inicial en localStorage para persistencia
      if (result.progress) {
        const state = {
          isSyncing: true,
          syncStarted: true,
          syncProgress: result.progress,
          timestamp: Date.now(),
        };
        localStorage.setItem('onboarding_sync_state', JSON.stringify(state));
        console.log('💾 Estado inicial de sincronización guardado en localStorage:', state);
      }
    } catch (error: any) {
      console.error('❌ Error in handleStartSync:', error);
      setSyncError(error.message || 'Error al iniciar la sincronización');
      setIsSyncing(false);
      setSyncStarted(false);
      setIsConnecting(false); // Habilitar botón si hay error
      localStorage.removeItem('onboarding_sync_state'); // ✅ Limpiar localStorage si hay error
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
    // Permitir completar onboarding aunque la sincronización esté en progreso
    console.log('🎯 handleCompleteOnboarding llamado. Estado:', { isSyncing, currentStep });

    // NOTA: Ya NO bloqueamos el onboarding si está sincronizando.
    // El modal se mostrará en /overview mientras el sync continúa en segundo plano.

    console.log('✅ Completando onboarding. La sincronización continuará en segundo plano.');
    setIsLoading(true);
    try {
      console.log('🚀 Completando onboarding...');

      // Obtener el ID de la integración creada
      if (!createdIntegration?.id) {
        throw new Error('No hay integración creada');
      }

      // Preparar datos según el formato esperado por el backend
      const costs = {
        platformCommission: defaultConfig.platformCommission,
        markup: defaultConfig.markupPercentage, // El backend espera "markup", no "markupPercentage"
        costOfGoods: defaultConfig.costOfGoods,
        fixedCosts: 0, // Default value
        packagingCost: 0, // Default value
        deliveryCost: 0, // Default value
      };

      // Preparar configuraciones de stores (solo stores con config personalizado)
      const storeConfigs = storesWithConfig
        .filter(store => store.useCustomConfig && store.config)
        .map(store => ({
          storeId: store.id,
          platformCommission: store.config?.platformCommission,
          markup: store.config?.markupPercentage, // El backend espera "markup", no "markupPercentage"
          costOfGoods: store.config?.costOfGoods,
          fixedCosts: store.config?.fixedMonthlyCosts || 0, // El backend espera "fixedCosts", no "fixedMonthlyCosts"
          packagingCost: store.config?.packagingCost || 0,
          deliveryCost: store.config?.deliveryCost || 0,
        }));

      console.log('💾 Llamando endpoint de onboarding...');
      console.log('💾 Costs:', costs);
      console.log('💾 StoreConfigs:', storeConfigs);
      console.log('💾 Objectives:', objectives);

      const response = await fetch(`/api/platform-integrations/${createdIntegration.id}/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({
          costs,
          objectives,
          storeConfigs,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error al completar onboarding: ${response.status}`);
      }

      console.log('✅ Onboarding completado exitosamente');

      // Refresh user and navigate
      console.log('🔄 Actualizando usuario y navegando...');
      await refetchUser();
      navigate('/stores');
    } catch (error: any) {
      console.error('❌ Error completando onboarding:', error);
      alert(`Error al completar el onboarding: ${error.message}`);
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
              {!needsOTP && !createdIntegration && !isSyncing ? (
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
                    disabled={isLoading || connectMutation.isPending || isConnecting}
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
              ) : createdIntegration || isSyncing ? (
                // Mostrar estado de conexión exitosa y sincronización
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    ¡Cuenta conectada exitosamente!
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {isSyncing ? `Sincronizando datos de ${getPlatformName(selectedPlatform)}...` : 'Iniciando sincronización...'}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {isSyncing ? `Procesando datos de ${getPlatformName(selectedPlatform)}...` : 'Iniciando sincronización...'}
                    </span>
                  </div>
                </div>
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
              {syncProgress && (
                <div className="space-y-4">
                  {/* Header de sincronización */}
                  <div className="text-center">
                    <div className="inline-flex p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-3">
                      <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Obteniendo tus datos de PedidosYa...
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Esto puede tomar unos momentos. Por favor no cierres esta ventana.
                    </p>
                    {createdIntegration && (
                      <>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 font-medium">
                          Cuenta conectada: {createdIntegration.email}
                        </p>
                        {createdIntegration.stores && createdIntegration.stores.length > 0 && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {createdIntegration.stores.length} {createdIntegration.stores.length === 1 ? 'local detectado' : 'locales detectados'}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Success message when all steps are completed */}
                  {syncProgress.steps.every(step => step.status === 'completed') && (
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <Check className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        ¡Sincronización completada!
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-200">
                        Todos tus datos han sido importados correctamente
                      </p>
                    </div>
                  )}

                  {/* Progress steps */}
                  <div className="space-y-3">
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
                </div>
              )}

              {syncError && (
                <div className="p-3 sm:p-4 text-sm text-red-800 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                  {syncError}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {Object.entries({
                platformCommission: { label: 'Comisión', suffix: '%', icon: BarChart3 },
                markupPercentage: { label: 'Margen', suffix: '%', icon: Target },
                costOfGoods: { label: 'Costo', suffix: '%', icon: UtensilsCrossed },
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

      {/* Sync Warning Dialog */}
      <Dialog open={showSyncWarning} onOpenChange={setShowSyncWarning}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span>Sincronización en progreso</span>
            </DialogTitle>
            <DialogDescription>
              Aún estamos sincronizando tus datos de PedidosYa.
            </DialogDescription>
          </DialogHeader>

          {/* Mostrar el progreso actual de sincronización */}
          {syncProgress && (
            <div className="space-y-4 py-4">
              {syncProgress.steps.map((step, idx) => {
                const StepIcon = step.step === 'stores' ? Store :
                                step.step === 'menu' ? UtensilsCrossed : ShoppingCart;

                return (
                  <div key={idx} className="flex items-center gap-3">
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Por favor espera a que se complete la sincronización antes de continuar.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
