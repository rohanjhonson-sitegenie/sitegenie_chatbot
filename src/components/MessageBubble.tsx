import React from 'react';
import { User, Bot, File, Download } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isDarkMode: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isDarkMode }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-xs lg:max-w-md ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${message.isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center
            ${message.isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }
          `}>
            {message.isUser ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className={`
          px-4 py-2 rounded-2xl shadow-sm
          ${message.isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-bl-md'
          }
        `}>
          {/* File Attachment */}
          {message.fileAttachment && (
            <div className={`
              flex items-center space-x-2 p-2 mb-2 rounded-lg
              ${message.isUser
                ? 'bg-blue-500 bg-opacity-50'
                : 'bg-gray-100 dark:bg-gray-600'
              }
            `}>
              <File className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {message.fileAttachment.name}
                </p>
                <p className="text-xs opacity-75">
                  {formatFileSize(message.fileAttachment.size)}
                </p>
              </div>
              {message.fileAttachment.url && (
                <button
                  onClick={() => window.open(message.fileAttachment?.url, '_blank')}
                  className="p-1 rounded hover:bg-black hover:bg-opacity-10"
                  aria-label="Download file"
                >
                  <Download className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Message Text */}
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>

          {/* Timestamp */}
          <div className={`
            text-xs mt-1 opacity-75
            ${message.isUser ? 'text-right' : 'text-left'}
          `}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;