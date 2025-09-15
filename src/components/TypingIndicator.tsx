import React from 'react';
import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  isDarkMode: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isDarkMode }) => {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex max-w-xs lg:max-w-md">
        {/* Avatar */}
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            <Bot className="w-4 h-4" />
          </div>
        </div>

        {/* Typing Animation */}
        <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;