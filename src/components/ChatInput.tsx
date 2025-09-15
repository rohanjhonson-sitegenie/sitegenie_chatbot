import React, { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Mic, MicOff, X } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string, file?: File) => void;
  isDarkMode: boolean;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isDarkMode,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || attachedFile) {
      onSendMessage(message.trim(), attachedFile || undefined);
      setMessage('');
      setAttachedFile(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert('File type not supported. Please upload .txt, .pdf, .docx, .xlsx, or .csv files.');
      return;
    }

    setAttachedFile(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const startVoiceRecording = async () => {
    try {
      // Check if browser supports speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setMessage(prev => prev + (prev ? ' ' : '') + transcript);
          adjustTextareaHeight();
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } else {
        alert('Speech recognition is not supported in your browser.');
      }
    } catch (error) {
      console.error('Error starting voice recording:', error);
      alert('Could not start voice recording. Please check microphone permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4">
      {/* File Attachment Display */}
      {attachedFile && (
        <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Paperclip className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {attachedFile.name} ({formatFileSize(attachedFile.size)})
            </span>
          </div>
          <button
            onClick={removeAttachedFile}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
            aria-label="Remove file"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`
            relative flex items-end space-x-2 p-3 rounded-lg border-2 transition-colors
            ${isDragging
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="group"
          aria-label="Message input area"
        >
          {/* Drag Overlay */}
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-lg z-10">
              <div className="text-center">
                <Paperclip className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  Drop file here to attach
                </p>
              </div>
            </div>
          )}

          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:cursor-not-allowed"
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={disabled}
            className="flex-1 resize-none border-none outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 min-h-[20px] max-h-[120px] disabled:cursor-not-allowed"
            rows={1}
          />

          {/* Voice Recording Button */}
          <button
            type="button"
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            disabled={disabled}
            className={`
              flex-shrink-0 p-2 transition-colors disabled:cursor-not-allowed
              ${isRecording
                ? 'text-red-500 hover:text-red-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }
            `}
            aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!message.trim() && !attachedFile) || disabled}
            className="flex-shrink-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.docx,.xlsx,.csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileSelect(file);
            }
          }}
          className="hidden"
        />
      </form>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="mt-2 flex items-center justify-center space-x-2 text-red-500">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm">Recording...</span>
        </div>
      )}
    </div>
  );
};

export default ChatInput;