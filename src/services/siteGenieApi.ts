export interface SiteGenieConfig {
  apiUrl: string;
  assistantId: string;
  companyId: string;
  userId: number;
  userName: string;
}

export interface ProcessQueryRequest {
  query: string;
  assistant_id: string;
  thread_id?: string;
  file_ids?: string[];
  company_id: string;
  user_id: number;
  user_name: string;
}

export interface StreamingResponse {
  data: string;
  error?: string;
  done?: boolean;
}

export interface ThreadMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  file_attachments?: {
    name: string;
    size: number;
    type: string;
    url?: string;
  }[];
}

export interface GetThreadMessagesResponse {
  success: boolean;
  data: {
    thread_id: string;
    messages: ThreadMessage[];
    total_count: number;
    has_more?: boolean;
  };
  error?: string;
}

export class SiteGenieApiService {
  private config: SiteGenieConfig;
  private threadId: string | null = null;

  constructor(config: SiteGenieConfig) {
    this.config = config;
  }

  public getThreadId(): string | null {
    return this.threadId;
  }

  public setThreadId(threadId: string): void {
    this.threadId = threadId;
  }

  public async* processQuery(
    query: string,
    fileIds: string[] = []
  ): AsyncGenerator<StreamingResponse> {
    try {
      // Validate required configuration
      if (this.config.assistantId === 'your-assistant-id' ||
          this.config.companyId === 'your-company-id' ||
          !this.config.assistantId ||
          !this.config.companyId) {
        yield {
          data: '',
          error: 'API Configuration Required: Please configure your Assistant ID and Company ID in the settings.',
          done: true
        };
        return;
      }

      const requestBody: ProcessQueryRequest = {
        query,
        assistant_id: this.config.assistantId,
        company_id: this.config.companyId,
        file_ids: fileIds,
        // ✅ Always require user_id and user_name from request params
        user_id: this.config.userId,
        user_name: this.config.userName,
      };

      // Add thread_id if we have one
      if (this.threadId) {
        requestBody.thread_id = this.threadId;
      }

      // Call Flask API directly with new v2 endpoint
      const apiUrl = `${this.config.apiUrl}/process_query_v2`;

      // Enhanced debugging
      console.log('🔍 Making API request to:', apiUrl);
      console.log('📝 Request body:', JSON.stringify(requestBody, null, 2));
      console.log('📋 Request headers:', {
        'Content-Type': 'application/json',
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      // Log 500 errors but continue processing since API still streams content
      if (response.status === 500) {
        console.warn('⚠️ API returned 500 status but will attempt to process stream anyway');

        // Try to read the error response body for more details
        if (response.body) {
          const clonedResponse = response.clone();
          try {
            const errorText = await clonedResponse.text();
            console.error('🚨 500 Error response body:', errorText);
          } catch (e) {
            console.error('🚨 Could not read error response body:', e);
          }
        }
      }

      if (!response.body) {
        throw new Error('No response body');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            yield { data: '', done: true };
            break;
          }

          const chunk = decoder.decode(value, { stream: true });

          // Enhanced JSON metadata filtering
          const isCompleteJsonObject = (text: string): boolean => {
            const trimmed = text.trim();
            if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
              return false;
            }
            try {
              JSON.parse(trimmed);
              return true;
            } catch {
              return false;
            }
          };

          const isJsonMetadata = chunk.includes('"thread_id"') ||
                                 chunk.includes('"success"') ||
                                 chunk.includes('"data"') ||
                                 chunk.includes('"timestamp"') ||
                                 chunk.includes('"status"') ||
                                 chunk.includes('"message"') ||
                                 chunk.includes('"response"') ||
                                 isCompleteJsonObject(chunk);

          // Look for thread_id in JSON response - this comes at the end of the stream
          if (!this.threadId && chunk.includes('"thread_id"')) {
            try {
              // The complete response should be a JSON object
              const jsonData = JSON.parse(chunk);
              if (jsonData.success && jsonData.data && jsonData.data.thread_id) {
                this.threadId = jsonData.data.thread_id;
              } else if (jsonData.thread_id) {
                this.threadId = jsonData.thread_id;
              }
            } catch (jsonError) {
              // Fallback to regex pattern matching for malformed JSON
              const threadIdMatch = chunk.match(/"thread_id":\s*"([a-zA-Z0-9\-_]+)"/);
              if (threadIdMatch && threadIdMatch[1]) {
                this.threadId = threadIdMatch[1];
              }
            }
            // Always skip JSON metadata chunks
            continue;
          }

          // Skip any other JSON metadata chunks
          if (isJsonMetadata) {
            continue;
          }

          // Additional filtering for JSON-like structures that might slip through
          const cleanedChunk = chunk.replace(/^\s*\{.*\}\s*$/g, '').trim();
          if (cleanedChunk !== chunk.trim() && cleanedChunk.length === 0) {
            continue; // This was a pure JSON object, skip it
          }

          // Filter out HTML error pages and server error messages
          const isHtmlError = chunk.includes('<!doctype html>') ||
                             chunk.includes('<html') ||
                             chunk.includes('<title>500 Internal Server Error</title>') ||
                             chunk.includes('<h1>Internal Server Error</h1>') ||
                             chunk.includes('The server encountered an internal error and was unable to complete');

          const isErrorMessage = chunk.includes('Internal Server Error') ||
                                chunk.includes('generated by waitress') ||
                                chunk.includes('The server encountered an unexpected internal server error') ||
                                chunk.includes('500 Internal Server Error');

          if (isHtmlError || isErrorMessage) {
            continue; // Skip this chunk, don't add to response
          }

          // Process chunks immediately - even single characters
          if (chunk) {
            fullResponse += chunk;
            yield {
              data: chunk,
              done: false
            };
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('❌ Error processing query:', error);

      let errorMessage = 'Unknown error occurred';

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('🌐 Network Error: Failed to fetch - likely CORS or connectivity issue');
        errorMessage = 'Network error: Unable to connect to the API. Check console for details.';
      } else if (error instanceof Error) {
        console.error('🚨 Error details:', error.message);
        // Don't show 500 errors in chat since API still works
        if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
          console.warn('💡 500 error detected but API may still be functional - check stream output above');
          return; // Don't yield error, just return silently
        }
        errorMessage = error.message;
      }

      yield {
        data: '',
        error: errorMessage,
        done: true
      };
    }
  }

  public async uploadFile(file: File): Promise<{file_id: string, filename: string} | null> {
    try {
      console.log('📤 Starting file upload:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const formData = new FormData();
      formData.append('file', file);

      // Call Flask API directly using the new upload_file endpoint
      const uploadUrl = `${this.config.apiUrl}/upload_file`;
      console.log('📤 Upload URL:', uploadUrl);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      console.log('📤 Upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📤 Upload failed response:', errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📤 Upload result:', result);

      if (result.success && result.data) {
        const uploadedFile = {
          file_id: result.data.file_id,
          filename: result.data.filename
        };
        console.log('✅ File uploaded successfully:', uploadedFile);
        return uploadedFile;
      }

      console.warn('⚠️ Upload result does not contain expected data:', result);
      return null;
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      return null;
    }
  }

  public async getThreadMessages(
    threadId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<GetThreadMessagesResponse | null> {
    try {
      const apiUrl = `${this.config.apiUrl}/get_thread_messages`;
      const params = new URLSearchParams({
        thread_id: threadId,
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`${apiUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch thread messages: ${response.status}`);
      }

      const result = await response.json();
      return result as GetThreadMessagesResponse;
    } catch (error) {
      console.error('Error fetching thread messages:', error);
      return null;
    }
  }

  public resetThread(): void {
    this.threadId = null;
  }
}

// Default configuration - can be overridden
export const defaultConfig: SiteGenieConfig = {
  apiUrl: 'https://flaskapi.sitegenie.ai',
  assistantId: 'asst_56DKvSzgipz00RS2OTedtNB5',
  companyId: '20',
  userId: 2,
  userName: 'Rohan Jhonson',
};

// Singleton instance
let apiService: SiteGenieApiService | null = null;

export const getSiteGenieApiService = (config?: SiteGenieConfig): SiteGenieApiService => {
  if (!apiService) {
    apiService = new SiteGenieApiService(config || defaultConfig);
  }
  return apiService;
};

export const initializeSiteGenieApi = (config: SiteGenieConfig): SiteGenieApiService => {
  apiService = new SiteGenieApiService(config);
  return apiService;
};