import { Building2, Mail, MapPin, Store, ShoppingCart, TrendingUp } from 'lucide-react';
import { useLocation } from 'wouter';

interface OrganizationCardProps {
  organization: {
    id: string;
    name: string;
    country: string;
    owner: {
      id: string;
      name: string;
      email: string;
    };
    _count?: {
      stores: number;
      orders?: number;
    };
    settings?: {
      objectives?: any[];
    };
  };
}

export function OrganizationCard({ organization }: OrganizationCardProps) {
  const [, navigate] = useLocation();

  const objectivesCount = organization.settings?.objectives?.length || 0;

  return (
    <div
      onClick={() => navigate(`/agency/organizations/${organization.id}`)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {organization.name}
            </h3>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              {organization.country}
            </div>
          </div>
        </div>
      </div>

      {/* Owner Info */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Mail className="h-4 w-4 mr-2" />
          <span className="font-medium">{organization.owner.name}</span>
          <span className="mx-2">•</span>
          <span className="text-xs">{organization.owner.email}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {/* Stores */}
        <div className="text-center">
          <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 mb-1">
            <Store className="h-4 w-4 mr-1" />
            <span className="text-xs">Locales</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {organization._count?.stores || 0}
          </p>
        </div>

        {/* Orders */}
        <div className="text-center">
          <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 mb-1">
            <ShoppingCart className="h-4 w-4 mr-1" />
            <span className="text-xs">Órdenes</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {organization._count?.orders || 0}
          </p>
        </div>

        {/* Objectives */}
        <div className="text-center">
          <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 mb-1">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="text-xs">Objetivos</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {objectivesCount}
          </p>
        </div>
      </div>

      {/* View Detail Link */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center justify-center hover:text-blue-700 dark:hover:text-blue-300">
          Ver detalles
          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
