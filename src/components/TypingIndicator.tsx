import React from 'react';
import { Bot } from 'lucide-react';
import aiAvatar from '../assets/images/ai-avatar.png';

interface TypingIndicatorProps {
  isDarkMode: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isDarkMode }) => {
  return (
    <div className="flex items-start space-x-4 message-slide">
      <div className="w-10 h-10 rounded-full overflow-hidden hover-scale smooth-transition shadow-md">
        <img
          src={aiAvatar}
          alt="AI Assistant"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden w-full h-full bg-blue-600 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
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