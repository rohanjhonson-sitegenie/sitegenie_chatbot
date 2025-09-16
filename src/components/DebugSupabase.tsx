import React, { useState } from 'react';
import { getChatHistoryService } from '../services/chatHistoryService';

export const DebugSupabase: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testSupabaseConnection = async () => {
    setLoading(true);
    setDebugInfo('Testing Supabase connection...\n');

    try {
      // Check environment variables
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

      setDebugInfo(prev => prev + `Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}\n`);
      setDebugInfo(prev => prev + `Supabase Key: ${supabaseKey ? '✅ Set' : '❌ Missing'}\n`);
      setDebugInfo(prev => prev + `Full URL value: "${supabaseUrl}"\n`);
      setDebugInfo(prev => prev + `Full Key value: "${supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'undefined'}"\n`);

      if (!supabaseUrl || !supabaseKey) {
        setDebugInfo(prev => prev + '❌ Environment variables not set properly\n');
        return;
      }

      // Check service initialization
      const service = getChatHistoryService();
      const isConfigured = service.isConfigured();
      setDebugInfo(prev => prev + `Service configured: ${isConfigured ? '✅ Yes' : '❌ No'}\n`);

      if (!isConfigured) {
        setDebugInfo(prev => prev + '❌ Chat history service not configured\n');
        return;
      }

      // Test creating a session
      setDebugInfo(prev => prev + 'Testing session creation...\n');

      const testSession = await service.createChatSession({
        user_id: 'test_user_123',
        thread_id: `test_thread_${Date.now()}`,
        session_title: 'Debug Test Session',
        company_id: 'test_company',
        assistant_id: 'test_assistant',
        message_count: 1,
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      });

      if (testSession) {
        setDebugInfo(prev => prev + `✅ Session created successfully! ID: ${testSession.id}\n`);

        // Test retrieving the session
        const retrieved = await service.getChatSessionByThreadId(testSession.thread_id!);
        setDebugInfo(prev => prev + `✅ Session retrieved: ${retrieved ? 'Success' : 'Failed'}\n`);

        // Test deleting the session
        if (testSession.id) {
          const deleted = await service.deleteChatSession(testSession.id);
          setDebugInfo(prev => prev + `✅ Session deleted: ${deleted ? 'Success' : 'Failed'}\n`);
        }
      } else {
        setDebugInfo(prev => prev + '❌ Failed to create session\n');
      }

    } catch (error) {
      setDebugInfo(prev => prev + `❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
      console.error('Supabase test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '1px solid #ccc',
      padding: '10px',
      maxWidth: '400px',
      maxHeight: '300px',
      overflow: 'auto',
      zIndex: 9999,
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <h3>Supabase Debug</h3>
      <button
        onClick={testSupabaseConnection}
        disabled={loading}
        style={{
          marginBottom: '10px',
          padding: '5px 10px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>
      <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
        {debugInfo}
      </pre>
    </div>
  );
};