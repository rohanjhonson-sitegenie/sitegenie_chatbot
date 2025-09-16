import React, { useRef, useEffect } from 'react';
import { User, Bot, File, ChevronUp, Loader2 } from 'lucide-react';
import { Conversation } from '../types';
import { useChat } from '../context/ChatContext';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';

interface ChatWindowProps {
  conversation: Conversation | undefined;
  isDarkMode: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  isDarkMode,
}) => {
  const { sendMessage, isTyping, loadMoreMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, isTyping]);

  if (!conversation) {
    return (
      <div className="flex flex-col h-full">
        {/* Welcome Message */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Welcome to SiteGenie Chat
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start a conversation by typing a message, uploading a file, or using voice input.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <User className="w-6 h-6 mb-2" />
                <span>Text Input</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <File className="w-6 h-6 mb-2" />
                <span>File Upload</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Bot className="w-6 h-6 mb-2" />
                <span>Voice Input</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <ChatInput
            onSendMessage={sendMessage}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Load More Messages Button */}
        {conversation.threadId && conversation.hasMoreMessages && (
          <div className="flex justify-center mb-4">
            <button
              onClick={() => loadMoreMessages(conversation.id)}
              disabled={conversation.isLoadingMessages}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {conversation.isLoadingMessages ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
              <span>
                {conversation.isLoadingMessages ? 'Loading...' : 'Load More Messages'}
              </span>
            </button>
          </div>
        )}

        {/* Loading indicator for initial message load */}
        {conversation.isLoadingMessages && conversation.messages.length === 0 && (
          <div className="flex justify-center items-center py-8">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading messages...</span>
            </div>
          </div>
        )}

        {conversation.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isDarkMode={isDarkMode}
          />
        ))}
        {isTyping && <TypingIndicator isDarkMode={isDarkMode} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <ChatInput
          onSendMessage={sendMessage}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
};

export default ChatWindow;