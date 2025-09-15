import React, { useEffect } from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import Layout from './components/Layout';

function AppContent() {
  const {
    conversations,
    currentConversationId,
    isHistoryPanelOpen,
    isDarkMode,
    searchQuery,
    apiConfig,
    createNewChat,
    selectConversation,
    deleteConversation,
    renameConversation,
    toggleHistoryPanel,
    setSearchQuery,
    toggleDarkMode,
    updateApiConfig,
  } = useChat();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <Layout
      conversations={conversations}
      currentConversationId={currentConversationId}
      isHistoryPanelOpen={isHistoryPanelOpen}
      onToggleHistoryPanel={toggleHistoryPanel}
      onSelectConversation={selectConversation}
      onCreateNewChat={createNewChat}
      onDeleteConversation={deleteConversation}
      onRenameConversation={renameConversation}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      isDarkMode={isDarkMode}
      onToggleDarkMode={toggleDarkMode}
      apiConfig={apiConfig}
      onApiConfigChange={updateApiConfig}
    />
  );
}

function App() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}

export default App;
