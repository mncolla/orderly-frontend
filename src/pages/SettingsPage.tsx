import { useState } from 'react';
import { Settings as SettingsIcon, Target, Languages, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';
import type { OrganizationObjective } from '../types/organization';
import { objectiveTypeLabels, ObjectiveType, ObjectiveUnit } from '../types/organization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function SettingsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [objectives, setObjectives] = useState<OrganizationObjective[]>([]);

  // Language settings
  const { currentLanguage, changeLanguage } = useLanguage();

  const addObjective = () => {
    setObjectives([
      ...objectives,
      {
        type: 'INCREASE_SALES_VOLUME' as ObjectiveType,
        target: 10,
        unit: 'PERCENTAGE' as ObjectiveUnit,
      },
    ]);
    toast.success(t('settings.toastObjectiveAdded'));
  };

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const updateObjective = (index: number, field: keyof OrganizationObjective, value: any) => {
    const newObjectives = [...objectives];
    newObjectives[index] = { ...newObjectives[index], [field]: value };
    setObjectives(newObjectives);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">{t('settings.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
            <SettingsIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              {t('settings.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('settings.description')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Language Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Languages className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('settings.language')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('settings.languageDesc')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  changeLanguage('en');
                  toast.success(t('settings.toastLanguageEn'));
                }}
                className={`
                  flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
                  ${currentLanguage === 'en'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }
                `}
              >
                <span className="text-2xl">🇺🇸</span>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">English</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Inglés</p>
                </div>
                {currentLanguage === 'en' && (
                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 ml-auto" />
                )}
              </button>

              <button
                onClick={() => {
                  changeLanguage('es');
                  toast.success(t('settings.toastLanguageEs'));
                }}
                className={`
                  flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
                  ${currentLanguage === 'es'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }
                `}
              >
                <span className="text-2xl">🇪🇷</span>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">Español</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Spanish</p>
                </div>
                {currentLanguage === 'es' && (
                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 ml-auto" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Objectives Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('settings.objectives')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('settings.objectivesDesc')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {objectives.map((objective, index) => (
                <div key={index} className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl relative bg-gray-50 dark:bg-gray-800">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t('settings.objective')}</Label>
                      <select
                        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                        value={objective.type}
                        onChange={(e) => updateObjective(index, 'type', e.target.value)}
                      >
                        {Object.entries(objectiveTypeLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t('settings.value')}</Label>
                      <Input
                        type="number"
                        value={objective.target}
                        onChange={(e) => updateObjective(index, 'target', Number(e.target.value))}
                        min="0"
                        className="border-gray-300 dark:border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t('settings.unit')}</Label>
                      <select
                        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                        value={objective.unit}
                        onChange={(e) => updateObjective(index, 'unit', e.target.value)}
                      >
                        <option value="PERCENTAGE">%</option>
                        <option value="CURRENCY">$</option>
                        <option value="MINUTES">min</option>
                      </select>
                    </div>
                  </div>

                  {objectives.length > 0 && (
                    <button
                      onClick={() => removeObjective(index)}
                      className="absolute top-3 right-3 text-red-600 hover:text-red-700 dark:text-red-400 text-sm font-medium"
                    >
                      {t('settings.remove')}
                    </button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addObjective}
                className="w-full border-2 border-dashed"
              >
                {t('settings.addObjective')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
