import React, { createContext, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, ChatState } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { SiteGenieConfig, getSiteGenieApiService, initializeSiteGenieApi, ThreadMessage } from '../services/siteGenieApi';
import { ChatHistoryConfig, getChatHistoryService, initializeChatHistoryService } from '../services/chatHistoryService';

interface ChatContextType extends ChatState {
  sendMessage: (content: string, file?: File) => void;
  createNewChat: () => void;
  selectConversation: (id: string, threadId?: string) => void;
  loadThreadMessages: (conversationId: string, threadId: string) => Promise<void>;
  loadMoreMessages: (conversationId: string) => Promise<void>;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  toggleHistoryPanel: () => void;
  setSearchQuery: (query: string) => void;
  toggleDarkMode: () => void;
  apiConfig: SiteGenieConfig;
  updateApiConfig: (config: SiteGenieConfig) => void;
  chatHistoryConfig: ChatHistoryConfig | null;
  updateChatHistoryConfig: (config: ChatHistoryConfig) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const convertThreadMessageToMessage = (threadMessage: ThreadMessage): Message => {
  return {
    id: threadMessage.id,
    content: threadMessage.content,
    isUser: threadMessage.role === 'user',
    timestamp: new Date(threadMessage.timestamp),
    fileAttachment: threadMessage.file_attachments && threadMessage.file_attachments.length > 0
      ? threadMessage.file_attachments[0]
      : undefined
  };
};

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
    assistantId: 'asst_56DKvSzgipz00RS2OTedtNB5',
    companyId: '20',
    userId: 2,
    userName: 'Rohan Jhonson',
  });

  const [chatHistoryConfig, setChatHistoryConfig] = useLocalStorage<ChatHistoryConfig | null>('chatHistoryConfig',
    process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY
      ? {
          supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
          supabaseKey: process.env.REACT_APP_SUPABASE_ANON_KEY
        }
      : null
  );

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

  React.useEffect(() => {
    if (chatHistoryConfig) {
      initializeChatHistoryService(chatHistoryConfig);
    }
  }, [chatHistoryConfig]);

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
      // Process the streaming response
      for await (const chunk of apiService.processQuery(userMessage, fileIds)) {

        if (chunk.error) {
          console.error('❌ Error in chunk:', chunk.error);
          setChatState(currentState => ({
            ...currentState,
            isTyping: false,
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
          // Reset typing indicator when stream is done
          setChatState(currentState => ({
            ...currentState,
            isTyping: false
          }));
          break;
        }

        if (chunk.data) {
          aiResponseContent += chunk.data;
          updateCounter++;

          // Update every chunk immediately with direct state modification
          setChatState(currentState => {
            const conversations = currentState.conversations.map(conv => {
              if (conv.id === conversationId) {
                const messages = conv.messages.map(msg => {
                  if (msg.id === aiMessageId) {
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

      // Log to Supabase and update conversation with thread ID after successful completion
      if (chatHistoryConfig) {
        const chatHistoryService = getChatHistoryService();
        const apiService = getSiteGenieApiService(apiConfig);
        const threadId = apiService.getThreadId();

        if (threadId) {
          // Update the conversation with the threadId
          setChatState(currentState => ({
            ...currentState,
            conversations: currentState.conversations.map(conv =>
              conv.id === conversationId
                ? { ...conv, threadId }
                : conv
            )
          }));

          // Check if session already exists
          const existingSession = await chatHistoryService.getChatSessionByThreadId(threadId);

          if (existingSession) {
            // Update existing session
            await chatHistoryService.updateChatSessionByThreadId(threadId, {
              message_count: existingSession.message_count + 2, // user + AI message
              metadata: {
                ...existingSession.metadata,
                last_user_message: userMessage,
                last_updated: new Date().toISOString()
              }
            });
          } else {
            // Create new session
            await chatHistoryService.createChatSession({
              user_id: apiConfig.userId.toString(),
              thread_id: threadId,
              session_title: userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage,
              company_id: apiConfig.companyId,
              assistant_id: apiConfig.assistantId,
              message_count: 2, // user + AI message
              metadata: {
                user_name: apiConfig.userName,
                initial_query: userMessage,
                source: 'web_app'
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error processing AI response:', error);
      // eslint-disable-next-line no-loop-func
      setChatState(currentState => ({
        ...currentState,
        isTyping: false,
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
  }, [apiConfig, chatHistoryConfig]);

  const sendMessage = useCallback(async (content: string, file?: File) => {
    const timestamp = new Date();
    const userMessageId = uuidv4();
    const aiMessageId = uuidv4(); // Create AI message ID once
    let fileIds: string[] = [];

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
  }, [apiConfig, processRealAIResponse, chatHistoryConfig]);

  const loadThreadMessages = useCallback(async (conversationId: string, threadId: string) => {
    const apiService = getSiteGenieApiService(apiConfig);

    setChatState(prevState => ({
      ...prevState,
      conversations: prevState.conversations.map(conv =>
        conv.id === conversationId
          ? { ...conv, isLoadingMessages: true, messageOffset: 0 }
          : conv
      )
    }));

    try {
      const response = await apiService.getThreadMessages(threadId, 50, 0);

      if (response?.success) {
        const messages = response.data.messages.map(convertThreadMessageToMessage);

        setChatState(prevState => ({
          ...prevState,
          conversations: prevState.conversations.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages,
                  threadId,
                  isLoadingMessages: false,
                  hasMoreMessages: response.data.has_more || false,
                  messageOffset: messages.length
                }
              : conv
          )
        }));

        // Set the thread ID in the API service
        apiService.setThreadId(threadId);
      } else {
        throw new Error(response?.error || 'Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading thread messages:', error);
      setChatState(prevState => ({
        ...prevState,
        conversations: prevState.conversations.map(conv =>
          conv.id === conversationId
            ? { ...conv, isLoadingMessages: false }
            : conv
        )
      }));
    }
  }, [apiConfig]);

  const loadMoreMessages = useCallback(async (conversationId: string) => {
    const conversation = chatState.conversations.find(conv => conv.id === conversationId);
    if (!conversation?.threadId || conversation.isLoadingMessages || !conversation.hasMoreMessages) {
      return;
    }

    const apiService = getSiteGenieApiService(apiConfig);

    setChatState(prevState => ({
      ...prevState,
      conversations: prevState.conversations.map(conv =>
        conv.id === conversationId
          ? { ...conv, isLoadingMessages: true }
          : conv
      )
    }));

    try {
      const response = await apiService.getThreadMessages(
        conversation.threadId,
        50,
        conversation.messageOffset || 0
      );

      if (response?.success) {
        const newMessages = response.data.messages.map(convertThreadMessageToMessage);

        setChatState(prevState => ({
          ...prevState,
          conversations: prevState.conversations.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...newMessages, ...conv.messages],
                  isLoadingMessages: false,
                  hasMoreMessages: response.data.has_more || false,
                  messageOffset: (conv.messageOffset || 0) + newMessages.length
                }
              : conv
          )
        }));
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      setChatState(prevState => ({
        ...prevState,
        conversations: prevState.conversations.map(conv =>
          conv.id === conversationId
            ? { ...conv, isLoadingMessages: false }
            : conv
        )
      }));
    }
  }, [chatState.conversations, apiConfig]);

  const createNewChat = useCallback(() => {
    // Reset the API thread when creating a new chat
    const apiService = getSiteGenieApiService(apiConfig);
    apiService.resetThread();

    setChatState(prevState => ({
      ...prevState,
      currentConversationId: null,
    }));
  }, [apiConfig]);

  const selectConversation = useCallback(async (id: string, threadId?: string) => {
    setChatState(prevState => ({
      ...prevState,
      currentConversationId: id,
    }));

    // If threadId is provided, load messages from API
    if (threadId) {
      await loadThreadMessages(id, threadId);
    } else {
      // Look for existing conversation with thread ID
      const conversation = chatState.conversations.find(conv => conv.id === id);
      if (conversation?.threadId) {
        await loadThreadMessages(id, conversation.threadId);
      }
    }
  }, [chatState.conversations, loadThreadMessages]);

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

  const updateChatHistoryConfig = useCallback((newConfig: ChatHistoryConfig) => {
    setChatHistoryConfig(newConfig);
    // Initialize a new chat history service with the new configuration
    initializeChatHistoryService(newConfig);
  }, [setChatHistoryConfig]);

  const contextValue: ChatContextType = {
    ...chatState,
    apiConfig,
    chatHistoryConfig,
    sendMessage,
    createNewChat,
    selectConversation,
    loadThreadMessages,
    loadMoreMessages,
    deleteConversation,
    renameConversation,
    toggleHistoryPanel,
    setSearchQuery,
    toggleDarkMode,
    updateApiConfig,
    updateChatHistoryConfig,
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