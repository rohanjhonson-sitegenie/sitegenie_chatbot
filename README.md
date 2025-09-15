# SiteGenie Chatbot

A modern, responsive web-based chatbot application built with React and TypeScript. Features a ChatGPT-like interface with support for file uploads, voice-to-text input, conversation history, and search functionality.

## ✨ Features

### Core Chat Features
- **Modern Chat Interface**: Clean, responsive UI with distinct user and AI message bubbles
- **Real-time Messaging**: Instant message sending with typing indicators
- **Message Timestamps**: Shows when each message was sent

### Input Methods
- **Text Input**: Traditional typing with support for multiline messages
- **Voice Input**: Speech-to-text using Web Speech API
- **File Upload**: Drag-and-drop or click-to-upload files (.txt, .pdf, .docx, .xlsx, .csv)

### Conversation Management
- **History Panel**: Collapsible sidebar showing all conversations
- **Search**: Full-text search across conversation titles and messages
- **Auto-naming**: Conversations automatically titled based on first message
- **Edit/Delete**: Rename or remove conversations
- **Persistent Storage**: Local storage preserves conversations across sessions

### UI/UX Features
- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Accessibility**: Keyboard navigation and screen reader support
- **Smooth Animations**: Polished transitions and loading states

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Navigate to project directory**
   ```bash
   cd sitegenie-chatbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Basic Chat
1. Click the text input area at the bottom
2. Type your message and press Enter or click Send
3. AI responses are simulated and appear after a brief delay

### Voice Input
1. Click the microphone icon in the input area
2. Allow microphone permissions when prompted
3. Speak your message clearly
4. The transcribed text will appear in the input field

### File Upload
1. **Drag & Drop**: Drag files directly onto the input area
2. **Click Upload**: Click the paperclip icon to select files
3. **Supported formats**: .txt, .pdf, .docx, .xlsx, .csv (max 10MB)

### Managing Conversations
- **New Chat**: Click "New Chat" in the sidebar
- **Search**: Use the search bar to find specific conversations
- **Rename**: Hover over a conversation and click the edit icon
- **Delete**: Hover over a conversation and click the trash icon

### Theme Toggle
- Click the moon/sun icon in the sidebar to switch between dark and light modes

## 🏗️ Architecture

### Technologies Used
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Web Speech API** for voice recognition
- **UUID** for unique identifiers

### Project Structure
```
src/
├── components/          # React components
│   ├── Layout.tsx      # Main app layout
│   ├── Sidebar.tsx     # Conversation history panel
│   ├── ChatWindow.tsx  # Main chat interface
│   ├── MessageBubble.tsx # Individual message component
│   ├── ChatInput.tsx   # Message input with file/voice support
│   └── TypingIndicator.tsx # AI typing animation
├── context/
│   └── ChatContext.tsx # Global state management
├── hooks/
│   └── useLocalStorage.ts # Local storage hook
├── types/
│   ├── index.ts        # TypeScript interfaces
│   └── global.d.ts     # Global type definitions
└── App.tsx             # Root component
```

## 🛠️ Available Scripts

### `npm start`
Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm run build`
Builds the app for production to the `build` folder.

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run eject`
**Note: this is a one-way operation. Once you `eject`, you can't go back!**

## 🔧 Customization

### Adding New File Types
Edit the `allowedTypes` array in `ChatInput.tsx`:
```typescript
const allowedTypes = [
  'text/plain',
  'application/pdf',
  // Add new MIME types here
];
```

### Modifying AI Responses
Update the `simulateAIResponse` function in `ChatContext.tsx`:
```typescript
const simulateAIResponse = (userMessage: string): string => {
  // Customize response logic here
  return `Custom response to: ${userMessage}`;
};
```

## 📱 Browser Support

- **Chrome/Edge**: Full support including voice recognition
- **Firefox**: Full support including voice recognition
- **Safari**: Full support including voice recognition
- **Mobile browsers**: Responsive design with touch support

## 🔮 Future Enhancements

- **Real AI Integration**: Connect to OpenAI API or similar services
- **User Authentication**: Multi-user support with cloud sync
- **Export Features**: Download conversations as PDF/DOCX
- **Rich Media**: Support for images and videos
- **Mobile App**: React Native version

---

Built with ❤️ using React, TypeScript, and Tailwind CSS
