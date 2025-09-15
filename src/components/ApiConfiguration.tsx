import React, { useState, useEffect } from 'react';
import { Settings, Save, X } from 'lucide-react';
import { SiteGenieConfig } from '../services/siteGenieApi';

interface ApiConfigurationProps {
  config: SiteGenieConfig;
  onConfigChange: (config: SiteGenieConfig) => void;
  isDarkMode: boolean;
}

const ApiConfiguration: React.FC<ApiConfigurationProps> = ({
  config,
  onConfigChange,
  isDarkMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<SiteGenieConfig>(config);

  useEffect(() => {
    setTempConfig(config);
  }, [config]);

  const handleSave = () => {
    onConfigChange(tempConfig);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempConfig(config);
    setIsOpen(false);
  };

  const handleInputChange = (key: keyof SiteGenieConfig, value: string | number) => {
    setTempConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const isConfigurationValid = () => {
    return config.assistantId !== 'your-assistant-id' &&
           config.companyId !== 'your-company-id' &&
           config.assistantId &&
           config.companyId;
  };

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`p-2 rounded-lg transition-colors relative ${
          isConfigurationValid()
            ? 'hover:bg-gray-100 dark:hover:bg-gray-700'
            : 'hover:bg-red-100 dark:hover:bg-red-900/20'
        }`}
        aria-label="API Configuration"
        title={isConfigurationValid() ? "Configure API Settings" : "⚠️ API Configuration Required"}
      >
        <Settings className={`w-5 h-5 ${
          isConfigurationValid()
            ? 'text-gray-600 dark:text-gray-300'
            : 'text-red-500 dark:text-red-400'
        }`} />
        {!isConfigurationValid() && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        )}
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                API Configuration
              </h2>
              <button
                onClick={handleReset}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {/* API URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API URL
                </label>
                <input
                  type="url"
                  value={tempConfig.apiUrl}
                  onChange={(e) => handleInputChange('apiUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://api.sitegenie.ai"
                />
              </div>

              {/* Assistant ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assistant ID
                </label>
                <input
                  type="text"
                  value={tempConfig.assistantId}
                  onChange={(e) => handleInputChange('assistantId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your-assistant-id"
                />
              </div>

              {/* Company ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company ID
                </label>
                <input
                  type="text"
                  value={tempConfig.companyId}
                  onChange={(e) => handleInputChange('companyId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your-company-id"
                />
              </div>

              {/* User ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User ID
                </label>
                <input
                  type="number"
                  value={tempConfig.userId}
                  onChange={(e) => handleInputChange('userId', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>

              {/* User Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User Name
                </label>
                <input
                  type="text"
                  value={tempConfig.userName}
                  onChange={(e) => handleInputChange('userName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="User Name"
                />
              </div>

              {/* Validation Warning */}
              {(tempConfig.assistantId === 'your-assistant-id' ||
                tempConfig.companyId === 'your-company-id' ||
                !tempConfig.assistantId ||
                !tempConfig.companyId) && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>⚠️ Configuration Required:</strong> Please update your Assistant ID and Company ID.
                    The default placeholder values will cause API errors.
                  </p>
                </div>
              )}

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> These settings are required for the SiteGenie API to work properly.
                  Make sure to get the correct Assistant ID and Company ID from your SiteGenie dashboard.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100
                         dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700
                         text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApiConfiguration;