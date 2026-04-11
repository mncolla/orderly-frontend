import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { usersService } from '@/services/usersService';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, Mail, Calendar, TrendingUp, ChevronRight, XCircle, Clock, Zap } from 'lucide-react';

const accountTypeConfig = {
  FREE: { label: 'Free', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', icon: Clock },
  PRO: { label: 'Pro', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Zap },
  ENTERPRISE: { label: 'Enterprise', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: TrendingUp },
};

const roleConfig = {
  OWNER: { label: 'Owner', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  AGENCY: { label: 'Agency', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  ADMIN: { label: 'Admin', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
};

export function UsersPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.list,
  });

  const filteredUsers = data?.users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error al cargar usuarios
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Por favor, intenta nuevamente más tarde
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Usuarios
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gestiona los usuarios y sus planes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {data?.count || 0} usuarios
            </Badge>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.map((user) => {
              const accountTypeConf = accountTypeConfig[user.accountType];
              const roleConf = roleConfig[user.role];
              const AccountIcon = accountTypeConf.icon;

              return (
                <button
                  key={user.id}
                  onClick={() => navigate(`/users/${user.id}`)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <span className="text-white font-semibold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {user.name}
                        </h3>
                        <Badge className={roleConf.color}>
                          {roleConf.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {user._count.integrations} integración{user._count.integrations !== 1 ? 'es' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(user.createdAt).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account Type Badge */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge className={accountTypeConf.color}>
                      <div className="flex items-center gap-1.5">
                        <AccountIcon className="h-3 w-3" />
                        {accountTypeConf.label}
                      </div>
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
