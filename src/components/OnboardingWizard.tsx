import { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronRight, ChevronLeft, Check, Store, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { organizationsService } from '../services/organizationsService';
import { useConnectPedidosYa, useVerifyOTP } from '../hooks/useIntegrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OrganizationCosts, OrganizationObjective } from '../types/organization';
import { objectiveTypeLabels, objectiveUnitLabels, ObjectiveType, ObjectiveUnit } from '../types/organization';

type Step = 'platform' | 'costs' | 'objectives' | 'summary';
type DeliveryPlatform = 'PEDIDOS_YA' | 'RAPPI' | 'GLOVO' | 'UBER_EATS';

export function OnboardingWizard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<Step>('platform');
  const [isLoading, setIsLoading] = useState(false);

  // Platform connection states
  const [selectedPlatform, setSelectedPlatform] = useState<DeliveryPlatform>('PEDIDOS_YA');
  const [createdOrganization, setCreatedOrganization] = useState<any>(null);
  const [connectionEmail, setConnectionEmail] = useState('');
  const [connectionPassword, setConnectionPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [needsOTP, setNeedsOTP] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  // Mutations for platform connection
  const connectMutation = useConnectPedidosYa();
  const verifyOTPMutation = useVerifyOTP();

  // Step 1: Costs
  const [costs, setCosts] = useState<OrganizationCosts>({
    platformCommission: 15,
    markup: 30,
    fixedCosts: 0,
    variableCosts: 0,
    costOfGoods: 0,
  });

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
        setCreatedOrganization(response.organization);
        // Invalidate user query cache to get the organization
        await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        setCurrentStep('costs');
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
      const response = await verifyOTPMutation.mutateAsync({
        email: connectionEmail,
        password: connectionPassword,
        otp: otpCode,
      });

      setCreatedOrganization(response.organization);
      setNeedsOTP(false);
      // Invalidate user query cache to get the organization
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setCurrentStep('costs');
    } catch (error: any) {
      setConnectionError(error.message || 'Código incorrecto. Intenta nuevamente.');
      console.error('OTP verification error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!createdOrganization?.id && !user?.organization?.id) {
      console.error('No organization found');
      return;
    }

    const organizationId = createdOrganization?.id || user?.organization?.id;

    setIsLoading(true);
    try {
      // Complete onboarding
      await organizationsService.completeOnboarding(organizationId, {
        costs,
        objectives,
      });

      // Invalidate user query cache and refetch
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });

      // Wait a moment for the query to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate to overview
      navigate('/overview');
    } catch (error) {
      console.error('Error completing onboarding:', error);
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

            {createdOrganization ? (
              // Show success state after connection
              <div className="space-y-4">
                <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-100">¡Conectado exitosamente!</p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Organización creada: {createdOrganization.name}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {createdOrganization.stores && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Store className="h-4 w-4" />
                    <span>Se detectaron {createdOrganization.stores.total || 0} locales</span>
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
                  disabled={verifyOTPMutation.isPending || otpCode.length !== 6}
                  className="w-full"
                >
                  {verifyOTPMutation.isPending ? (
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

      case 'costs':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Configuración de Gastos</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Define los costos de tu operación para calcular márgenes reales
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platformCommission">Comisión de Plataforma (%)</Label>
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
                <CardTitle className="text-base">Costos Configurados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Comisión de plataforma:</span>
                  <span className="font-medium">{costs.platformCommission}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Markup:</span>
                  <span className="font-medium">{costs.markup}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Costos fijos:</span>
                  <span className="font-medium">${costs.fixedCosts.toLocaleString()}</span>
                </div>
                {costs.variableCosts && (
                  <div className="flex justify-between">
                    <span>Costos variables:</span>
                    <span className="font-medium">${costs.variableCosts.toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

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
      return createdOrganization !== null;
    }
    if (currentStep === 'costs') {
      return costs.platformCommission >= 0 && costs.markup >= 0 && costs.fixedCosts >= 0;
    }
    if (currentStep === 'objectives') {
      return objectives.length > 0 && objectives.every(o => o.target > 0);
    }
    return true;
  };

  const getCurrentStepNumber = () => {
    switch (currentStep) {
      case 'platform': return 1;
      case 'costs': return 2;
      case 'objectives': return 3;
      case 'summary': return 4;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`flex items-center ${step < 4 ? 'flex-1' : ''}`}
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
                  {step < 4 && (
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
            {currentStep === 'platform' && 'Paso 1 de 4'}
            {currentStep === 'costs' && 'Paso 2 de 4'}
            {currentStep === 'objectives' && 'Paso 3 de 4'}
            {currentStep === 'summary' && 'Paso 4 de 4'}
          </CardTitle>
          <CardDescription>
            {currentStep === 'platform' && 'Conecta una plataforma de delivery'}
            {currentStep === 'costs' && 'Configura los gastos de tu operación'}
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
                if (currentStep === 'costs') setCurrentStep('platform');
                if (currentStep === 'objectives') setCurrentStep('costs');
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
                  if (currentStep === 'platform') setCurrentStep('costs');
                  if (currentStep === 'costs') setCurrentStep('objectives');
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
