import { useState } from 'react';

interface VendorInfo {
  id: string;
  name: string;
  chainName: string;
  vendorId: string;
  globalEntityId: string;
}

interface DebugResponse {
  success: boolean;
  data?: any;
  error?: string;
  needsOTP?: boolean;
}

// Helper to get previous month dates (to avoid future dates)
function getPreviousMonthDates(): { from: string; to: string } {
  const now = new Date();
  // Go to previous month
  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    from: firstDay.toISOString().split('T')[0],
    to: lastDay.toISOString().split('T')[0],
  };
}

const { from: defaultFromDate, to: defaultToDate } = getPreviousMonthDates();

export default function DebugPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [userId, setUserId] = useState('');
  const [vendors, setVendors] = useState<VendorInfo[]>([]);

  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);

  const [responses, setResponses] = useState<Record<string, DebugResponse>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const updateResponse = (key: string, response: DebugResponse) => {
    setResponses(prev => ({ ...prev, [key]: response }));
  };

  const updateLoading = (key: string, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  // 1. Login
  const testLogin = async () => {
    updateLoading('login', true);
    try {
      const res = await fetch(`${API_URL}/debug/pedidosya/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, otpCode }),
      });
      const data = await res.json();
      updateResponse('login', data);

      if (data.success && data.data) {
        if (data.data.needsOTP) {
          alert('OTP requerido. Ingrese el código.');
        } else if (data.data.accessToken) {
          setAccessToken(data.data.accessToken);
          setUserId(data.data.userId);
          if (data.data.vendors) {
            setVendors(data.data.vendors);
          }
        }
      }
    } catch (error: any) {
      updateResponse('login', { success: false, error: error.message });
    }
    updateLoading('login', false);
  };

  // 2. Obtener Stores (ya vienen del login, pero mostramos la info)
  const testGetVendors = () => {
    updateResponse('vendors', {
      success: true,
      data: {
        note: 'Vendors are returned in login response. See login data.',
        vendors,
        count: vendors.length,
      },
    });
  };

  // 3. Obtener Órdenes
  const testGetOrders = async () => {
    updateLoading('orders', true);
    try {
      const globalVendorCodes = vendors.map(v => ({
        globalEntityId: v.globalEntityId,
        vendorId: v.vendorId,
      }));

      const res = await fetch(`${API_URL}/debug/pedidosya/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          userId,
          globalVendorCodes,
          fromDate,
          toDate,
        }),
      });
      const data = await res.json();
      updateResponse('orders', data);
    } catch (error: any) {
      updateResponse('orders', { success: false, error: error.message });
    }
    updateLoading('orders', false);
  };

  // 3b. Obtener Órdenes Históricas (sin rango - trae todo)
  const testGetHistoricalOrders = async () => {
    updateLoading('historicalOrders', true);
    try {
      const globalVendorCodes = vendors.map(v => ({
        globalEntityId: v.globalEntityId,
        vendorId: v.vendorId,
      }));

      const res = await fetch(`${API_URL}/debug/pedidosya/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          userId,
          globalVendorCodes,
          // NO enviar fromDate ni toDate para obtener datos históricos completos
        }),
      });
      const data = await res.json();
      updateResponse('historicalOrders', data);
    } catch (error: any) {
      updateResponse('historicalOrders', { success: false, error: error.message });
    }
    updateLoading('historicalOrders', false);
  };

  // 4. Obtener Menú (Items y Categorías)
  const testGetMenu = async () => {
    updateLoading('menu', true);
    try {
      const vendorsData = vendors.map(v => ({
        globalEntityId: v.globalEntityId,
        vendorId: v.vendorId,
      }));

      const res = await fetch(`${API_URL}/debug/pedidosya/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          userId,
          vendors: vendorsData,
        }),
      });
      const data = await res.json();
      updateResponse('menu', data);
    } catch (error: any) {
      updateResponse('menu', { success: false, error: error.message });
    }
    updateLoading('menu', false);
  };

  // 5. Full Flow (todo junto)
  const testFullFlow = async () => {
    updateLoading('fullFlow', true);
    try {
      const res = await fetch(`${API_URL}/debug/pedidosya/full-flow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, otpCode, fromDate, toDate }),
      });
      const data = await res.json();
      updateResponse('fullFlow', data);

      if (data.success && data.data?.login) {
        setAccessToken('*** (from full flow) ***');
        setUserId(data.data.login.userId);
        if (vendors.length === 0 && data.data.login.vendors) {
          setVendors(data.data.login.vendors);
        }
      }
    } catch (error: any) {
      updateResponse('fullFlow', { success: false, error: error.message });
    }
    updateLoading('fullFlow', false);
  };

  const JsonViewer = ({ data, label }: { data: any; label: string }) => (
    <div className="mt-4 border rounded-lg overflow-hidden">
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-medium text-sm">
        {label}
      </div>
      <pre className="p-4 text-xs overflow-auto max-h-96 bg-gray-50 dark:bg-gray-900">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            PedidosYa Debug Console
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Herramienta de debug para integración con PedidosYa - Sin autenticación
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de Configuración */}
          <div className="space-y-6">
            {/* Credenciales */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                🔐 Credenciales PedidosYa
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="usuario@pedidosya.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Código OTP (si es requerido)
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="123456"
                  />
                </div>
              </div>
            </div>

            {/* Tokens y Vendors */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                🔑 Tokens y Locales
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Access Token
                  </label>
                  <textarea
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs font-mono"
                    rows={3}
                    placeholder="Se llena automáticamente después del login..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                    placeholder="Se llena automáticamente después del login..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Locales Disponibles: {vendors.length}
                  </label>
                  {vendors.length > 0 ? (
                    <div className="max-h-40 overflow-auto border rounded-lg p-3 bg-gray-50 dark:bg-gray-700 text-xs">
                      {vendors.map((v, i) => (
                        <div key={i} className="mb-2 pb-2 border-b last:border-0">
                          <div className="font-medium">{v.name}</div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {v.chainName} | {v.vendorId}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No hay locales. Haz login primero.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Fechas para Órdenes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                📅 Rango de Fechas (para órdenes)
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Panel de Acciones y Respuestas */}
          <div className="space-y-6">
            {/* Botones de Acción */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                🚀 Acciones de Debug
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={testLogin}
                  disabled={loading.login || !email || !password}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading.login ? '⏳ Cargando...' : '1️⃣ Login a PedidosYa'}
                </button>

                <button
                  onClick={testGetVendors}
                  disabled={vendors.length === 0}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  2️⃣ Ver Locales (Stores)
                </button>

                <button
                  onClick={testGetOrders}
                  disabled={loading.orders || !accessToken || !userId || vendors.length === 0}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading.orders ? '⏳ Cargando...' : `3️⃣ Obtener Órdenes (${fromDate} a ${toDate})`}
                </button>

                <button
                  onClick={testGetHistoricalOrders}
                  disabled={loading.historicalOrders || !accessToken || !userId || vendors.length === 0}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading.historicalOrders ? '⏳ Cargando...' : '📜 Obtener Órdenes Históricas (SIN rango)'}
                </button>

                <button
                  onClick={testGetMenu}
                  disabled={loading.menu || !accessToken || !userId || vendors.length === 0}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading.menu ? '⏳ Cargando...' : '4️⃣ Obtener Menú (Items y Categorías)'}
                </button>

                <button
                  onClick={testFullFlow}
                  disabled={loading.fullFlow || !email || !password}
                  className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading.fullFlow ? '⏳ Ejecutando...' : '🔄 Full Flow (Todo junto)'}
                </button>

                <button
                  onClick={() => {
                    setResponses({});
                    setAccessToken('');
                    setUserId('');
                    setVendors([]);
                  }}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  🗑️ Limpiar Todo
                </button>
              </div>
            </div>

            {/* Respuestas */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                📊 Respuestas
              </h2>

              {responses.login && (
                <JsonViewer data={responses.login} label="1️⃣ Login Response" />
              )}

              {responses.vendors && (
                <JsonViewer data={responses.vendors} label="2️⃣ Vendors (Stores)" />
              )}

              {responses.orders && (
                <JsonViewer data={responses.orders} label="3️⃣ Orders" />
              )}

              {responses.historicalOrders && (
                <JsonViewer data={responses.historicalOrders} label="📜 Historical Orders (Todos los datos)" />
              )}

              {responses.menu && (
                <JsonViewer data={responses.menu} label="4️⃣ Menu (Catalogs + Products)" />
              )}

              {responses.fullFlow && (
                <JsonViewer data={responses.fullFlow} label="🔄 Full Flow" />
              )}

              {Object.keys(responses).length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center text-gray-500 dark:text-gray-400">
                  <p className="text-lg">Haz clic en uno de los botones arriba para comenzar</p>
                </div>
              )}
            </div>
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
                Esta página NO usa autenticación y está pensada solo para desarrollo y testing.
                NO desplegar en producción.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
