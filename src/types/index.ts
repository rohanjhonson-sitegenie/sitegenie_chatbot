export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  fileAttachment?: FileAttachment;
}

export interface FileAttachment {
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  threadId?: string;
  isLoadingMessages?: boolean;
  hasMoreMessages?: boolean;
  messageOffset?: number;
}

export interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isHistoryPanelOpen: boolean;
  isDarkMode: boolean;
  searchQuery: string;
  isTyping: boolean;
}