import React from 'react';
import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  isDarkMode: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isDarkMode }) => {
  return (
    <div className="flex items-start space-x-4 message-slide">
      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover-scale smooth-transition">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 max-w-2xl">
        <div className="glass-subtle rounded-3xl rounded-tl-md p-5">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full typing-bubble"></div>
              <div className="w-3 h-3 bg-blue-400 rounded-full typing-bubble"></div>
              <div className="w-3 h-3 bg-blue-400 rounded-full typing-bubble"></div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">SiteGenie is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;