-- SiteGenie Chatbot - Database Schema for Supabase
-- This script creates the necessary tables for chat history logging

-- Enable RLS (Row Level Security) for better security
-- Run this in your Supabase SQL editor

-- Chat sessions table (stores lightweight session metadata)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  thread_id TEXT UNIQUE, -- OpenAI thread ID for message retrieval
  session_title TEXT NOT NULL,
  company_id TEXT NOT NULL,
  assistant_id TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}', -- Additional context (user_name, etc.)

  -- Indexes for better query performance
  CONSTRAINT unique_thread_id UNIQUE (thread_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_company_id ON chat_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_thread_id ON chat_sessions(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional - remove if you want to disable RLS)
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Sample RLS policies (adjust based on your authentication needs)
-- Policy for users to see only their own chat sessions
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy for users to insert their own chat sessions
CREATE POLICY "Users can insert own chat sessions" ON chat_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy for users to update their own chat sessions
CREATE POLICY "Users can update own chat sessions" ON chat_sessions
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy for users to delete their own chat sessions
CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
    FOR DELETE USING (auth.uid()::text = user_id);

-- Optional: If you want to allow service-level access without RLS, create this policy
-- CREATE POLICY "Service role can manage all sessions" ON chat_sessions
--     FOR ALL USING (auth.role() = 'service_role');

-- Sample data structure for reference:
-- INSERT INTO chat_sessions (user_id, thread_id, session_title, company_id, assistant_id, message_count, metadata)
-- VALUES (
--     'user_123',
--     'thread_abc123',
--     'Help with website setup',
--     'company_456',
--     'asst_789',
--     5,
--     '{"user_name": "John Doe", "source": "web_app", "initial_query": "I need help setting up my website"}'
-- );