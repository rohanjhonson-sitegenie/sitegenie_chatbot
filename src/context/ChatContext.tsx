import React, { createContext, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, ChatState } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { SiteGenieConfig, getSiteGenieApiService, initializeSiteGenieApi } from '../services/siteGenieApi';

interface ChatContextType extends ChatState {
  sendMessage: (content: string, file?: File) => void;
  createNewChat: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  toggleHistoryPanel: () => void;
  setSearchQuery: (query: string) => void;
  toggleDarkMode: () => void;
  apiConfig: SiteGenieConfig;
  updateApiConfig: (config: SiteGenieConfig) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storedState, setStoredState] = useLocalStorage<Omit<ChatState, 'isTyping'>>('chatState', {
    conversations: [],
    currentConversationId: null,
    isHistoryPanelOpen: true,
    isDarkMode: false,
    searchQuery: '',
  });

  const [apiConfig, setApiConfig] = useLocalStorage<SiteGenieConfig>('siteGenieApiConfig', {
    apiUrl: 'https://flaskapi.sitegenie.ai',
    assistantId: 'your-assistant-id',
    companyId: 'your-company-id',
    userId: 1,
    userName: 'User',
  });

  const [chatState, setChatState] = React.useState<ChatState>(() => {
    // Deserialize dates from localStorage only once during initialization
    const deserializedState = {
      ...storedState,
      conversations: storedState.conversations.map(conv => ({
        ...conv,
        createdAt: typeof conv.createdAt === 'string' ? new Date(conv.createdAt) : conv.createdAt,
        updatedAt: typeof conv.updatedAt === 'string' ? new Date(conv.updatedAt) : conv.updatedAt,
        messages: conv.messages.map(msg => ({
          ...msg,
          timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp,
        }))
      })),
      isTyping: false,
    };
    return deserializedState;
  });

  React.useEffect(() => {
    const { isTyping, ...persistableState } = chatState;
    setStoredState(persistableState);
  }, [chatState, setStoredState]);

  const processRealAIResponse = useCallback(async (
    userMessage: string,
    conversationId: string,
    aiMessageId: string,
    fileIds: string[] = []
  ) => {
    const apiService = getSiteGenieApiService(apiConfig);
    let aiResponseContent = '';
    let updateCounter = 0;

    try {
      console.log('🚀 Starting API processing for message:', userMessage, 'MessageID:', aiMessageId, 'ConversationID:', conversationId);

      // Process the streaming response
      for await (const chunk of apiService.processQuery(userMessage, fileIds)) {
        console.log('📦 Processing chunk:', {
          hasData: !!chunk.data,
          hasError: !!chunk.error,
          isDone: chunk.done,
          dataPreview: chunk.data ? chunk.data.substring(0, 50) + '...' : 'none'
        });

        if (chunk.error) {
          console.error('❌ Error in chunk:', chunk.error);
          setChatState(currentState => ({
            ...currentState,
            conversations: currentState.conversations.map(conv =>
              conv.id === conversationId
                ? {
                    ...conv,
                    messages: conv.messages.map(msg =>
                      msg.id === aiMessageId
                        ? { ...msg, content: `Error: ${chunk.error}` }
                        : msg
                    ),
                    updatedAt: new Date()
                  }
                : conv
            ),
          }));
          break;
        }

        if (chunk.done) {
          console.log('✅ Stream finished for message:', aiMessageId);
          break;
        }

        if (chunk.data) {
          aiResponseContent += chunk.data;
          updateCounter++;

          console.log(`⚡ Update #${updateCounter} - Total content length: ${aiResponseContent.length}`, 'for MessageID:', aiMessageId);

          // Update every chunk immediately with direct state modification
          setChatState(currentState => {
            console.log('🔄 Updating state for conversation:', conversationId, 'message:', aiMessageId);

            const conversations = currentState.conversations.map(conv => {
              if (conv.id === conversationId) {
                const messages = conv.messages.map(msg => {
                  if (msg.id === aiMessageId) {
                    console.log('✅ Found target message, updating content from', msg.content.length, 'to', aiResponseContent.length);
                    return { ...msg, content: aiResponseContent };
                  }
                  return msg;
                });
                return { ...conv, messages, updatedAt: new Date() };
              }
              return conv;
            });

            return {
              ...currentState,
              conversations
            };
          });
        }
      }

      console.log('🏁 Final response content length:', aiResponseContent.length);
    } catch (error) {
      console.error('Error processing AI response:', error);
      // eslint-disable-next-line no-loop-func
      setChatState(currentState => ({
        ...currentState,
        conversations: currentState.conversations.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, content: 'Sorry, I encountered an error while processing your request. Please try again.' }
                    : msg
                ),
                updatedAt: new Date()
              }
            : conv
        ),
      }));
    }
  }, [apiConfig]);

  const sendMessage = useCallback(async (content: string, file?: File) => {
    const timestamp = new Date();
    const userMessageId = uuidv4();
    const aiMessageId = uuidv4(); // Create AI message ID once
    let fileIds: string[] = [];

    console.log('📝 sendMessage called for:', content, 'User Message ID:', userMessageId, 'AI Message ID:', aiMessageId);

    // Handle file upload if present
    if (file) {
      const apiService = getSiteGenieApiService(apiConfig);
      const fileId = await apiService.uploadFile(file);
      if (fileId) {
        fileIds.push(fileId);
      }
    }

    const userMessage: Message = {
      id: userMessageId,
      content,
      isUser: true,
      timestamp,
      fileAttachment: file ? {
        name: file.name,
        size: file.size,
        type: file.type,
      } : undefined,
    };

    // Create initial AI message with loading state
    const initialAiMessage: Message = {
      id: aiMessageId,
      content: '',
      isUser: false,
      timestamp: new Date(),
    };

    setChatState(prevState => {
      let currentConversation = prevState.conversations.find(
        conv => conv.id === prevState.currentConversationId
      );

      let conversationId: string;

      if (!currentConversation) {
        conversationId = uuidv4();
        currentConversation = {
          id: conversationId,
          title: content.length > 50 ? content.substring(0, 50) + '...' : content,
          messages: [userMessage, initialAiMessage],
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        const newState = {
          ...prevState,
          conversations: [currentConversation, ...prevState.conversations],
          currentConversationId: conversationId,
          isTyping: true,
        };

        // Process AI response asynchronously with consistent message ID
        processRealAIResponse(content, conversationId, aiMessageId, fileIds);

        return newState;
      } else {
        conversationId = currentConversation.id;
        const updatedConversation = {
          ...currentConversation,
          messages: [...currentConversation.messages, userMessage, initialAiMessage],
          updatedAt: timestamp,
        };

        const newState = {
          ...prevState,
          isTyping: true,
          conversations: prevState.conversations.map(conv =>
            conv.id === conversationId ? updatedConversation : conv
          ),
        };

        // Process AI response asynchronously with consistent message ID
        processRealAIResponse(content, conversationId, aiMessageId, fileIds);

        return newState;
      }
    });
  }, [apiConfig, processRealAIResponse]);

  const createNewChat = useCallback(() => {
    // Reset the API thread when creating a new chat
    const apiService = getSiteGenieApiService(apiConfig);
    apiService.resetThread();

    setChatState(prevState => ({
      ...prevState,
      currentConversationId: null,
    }));
  }, [apiConfig]);

  const selectConversation = useCallback((id: string) => {
    setChatState(prevState => ({
      ...prevState,
      currentConversationId: id,
    }));
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setChatState(prevState => {
      const newConversations = prevState.conversations.filter(conv => conv.id !== id);
      return {
        ...prevState,
        conversations: newConversations,
        currentConversationId: prevState.currentConversationId === id
          ? (newConversations.length > 0 ? newConversations[0].id : null)
          : prevState.currentConversationId,
      };
    });
  }, []);

  const renameConversation = useCallback((id: string, newTitle: string) => {
    setChatState(prevState => ({
      ...prevState,
      conversations: prevState.conversations.map(conv =>
        conv.id === id ? { ...conv, title: newTitle, updatedAt: new Date() } : conv
      ),
    }));
  }, []);

  const toggleHistoryPanel = useCallback(() => {
    setChatState(prevState => ({
      ...prevState,
      isHistoryPanelOpen: !prevState.isHistoryPanelOpen,
    }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setChatState(prevState => ({
      ...prevState,
      searchQuery: query,
    }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setChatState(prevState => ({
      ...prevState,
      isDarkMode: !prevState.isDarkMode,
    }));
  }, []);

  const updateApiConfig = useCallback((newConfig: SiteGenieConfig) => {
    setApiConfig(newConfig);
    // Initialize a new API service with the new configuration
    initializeSiteGenieApi(newConfig);
  }, [setApiConfig]);

  const contextValue: ChatContextType = {
    ...chatState,
    apiConfig,
    sendMessage,
    createNewChat,
    selectConversation,
    deleteConversation,
    renameConversation,
    toggleHistoryPanel,
    setSearchQuery,
    toggleDarkMode,
    updateApiConfig,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};