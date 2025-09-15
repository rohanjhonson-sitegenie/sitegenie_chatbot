import React from 'react';
import { Menu, X, MessageSquare } from 'lucide-react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { Conversation } from '../types';
import { SiteGenieConfig } from '../services/siteGenieApi';

interface LayoutProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  isHistoryPanelOpen: boolean;
  onToggleHistoryPanel: () => void;
  onSelectConversation: (id: string) => void;
  onCreateNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  apiConfig: SiteGenieConfig;
  onApiConfigChange: (config: SiteGenieConfig) => void;
}

const Layout: React.FC<LayoutProps> = ({
  conversations,
  currentConversationId,
  isHistoryPanelOpen,
  onToggleHistoryPanel,
  onSelectConversation,
  onCreateNewChat,
  onDeleteConversation,
  onRenameConversation,
  searchQuery,
  onSearchChange,
  isDarkMode,
  onToggleDarkMode,
  apiConfig,
  onApiConfigChange,
}) => {
  const currentConversation = conversations.find(conv => conv.id === currentConversationId);

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex w-full bg-gray-50 dark:bg-gray-900">
        {/* Mobile Overlay */}
        {isHistoryPanelOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onToggleHistoryPanel}
          />
        )}

        {/* Sidebar */}
        <div className={`
          ${isHistoryPanelOpen ? 'w-80' : 'w-0'}
          ${isHistoryPanelOpen ? 'fixed lg:relative' : 'relative'}
          ${isHistoryPanelOpen ? 'left-0 lg:left-auto' : ''}
          top-0 h-full z-50 lg:z-auto
          transition-all duration-300 ease-in-out overflow-hidden
          bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        `}>
          <Sidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={onSelectConversation}
            onCreateNewChat={onCreateNewChat}
            onDeleteConversation={onDeleteConversation}
            onRenameConversation={onRenameConversation}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
            apiConfig={apiConfig}
            onApiConfigChange={onApiConfigChange}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <button
                onClick={onToggleHistoryPanel}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={isHistoryPanelOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                {isHistoryPanelOpen ? (
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  SiteGenie Chat
                </h1>
              </div>
            </div>
          </header>

          {/* Chat Window */}
          <div className="flex-1 overflow-hidden">
            <ChatWindow
              conversation={currentConversation}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;