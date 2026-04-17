import { useState } from 'react';
import { Bug, Key, Shield, Server, Terminal, CheckCircle, XCircle, AlertTriangle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

interface LoginResult {
  needsOTP?: boolean;
  accessToken?: string;
  userId?: string;
  vendors?: any[];
  error?: string;
}

interface DebugResponse {
  success: boolean;
  result: LoginResult;
  error?: string;
}

interface ApiResponse {
  success: boolean;
  info: any;
}

export default function PedidosYaDebugPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loginResult, setLoginResult] = useState<LoginResult | null>(null);
  const [apiInfo, setApiInfo] = useState<any>(null);

  const addLog = (type: LogEntry['type'], message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLogs((prev) => [...prev, { timestamp, type, message, data }]);
  };

  const loadApiInfo = async () => {
    try {
      addLog('info', 'Loading PedidosYa API information...');
      const response = await fetch('http://localhost:3000/api/debug/pedidosya/info');
      const data: ApiResponse = await response.json();
      setApiInfo(data.info);
      addLog('success', 'API information loaded successfully', data.info);
    } catch (error: any) {
      addLog('error', 'Failed to load API info', error.message);
    }
  };

  const testLogin = async () => {
    if (!email || !password) {
      toast.error('Email and password are required');
      return;
    }

    setIsLoading(true);
    setLoginResult(null);
    setLogs([]);

    try {
      addLog('info', 'Testing PedidosYa login...');
      addLog('info', `Email: ${email}`);
      addLog('info', `Password: ${'*'.repeat(password.length)}`);

      const response = await fetch('http://localhost:3000/api/debug/pedidosya/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          otpCode: otpCode || undefined,
        }),
      });

      const data: DebugResponse = await response.json();

      setLoginResult(data.result);
      addLog('success', 'Login request completed', data.result);

      if (data.result.needsOTP) {
        addLog('warning', 'OTP Code required - PedidosYa has sent a verification code to your email');
        toast('OTP Code required', {
          icon: '📱',
          duration: 5000,
        });
      } else if (data.result.accessToken) {
        addLog('success', `Login successful! User ID: ${data.result.userId}`);
        if (data.result.vendors && data.result.vendors.length > 0) {
          addLog('success', `Found ${data.result.vendors.length} vendor(s)`);
          data.result.vendors.forEach((vendor: any, index: number) => {
            addLog('info', `  Vendor ${index + 1}: ${vendor.name} (${vendor.vendorId})`);
          });
        }
        toast.success('Login successful!');
      }
    } catch (error: any) {
      addLog('error', `Login failed: ${error.message}`, error);
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'info':
        return <Terminal className="h-4 w-4 text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getLogBgColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30">
            <Bug className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              PedidosYa Debug
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Prueba la conexión con PedidosYa API
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                API Information
              </CardTitle>
              <CardDescription>
                PedidosYa API endpoints and configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={loadApiInfo}
                variant="outline"
                className="w-full mb-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Load API Info
              </Button>
              {apiInfo && (
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="font-medium mb-1">Base URL:</p>
                    <code className="text-xs text-blue-600 dark:text-blue-400 break-all">
                      {apiInfo.baseUrl}
                    </code>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="font-medium mb-1">Login Endpoint:</p>
                    <code className="text-xs text-green-600 dark:text-green-400">
                      POST {apiInfo.loginEndpoint}
                    </code>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Test Login
              </CardTitle>
              <CardDescription>
                Enter PedidosYa credentials to test connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">OTP Code (if required)</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  disabled={isLoading}
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter the 6-digit code sent to your email if required
                </p>
              </div>

              <Button
                onClick={testLogin}
                disabled={isLoading || !email || !password}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {loginResult && (
            <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Login Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loginResult.needsOTP && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-900 dark:text-yellow-100">
                            OTP Code Required
                          </p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            PedidosYa has sent a verification code to your email.
                            Enter it above and click Test Connection again.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {loginResult.accessToken && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-900 dark:text-green-100">
                            Login Successful
                          </span>
                        </div>
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-green-700 dark:text-green-300">User ID:</span>
                            <span className="font-mono text-green-900 dark:text-green-100">
                              {loginResult.userId}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-700 dark:text-green-300">Vendors:</span>
                            <span className="font-mono text-green-900 dark:text-green-100">
                              {loginResult.vendors?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 h-fit">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Connection Logs
              </CardTitle>
              <Button
                onClick={clearLogs}
                variant="ghost"
                size="sm"
                disabled={logs.length === 0}
              >
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] overflow-y-auto pr-4">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[500px] text-center">
                  <Terminal className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No logs yet. Test a connection to see logs here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${getLogBgColor(log.type)}`}
                    >
                      <div className="flex items-start gap-2 mb-1">
                        {getLogIcon(log.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                              {log.timestamp}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                            {log.message}
                          </p>
                          {log.data && (
                            <div className="mt-2">
                              <details className="group">
                                <summary className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                                  Show details
                                </summary>
                                <pre className="mt-2 text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                                  {JSON.stringify(log.data, null, 2)}
                                </pre>
                              </details>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
