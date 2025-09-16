# Chat History Logging Setup Guide

This guide walks you through setting up chat history logging with Supabase for your SiteGenie Chatbot.

## Overview

The chat history logging system stores **lightweight metadata** about chat sessions in Supabase, while actual message content remains with OpenAI. This approach is optimal for:

- **Cost efficiency**: 90% space savings vs storing full messages
- **Performance**: Fast queries and minimal storage
- **Privacy**: Full message content stays with OpenAI
- **Analytics**: Track usage patterns and session metrics

## What Gets Stored

✅ **Stored in Supabase:**
- Session metadata (title, timestamps, user info)
- OpenAI thread IDs (for message retrieval)
- Message counts and usage statistics
- Company/Assistant IDs for organization

❌ **NOT Stored in Supabase:**
- Full message content (queries and responses)
- File attachments
- Sensitive user data

## Setup Instructions

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new account
2. Create a new project
3. Note down your:
   - **Project URL** (looks like: `https://your-project.supabase.co`)
   - **Anon Key** (found in Settings → API)

### Step 2: Set up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the `database-schema.sql` file from your project root
3. Copy and paste the entire SQL script into the SQL Editor
4. Click **Run** to create the tables and indexes

The schema creates:
- `chat_sessions` table with optimized indexes
- Automatic timestamp updates
- Row Level Security (RLS) policies
- Performance optimizations

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Important**: Add `.env.local` to your `.gitignore` if not already present

### Step 4: Test the Integration

1. Restart your development server:
   ```bash
   npm start
   ```

2. Open your chatbot and send a test message
3. Check your Supabase dashboard → Table Editor → `chat_sessions`
4. You should see a new record with metadata about your chat session

## Configuration Options

### Row Level Security (RLS)

The default setup includes RLS policies that:
- Allow users to see only their own sessions
- Prevent unauthorized access
- Support service-level operations

To disable RLS (not recommended for production):
```sql
ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
```

### Custom User Identification

By default, the system uses the `userId` from your SiteGenie config. For production, you might want to:

1. Implement proper authentication
2. Use actual user IDs from your auth system
3. Update the RLS policies accordingly

### Debug Mode

Enable debug logging by adding to your `.env.local`:
```env
REACT_APP_DEBUG_CHAT_HISTORY=true
```

## Monitoring and Analytics

### Available Analytics

The `ChatHistoryService` provides these analytics methods:

```typescript
// Get user statistics
const stats = await chatHistoryService.getChatSessionStats(userId);
console.log(stats.totalSessions, stats.totalMessages, stats.averageMessagesPerSession);

// Get user's session history
const sessions = await chatHistoryService.getUserChatSessions(userId, 50);
```

### Database Queries

Check session activity:
```sql
-- Most active users
SELECT user_id, COUNT(*) as session_count, SUM(message_count) as total_messages
FROM chat_sessions
GROUP BY user_id
ORDER BY total_messages DESC;

-- Recent activity
SELECT session_title, created_at, message_count
FROM chat_sessions
ORDER BY created_at DESC
LIMIT 10;

-- Usage by company
SELECT company_id, COUNT(*) as sessions, AVG(message_count) as avg_messages
FROM chat_sessions
GROUP BY company_id;
```

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Make sure file is named `.env.local` (not `.env`)
   - Restart your development server
   - Check that variables start with `REACT_APP_`

2. **Database connection errors**
   - Verify your Supabase URL and anon key
   - Check that your project is not paused
   - Ensure RLS policies allow your operations

3. **No data appearing in Supabase**
   - Check browser console for errors
   - Verify that chat sessions have thread IDs
   - Ensure your API config is properly set up

### Debug Steps

1. Check browser console for error messages
2. Verify Supabase connection:
   ```typescript
   const service = getChatHistoryService();
   console.log('Service configured:', service.isConfigured());
   ```
3. Test database access in Supabase SQL Editor
4. Check RLS policies if using authentication

## Security Considerations

- **Never commit** your `.env.local` file
- Use **service role key** only for server-side operations
- Implement proper authentication for production
- Regularly review and update RLS policies
- Consider data retention policies for GDPR compliance

## Cost Optimization

- The current schema stores ~200 bytes per session vs ~10KB+ for full messages
- Indexes are optimized for common query patterns
- Consider data archival for long-term cost management
- Monitor your Supabase usage in the dashboard

## Production Deployment

For production deployments:

1. Set environment variables in your hosting platform
2. Review and tighten RLS policies
3. Set up monitoring and alerting
4. Consider database backups
5. Implement proper error handling and fallbacks

## Need Help?

If you encounter issues:
1. Check the browser console for errors
2. Verify your Supabase dashboard for data
3. Review the SQL schema for any missing tables
4. Test with a simple chat session first

The system is designed to fail gracefully - if Supabase is unavailable, the chatbot will continue working without history logging.