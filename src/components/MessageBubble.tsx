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

  // Enhanced markdown renderer with support for headings, lists, and formatting
  const renderMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentListItems: React.ReactNode[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const processInlineMarkdown = (inputText: string): React.ReactNode[] => {
      const result: React.ReactNode[] = [];

      // Split by bold markers (**text**)
      const boldParts = inputText.split(/(\*\*[^*]+\*\*)/g);

      boldParts.forEach((boldPart, boldIndex) => {
        if (boldPart.startsWith('**') && boldPart.endsWith('**') && boldPart.length > 4) {
          // This is bold text
          const boldText = boldPart.slice(2, -2);
          result.push(
            <strong key={`bold-${boldIndex}`} className="font-semibold text-gray-900 dark:text-gray-100">
              {boldText}
            </strong>
          );
        } else if (boldPart) {
          // Process italic text (*text*) within this part
          const italicParts = boldPart.split(/(\*[^*]+\*)/g);

          italicParts.forEach((italicPart, italicIndex) => {
            if (italicPart.startsWith('*') && italicPart.endsWith('*') && italicPart.length > 2 && !italicPart.includes('**')) {
              // This is italic text
              const italicText = italicPart.slice(1, -1);
              result.push(
                <em key={`italic-${boldIndex}-${italicIndex}`} className="italic">
                  {italicText}
                </em>
              );
            } else if (italicPart) {
              // Regular text
              result.push(italicPart);
            }
          });
        }
      });

      return result;
    };

    const flushList = () => {
      if (currentListItems.length > 0) {
        if (listType === 'ul') {
          elements.push(
            <ul key={`list-${elements.length}`} className="list-disc list-inside ml-4 mb-3 space-y-1">
              {currentListItems}
            </ul>
          );
        } else if (listType === 'ol') {
          elements.push(
            <ol key={`list-${elements.length}`} className="list-decimal list-inside ml-4 mb-3 space-y-1">
              {currentListItems}
            </ol>
          );
        }
        currentListItems = [];
        listType = null;
      }
    };

    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();

      // Skip empty lines but add spacing
      if (!trimmedLine) {
        flushList();
        if (elements.length > 0) {
          elements.push(<br key={`br-${lineIndex}`} />);
        }
        return;
      }

      // Handle headings
      if (trimmedLine.startsWith('### ')) {
        flushList();
        const headingText = trimmedLine.slice(4);
        elements.push(
          <h3 key={`h3-${lineIndex}`} className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-4 mb-2">
            {processInlineMarkdown(headingText)}
          </h3>
        );
      } else if (trimmedLine.startsWith('## ')) {
        flushList();
        const headingText = trimmedLine.slice(3);
        elements.push(
          <h2 key={`h2-${lineIndex}`} className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-4 mb-3">
            {processInlineMarkdown(headingText)}
          </h2>
        );
      } else if (trimmedLine.startsWith('# ')) {
        flushList();
        const headingText = trimmedLine.slice(2);
        elements.push(
          <h1 key={`h1-${lineIndex}`} className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4 mb-3">
            {processInlineMarkdown(headingText)}
          </h1>
        );
      }
      // Handle unordered lists (- or *)
      else if (trimmedLine.match(/^[-*]\s+/)) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        const listItemText = trimmedLine.replace(/^[-*]\s+/, '');
        currentListItems.push(
          <li key={`li-${lineIndex}`} className="text-gray-700 dark:text-gray-300">
            {processInlineMarkdown(listItemText)}
          </li>
        );
      }
      // Handle ordered lists (1. 2. etc.)
      else if (trimmedLine.match(/^\d+\.\s+/)) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        const listItemText = trimmedLine.replace(/^\d+\.\s+/, '');
        currentListItems.push(
          <li key={`li-${lineIndex}`} className="text-gray-700 dark:text-gray-300">
            {processInlineMarkdown(listItemText)}
          </li>
        );
      }
      // Handle regular paragraphs
      else {
        flushList();
        elements.push(
          <p key={`p-${lineIndex}`} className="text-gray-800 dark:text-gray-200 mb-2 leading-relaxed">
            {processInlineMarkdown(trimmedLine)}
          </p>
        );
      }
    });

    // Flush any remaining list
    flushList();

    return elements;
  };

  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex ${message.isUser ? 'max-w-xs lg:max-w-md' : 'max-w-lg lg:max-w-3xl'} ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
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
          px-5 py-4 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl
          ${message.isUser
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md transform hover:scale-[1.01]'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-bl-md hover:border-gray-300 dark:hover:border-gray-500'
          }
        `}>
          {/* File Attachment */}
          {message.fileAttachment && (
            <div className={`
              flex items-center space-x-3 p-3 mb-3 rounded-xl transition-all duration-200
              ${message.isUser
                ? 'bg-blue-500 bg-opacity-30 backdrop-blur-sm hover:bg-opacity-40'
                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-650 border border-gray-200 dark:border-gray-600'
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
                  className="p-2 rounded-lg transition-all duration-200 hover:bg-black hover:bg-opacity-10 dark:hover:bg-white dark:hover:bg-opacity-10 hover:scale-110"
                  aria-label="Download file"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Message Text */}
          <div className={`
            space-y-3 leading-relaxed
            ${message.isUser
              ? 'text-white'
              : 'text-gray-800 dark:text-gray-100'
            }
          `}>
            {renderMarkdown(message.content)}
          </div>

          {/* Timestamp */}
          <div className={`
            text-xs mt-3 opacity-75 transition-opacity duration-200 hover:opacity-100
            ${message.isUser ? 'text-right text-blue-100' : 'text-left text-gray-500 dark:text-gray-400'}
          `}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;