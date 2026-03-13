import { useState } from 'react';
import { Megaphone, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { useIntegrationStatus, useConnectPedidosYa, useVerifyOTP, useSync, useDisconnect } from '../hooks/useIntegrations';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { DeliveryPlatform } from '../types/integrations';

const platformNames: Record<DeliveryPlatform, string> = {
  PEDIDOS_YA: 'PedidosYa',
  RAPPI: 'Rappi',
  GLOVO: 'Glovo',
  UBER_EATS: 'Uber Eats',
};

export function IntegrationsPage() {
  const [, navigate] = useLocation();
  const { user, refetchUser } = useAuth();
  const { data: status, isLoading } = useIntegrationStatus();
  const connectMutation = useConnectPedidosYa();
  const verifyOTPMutation = useVerifyOTP();
  const syncMutation = useSync();
  const disconnectMutation = useDisconnect();

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await connectMutation.mutateAsync({ email, password });

    if (result.needsOTP) {
      setShowConnectModal(false);
      setShowOTPModal(true);
    } else {
      // Conexión exitosa sin OTP
      setShowConnectModal(false);
      setEmail('');
      setPassword('');

      // Recargar usuario y redirigir al onboarding si es necesario
      await refetchUser?.();
      if (user?.role === 'OWNER' && !user?.organization?.onboardingCompleted) {
        navigate('/onboarding', { transition: true });
      }
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    await verifyOTPMutation.mutateAsync({ email, password, otp });
    setShowOTPModal(false);
    setEmail('');
    setPassword('');
    setOtp('');

    // Recargar usuario y redirigir al onboarding si es necesario
    await refetchUser?.();
    if (user?.role === 'OWNER' && !user?.organization?.onboardingCompleted) {
      navigate('/onboarding', { transition: true });
    }
  };

  const handleSync = async (platform: DeliveryPlatform) => {
    await syncMutation.mutateAsync(platform);
  };

  const handleDisconnect = async (platform: DeliveryPlatform) => {
    await disconnectMutation.mutateAsync(platform);
  };

  const formatLastSync = (date?: string) => {
    if (!date) return 'Nunca';
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const platforms: DeliveryPlatform[] = ['PEDIDOS_YA', 'RAPPI', 'GLOVO', 'UBER_EATS'];
  const connections = status?.connections || [];

  return (
    <main className="py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integrations</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Conecta y gestiona tus plataformas de delivery
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Plataformas Conectadas</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {platforms.map((platform) => {
              const connection = connections.find(c => c.platform === platform);
              const isConnected = connection?.connected || false;

              return (
                <div key={platform} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Megaphone className={`h-6 w-6 ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{platformNames[platform]}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {isConnected ? (
                            <>
                              {connection?.email} · Última sync: {formatLastSync(connection?.lastValidatedAt)}
                            </>
                          ) : (
                            'No conectado'
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {isConnected ? (
                        <>
                          <span className="flex items-center text-sm text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Conectado
                          </span>
                          <button
                            onClick={() => handleSync(platform)}
                            disabled={syncMutation.isPending}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                          >
                            {syncMutation.isPending ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDisconnect(platform)}
                            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            Desconectar
                          </button>
                        </>
                      ) : (
                        platform === 'PEDIDOS_YA' && (
                          <button
                            onClick={() => setShowConnectModal(true)}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                          >
                            Conectar
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Connect Modal */}
        <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Conectar PedidosYa</DialogTitle>
              <DialogDescription>
                Ingresa tus credenciales de PedidosYa para conectar la plataforma
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleConnect}>
              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email de PedidosYa
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowConnectModal(false);
                    setError('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={connectMutation.isPending}
                >
                  {connectMutation.isPending ? 'Conectando...' : 'Conectar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* OTP Modal */}
        <Dialog open={showOTPModal} onOpenChange={setShowOTPModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Código de verificación</DialogTitle>
              <DialogDescription>
                PedidosYa envió un código al email asociado a tu cuenta. Ingresa el código de 6 dígitos.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleVerifyOTP}>
              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Código OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest"
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowOTPModal(false);
                    setError('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={verifyOTPMutation.isPending}
                >
                  {verifyOTPMutation.isPending ? 'Verificando...' : 'Verificar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
