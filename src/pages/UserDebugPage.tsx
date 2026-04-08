import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  integrations: Array<{
    id: string;
    platform: string;
    connected: boolean;
    email?: string;
    lastSyncAt?: string | null;
  }>;
}

export default function UserDebugPage() {
  const { user, refetchUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testUserEmail, setTestUserEmail] = useState('');
  const [testUserName, setTestUserName] = useState('');
  const [testUserPassword, setTestUserPassword] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // 1. Crear usuario de prueba
  const createTestUser = async () => {
    if (!testUserEmail || !testUserName || !testUserPassword) {
      showMessage('error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          name: testUserName,
          password: testUserPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showMessage('success', `Usuario creado: ${data.user.email}`);
        setTestUserEmail('');
        setTestUserName('');
        setTestUserPassword('');
      } else {
        showMessage('error', data.error || 'Error al crear usuario');
      }
    } catch (error: any) {
      showMessage('error', `Error: ${error.message}`);
    }
    setLoading(false);
  };

  // 2. Resetear usuario actual (volver al onboarding)
  const resetCurrentUser = async () => {
    if (!user) {
      showMessage('error', 'No hay usuario logueado');
      return;
    }

    if (!confirm('⚠️ Esto borrará todas tus integraciones y te llevará de vuelta al onboarding. ¿Continuar?')) {
      return;
    }

    setLoading(true);
    try {
      // Desconectar todas las integraciones del usuario
      for (const integration of user.integrations || []) {
        await fetch(`${API_URL}/delivery/${integration.platform}/disconnect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
      }

      showMessage('success', 'Usuario reseteado. Redirigiendo al onboarding...');

      // Refrescar usuario y redirigir al onboarding
      await refetchUser?.();
      setTimeout(() => {
        window.location.href = '/onboarding';
      }, 1500);
    } catch (error: any) {
      showMessage('error', `Error: ${error.message}`);
    }
    setLoading(false);
  };

  // 3. Ver detalles del usuario actual
  const UserDetails = () => {
    if (!user) {
      return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            No hay usuario logueado. <a href="/login" className="underline font-medium">Inicia sesión</a>
          </p>
        </div>
      );
    }

    const userData: UserData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      integrations: user.integrations || [],
    };

    return (
      <div className="space-y-4">
        {/* Info básica */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Información Básica</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">ID:</span>
              <p className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded mt-1">{userData.id}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Email:</span>
              <p className="font-medium">{userData.email}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Nombre:</span>
              <p className="font-medium">{userData.name}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Rol:</span>
              <p className="font-medium">{userData.role}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Creado:</span>
              <p className="text-sm">{new Date(userData.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Actualizado:</span>
              <p className="text-sm">{new Date(userData.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Integraciones */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Integraciones ({userData.integrations.length})</h3>
          {userData.integrations.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sin integraciones</p>
          ) : (
            <div className="space-y-2">
              {userData.integrations.map((integration) => (
                <div key={integration.id} className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{integration.platform}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      integration.connected
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                    }`}>
                      {integration.connected ? 'Conectado' : 'No conectado'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p>Email: {integration.email || 'N/A'}</p>
                    <p>ID: {integration.id}</p>
                    {integration.lastSyncAt && (
                      <p>Último sync: {new Date(integration.lastSyncAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón de reset */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2 text-red-900 dark:text-red-100">Zona de Peligro</h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
            Esto borrará todas tus integraciones y te llevará de vuelta al onboarding.
          </p>
          <button
            onClick={resetCurrentUser}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? '⏳ Reseteando...' : '🔄 Resetear Usuario (Volver al Onboarding)'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Debug de Usuarios
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Herramienta para crear usuarios de prueba y resetear usuarios existentes
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Crear Usuario de Prueba */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              👤 Crear Usuario de Prueba
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  value={testUserEmail}
                  onChange={(e) => setTestUserEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="test@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Nombre
                </label>
                <input
                  type="text"
                  value={testUserName}
                  onChange={(e) => setTestUserName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Usuario de Prueba"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={testUserPassword}
                  onChange={(e) => setTestUserPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
              <button
                onClick={createTestUser}
                disabled={loading || !testUserEmail || !testUserName || !testUserPassword}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? '⏳ Creando...' : '🔧 Crear Usuario'}
              </button>
            </div>
          </div>

          {/* Usuario Actual */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              📊 Usuario Actual
            </h2>
            <UserDetails />
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mt-8 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Modo Debug - Solo Desarrollo
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Esta página es solo para desarrollo y testing. NO desplegar en producción.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
