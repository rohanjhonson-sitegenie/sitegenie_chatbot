import React, { useState } from 'react';
import { Plus, Search, MessageSquare, Trash2, Edit2, Moon, Sun } from 'lucide-react';
import { Conversation } from '../types';
import { SiteGenieConfig } from '../services/siteGenieApi';
import ApiConfiguration from './ApiConfiguration';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string, threadId?: string) => void;
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

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentConversationId,
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.messages.some(msg =>
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const formatTime = (date: Date | string | undefined | null) => {
    // Handle null, undefined, or empty values
    if (!date) {
      return 'No date';
    }

    let dateObj: Date;

    try {
      // More robust date parsing
      if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        console.warn('Unexpected date type:', typeof date, date);
        return 'Invalid date format';
      }

      // Check if the date is valid
      if (!dateObj || isNaN(dateObj.getTime()) || !dateObj.getTime) {
        console.warn('Invalid date object:', dateObj);
        return 'Invalid date';
      }
    } catch (error) {
      console.error('Error parsing date:', error);
      return 'Invalid date';
    }

    try {
      const now = new Date();
      const diffTime = now.getTime() - dateObj.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return dateObj.toLocaleDateString([], { weekday: 'short' });
      } else {
        return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      console.error('Error formatting date:', error, 'Date object:', dateObj);
      return 'Date error';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-blue-100 dark:border-gray-700">
        <button
          onClick={onCreateNewChat}
          className="w-full flex items-center justify-center space-x-3 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl smooth-transition hover-lift shadow-lg sparkle"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Chat</span>
        </button>

        {/* Theme Toggle and API Configuration */}
        <div className="mt-4 flex justify-center space-x-3">
          <button
            onClick={onToggleDarkMode}
            className="p-3 glass hover-glass rounded-xl text-blue-600 dark:text-gray-300 smooth-transition hover-scale"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          <ApiConfiguration
            config={apiConfig}
            onConfigChange={onApiConfigChange}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 glass focus:glass-strong rounded-xl text-gray-700 dark:text-gray-100 placeholder-blue-400 smooth-transition"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <>
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`
                  group cursor-pointer smooth-transition hover-lift
                  ${currentConversationId === conv.id
                    ? 'glass-blue-strong border-l-4 border-blue-500 hover-glow rounded-2xl p-4'
                    : 'glass hover:glass-strong rounded-2xl p-4'
                  }
                `}
                onClick={() => onSelectConversation(conv.id, conv.threadId)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingId === conv.id ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="flex-1 px-2 py-1 text-sm glass rounded-lg text-gray-900 dark:text-gray-100"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2 mb-2">
                          <MessageSquare className={`w-4 h-4 flex-shrink-0 ${
                            currentConversationId === conv.id ? 'text-blue-600' : 'text-blue-500'
                          }`} />
                          <h3 className="font-medium text-gray-800 dark:text-gray-100 truncate">
                            {conv.title}
                          </h3>
                        </div>
                        {conv.messages.length > 0 && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                            {conv.messages[conv.messages.length - 1].content}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(conv.updatedAt)}
                          </span>
                          {currentConversationId === conv.id && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {editingId !== conv.id && (
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 smooth-transition ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(conv);
                        }}
                        className="p-1.5 glass hover-glass rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 smooth-transition"
                        aria-label="Rename conversation"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        className="p-1.5 glass hover-glass rounded-lg text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 smooth-transition"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;