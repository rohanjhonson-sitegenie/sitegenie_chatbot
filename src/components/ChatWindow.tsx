import React, { useRef, useEffect } from 'react';
import { User, Bot, File, ChevronUp, Loader2 } from 'lucide-react';
import { Conversation } from '../types';
import { useChat } from '../context/ChatContext';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import aiAvatar from '../assets/images/ai-avatar.png';

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
            <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-6 sparkle hover-scale smooth-transition shadow-lg">
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
              <div className="hidden w-full h-full bg-blue-600 rounded-2xl flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">
              Welcome to SiteGenie
            </h2>
            <p className="text-blue-600 dark:text-blue-400 mb-6 font-medium">
              AI Assistant
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Start a conversation by typing a message, uploading a file, or using voice input.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col items-center p-4 glass hover:glass-strong rounded-2xl hover-lift smooth-transition">
                <User className="w-6 h-6 mb-2 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">Text Input</span>
              </div>
              <div className="flex flex-col items-center p-4 glass hover:glass-strong rounded-2xl hover-lift smooth-transition">
                <File className="w-6 h-6 mb-2 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">File Upload</span>
              </div>
              <div className="flex flex-col items-center p-4 glass hover:glass-strong rounded-2xl hover-lift smooth-transition">
                <Bot className="w-6 h-6 mb-2 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">Voice Input</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Input */}
        <div className="glass-subtle border-t border-blue-100 dark:border-gray-700">
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
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Load More Messages Button */}
        {conversation.threadId && conversation.hasMoreMessages && (
          <div className="flex justify-center mb-4">
            <button
              onClick={() => loadMoreMessages(conversation.id)}
              disabled={conversation.isLoadingMessages}
              className="flex items-center space-x-2 px-4 py-2 text-sm glass hover:glass-strong rounded-xl smooth-transition disabled:opacity-50 disabled:cursor-not-allowed text-blue-600 hover-lift"
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
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
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
      <div className="glass-subtle border-t border-blue-100 dark:border-gray-700">
        <ChatInput
          onSendMessage={sendMessage}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
};

export default ChatWindow;