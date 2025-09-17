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
    <div className={`flex items-start space-x-4 ${message.isUser ? 'justify-end' : 'justify-start'} message-slide`}>
      {!message.isUser && (
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover-scale smooth-transition">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}

      <div className={`flex-1 ${message.isUser ? 'max-w-2xl flex justify-end' : 'max-w-2xl'}`}>
        {message.isUser ? (
          <div>
            <div className="bg-blue-600 text-white rounded-3xl rounded-tr-md p-5 hover-lift smooth-transition shadow-lg">
              {/* File Attachment */}
              {message.fileAttachment && (
                <div className="flex items-center space-x-3 p-3 mb-3 rounded-xl bg-blue-500 bg-opacity-30 backdrop-blur-sm hover:bg-opacity-40 smooth-transition">
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
                      className="p-2 rounded-lg hover:bg-black hover:bg-opacity-10 hover-scale smooth-transition"
                      aria-label="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Message Text */}
              <div className="space-y-3 leading-relaxed text-white">
                {renderMarkdown(message.content)}
              </div>

              {/* Timestamp */}
              <div className="text-xs mt-3 text-right text-blue-100 opacity-75">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <div className="glass-subtle rounded-3xl rounded-tl-md p-5 hover-lift smooth-transition">
              {/* File Attachment */}
              {message.fileAttachment && (
                <div className="flex items-center space-x-3 p-3 mb-3 rounded-xl glass hover:glass-strong smooth-transition">
                  <File className="w-4 h-4 flex-shrink-0 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">
                      {message.fileAttachment.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {formatFileSize(message.fileAttachment.size)}
                    </p>
                  </div>
                  {message.fileAttachment.url && (
                    <button
                      onClick={() => window.open(message.fileAttachment?.url, '_blank')}
                      className="p-2 rounded-lg glass hover:glass-strong hover-scale smooth-transition"
                      aria-label="Download file"
                    >
                      <Download className="w-4 h-4 text-blue-600" />
                    </button>
                  )}
                </div>
              )}

              {/* Message Text */}
              <div className="space-y-3 leading-relaxed text-gray-800 dark:text-gray-200">
                {renderMarkdown(message.content)}
              </div>

              {/* Timestamp */}
              <div className="text-xs mt-3 text-left text-gray-500 dark:text-gray-400 opacity-75">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        )}
      </div>

      {message.isUser && (
        <div className="w-10 h-10 glass-blue rounded-full flex items-center justify-center hover-scale smooth-transition">
          <User className="w-5 h-5 text-blue-600" />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;