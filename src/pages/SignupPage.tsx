import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'wouter';
import { Loader2, TrendingUp, CheckCircle2, BarChart3, Target, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const { signup, isLoading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (password !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Always create as OWNER
    await signup({ email, password, name, role: 'OWNER' });
  };

  const passwordRequirements = [
    { text: 'Al menos 6 caracteres', met: password.length >= 6 },
    { text: 'Letras y números', met: /[A-Za-z]/.test(password) && /[0-9]/.test(password) },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Top Section on Mobile - Logo */}
      <div className="lg:hidden bg-gradient-to-br from-blue-600 to-blue-700 p-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">OrderlyAI</span>
        </div>
        <div className="mt-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Comienza gratis</h1>
          <p className="text-blue-100 text-sm">Optimiza tu restaurante en minutos</p>
        </div>
      </div>

      {/* Left Side - Branding (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">OrderlyAI</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-5xl font-bold text-white leading-tight">
            Comienza a optimizar tu negocio
          </h1>
          <p className="text-xl text-blue-100">
            Únete a cientos de restaurantes que ya están aumentando sus ventas
          </p>

          <div className="space-y-4 pt-8">
            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="bg-blue-500/30 p-2 rounded-lg flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-blue-200" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Dashboard completo</h3>
                <p className="text-blue-200 text-sm">Visualiza todas tus métricas en tiempo real</p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="bg-blue-500/30 p-2 rounded-lg flex-shrink-0">
                <Zap className="h-6 w-6 text-blue-200" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Sugerencias automáticas</h3>
                <p className="text-blue-200 text-sm">Recibe recomendaciones basadas en IA</p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="bg-blue-500/30 p-2 rounded-lg flex-shrink-0">
                <Target className="h-6 w-6 text-blue-200" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Resultados medibles</h3>
                <p className="text-blue-200 text-sm">Mide el impacto de cada optimización</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-blue-200">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm">Comienza gratis, sin tarjeta de crédito</span>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md">
          {/* Form Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Crea tu cuenta
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Comienza a optimizar tu restaurante
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {(error || passwordError) && (
                <div className="p-3 sm:p-4 text-sm text-red-800 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                  {passwordError || error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base">
                  Nombre completo
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 sm:h-11 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="juan@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 sm:h-11 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 sm:h-11 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />

                {password && (
                  <div className="mt-2 space-y-1">
                    {passwordRequirements.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm">
                        {req.met ? (
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border-2 border-gray-300 flex-shrink-0"></div>
                        )}
                        <span className={req.met ? 'text-green-600' : 'text-gray-500'}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base">
                  Confirmar contraseña
                </Label>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-10 sm:h-11 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />

                {confirmPassword && password === confirmPassword && (
                  <p className="text-xs sm:text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Las contraseñas coinciden
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                />
                <label className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Acepto los{' '}
                  <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                    Términos
                  </Link>{' '}
                  y{' '}
                  <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                    Privacidad
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 sm:h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  'Crear cuenta'
                )}
              </Button>
            </form>

            <div className="mt-5 sm:mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 text-xs sm:text-sm">
                    ¿Ya tienes cuenta?
                  </span>
                </div>
              </div>

              <div className="mt-3 sm:mt-4">
                <Link
                  href="/login"
                  className="w-full h-10 sm:h-11 flex items-center justify-center rounded-xl border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm sm:text-base"
                >
                  Iniciar sesión
                </Link>
              </div>
            </div>
          </div>

          {/* Benefits for mobile */}
          <div className="mt-6 lg:hidden space-y-2.5 px-2">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              <span>Análisis de ventas en tiempo real</span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              <span>Sugerencias automáticas con IA</span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              <span>Optimización de menús y precios</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
