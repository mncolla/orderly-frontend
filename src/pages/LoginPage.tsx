import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'wouter';
import { Loader2, TrendingUp, BarChart3, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

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
          <h1 className="text-2xl font-bold mb-2">Optimiza tu negocio</h1>
          <p className="text-blue-100 text-sm">Analiza, optimiza y aumenta tus ventas</p>
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
            Optimiza tu negocio de delivery
          </h1>
          <p className="text-xl text-blue-100">
            Analiza datos, recibe sugerencias accionables y aumenta tus ventas en PedidosYa
          </p>

          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <BarChart3 className="h-8 w-8 text-blue-200 mb-2" />
              <h3 className="text-white font-semibold">Análisis en tiempo real</h3>
              <p className="text-blue-200 text-sm">Métricas de tus ventas</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Target className="h-8 w-8 text-blue-200 mb-2" />
              <h3 className="text-white font-semibold">Sugerencias inteligentes</h3>
              <p className="text-blue-200 text-sm">Recomendaciones automáticas</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-blue-200">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm">Potenciado por Inteligencia Artificial</span>
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
                {window.innerWidth < 1024 ? 'Bienvenido' : 'Bienvenido de nuevo'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Ingresa tus credenciales para acceder
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {error && (
                <div className="p-3 sm:p-4 text-sm text-red-800 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

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
                  placeholder="nombre@ejemplo.com"
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
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 sm:h-11 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    Recordarme
                  </span>
                </label>
                <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 sm:h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  'Iniciar sesión'
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
                    ¿No tienes cuenta?
                  </span>
                </div>
              </div>

              <div className="mt-3 sm:mt-4">
                <Link
                  href="/signup"
                  className="w-full h-10 sm:h-11 flex items-center justify-center rounded-xl border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm sm:text-base"
                >
                  Crear cuenta
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-4 sm:mt-6 text-center text-xs text-gray-500 dark:text-gray-400 px-4">
            Al continuar, aceptas nuestros{' '}
            <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Términos
            </Link>{' '}
            y{' '}
            <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Privacidad
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
