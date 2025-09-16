import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface ChatSessionData {
  id?: string;
  user_id: string;
  thread_id: string | null;
  session_title: string;
  company_id: string;
  assistant_id: string;
  message_count: number;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

export interface ChatHistoryConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

export class ChatHistoryService {
  private supabase: SupabaseClient | null = null;
  private config: ChatHistoryConfig | null = null;

  constructor(config?: ChatHistoryConfig) {
    if (config) {
      this.initialize(config);
    }
  }

  public initialize(config: ChatHistoryConfig): void {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  public isConfigured(): boolean {
    return this.supabase !== null && this.config !== null;
  }

  public async createChatSession(sessionData: Omit<ChatSessionData, 'id' | 'created_at' | 'updated_at'>): Promise<ChatSessionData | null> {
    if (!this.supabase) {
      console.warn('ChatHistoryService not configured - skipping session creation');
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .insert([{
          user_id: sessionData.user_id,
          thread_id: sessionData.thread_id,
          session_title: sessionData.session_title,
          company_id: sessionData.company_id,
          assistant_id: sessionData.assistant_id,
          message_count: sessionData.message_count,
          metadata: sessionData.metadata || {}
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating chat session:', error);
        return null;
      }

      console.log('✅ Chat session created:', data.id);
      return data as ChatSessionData;
    } catch (error) {
      console.error('Failed to create chat session:', error);
      return null;
    }
  }

  public async updateChatSession(
    sessionId: string,
    updates: Partial<Pick<ChatSessionData, 'session_title' | 'message_count' | 'thread_id' | 'metadata'>>
  ): Promise<ChatSessionData | null> {
    if (!this.supabase) {
      console.warn('ChatHistoryService not configured - skipping session update');
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating chat session:', error);
        return null;
      }

      return data as ChatSessionData;
    } catch (error) {
      console.error('Failed to update chat session:', error);
      return null;
    }
  }

  public async updateChatSessionByThreadId(
    threadId: string,
    updates: Partial<Pick<ChatSessionData, 'session_title' | 'message_count' | 'metadata'>>
  ): Promise<ChatSessionData | null> {
    if (!this.supabase) {
      console.warn('ChatHistoryService not configured - skipping session update');
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .update(updates)
        .eq('thread_id', threadId)
        .select()
        .single();

      if (error) {
        console.error('Error updating chat session by thread ID:', error);
        return null;
      }

      return data as ChatSessionData;
    } catch (error) {
      console.error('Failed to update chat session by thread ID:', error);
      return null;
    }
  }

  public async getChatSessionByThreadId(threadId: string): Promise<ChatSessionData | null> {
    if (!this.supabase) {
      console.warn('ChatHistoryService not configured - skipping session retrieval');
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('thread_id', threadId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - this is expected for new conversations
          return null;
        }
        console.error('Error getting chat session:', error);
        return null;
      }

      return data as ChatSessionData;
    } catch (error) {
      console.error('Failed to get chat session:', error);
      return null;
    }
  }

  public async getUserChatSessions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatSessionData[]> {
    if (!this.supabase) {
      console.warn('ChatHistoryService not configured - returning empty array');
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error getting user chat sessions:', error);
        return [];
      }

      return (data as ChatSessionData[]) || [];
    } catch (error) {
      console.error('Failed to get user chat sessions:', error);
      return [];
    }
  }

  public async deleteChatSession(sessionId: string): Promise<boolean> {
    if (!this.supabase) {
      console.warn('ChatHistoryService not configured - skipping session deletion');
      return false;
    }

    try {
      const { error } = await this.supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('Error deleting chat session:', error);
        return false;
      }

      console.log('✅ Chat session deleted:', sessionId);
      return true;
    } catch (error) {
      console.error('Failed to delete chat session:', error);
      return false;
    }
  }

  public async getChatSessionStats(userId: string): Promise<{
    totalSessions: number;
    totalMessages: number;
    averageMessagesPerSession: number;
  } | null> {
    if (!this.supabase) {
      console.warn('ChatHistoryService not configured - returning null stats');
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .select('message_count')
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting chat session stats:', error);
        return null;
      }

      const totalSessions = data.length;
      const totalMessages = data.reduce((sum, session) => sum + (session.message_count || 0), 0);
      const averageMessagesPerSession = totalSessions > 0 ? totalMessages / totalSessions : 0;

      return {
        totalSessions,
        totalMessages,
        averageMessagesPerSession: Math.round(averageMessagesPerSession * 100) / 100
      };
    } catch (error) {
      console.error('Failed to get chat session stats:', error);
      return null;
    }
  }
}

// Singleton instance
let chatHistoryService: ChatHistoryService | null = null;

export const getChatHistoryService = (config?: ChatHistoryConfig): ChatHistoryService => {
  if (!chatHistoryService) {
    chatHistoryService = new ChatHistoryService(config);
  }
  return chatHistoryService;
};

export const initializeChatHistoryService = (config: ChatHistoryConfig): ChatHistoryService => {
  chatHistoryService = new ChatHistoryService(config);
  return chatHistoryService;
};