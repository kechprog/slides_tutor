'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@/context';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ExamplePrompts } from './ExamplePrompts';

// Streaming indicator component
function StreamingIndicator() {
  return (
    <div className="chat-message chat-message--assistant">
      <div className="chat-message__avatar chat-message__avatar--assistant">AI</div>
      <div className="chat-message__content">
        <div className="streaming-indicator">
          <span className="streaming-indicator__dot" />
          <span className="streaming-indicator__dot" />
          <span className="streaming-indicator__dot" />
        </div>
      </div>
    </div>
  );
}

export function ChatInterface() {
  const {
    currentConversation,
    addUserMessage,
    isStreaming,
    selectArtifact,
    setArtifactPanelOpen,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages, isStreaming]);

  const handleSendMessage = (content: string) => {
    addUserMessage(content);
    // Note: The actual AI response would be handled by an API call
    // For now, messages are just added to the conversation
  };

  const handleArtifactClick = (artifactId: string) => {
    selectArtifact(artifactId);
    setArtifactPanelOpen(true);
  };

  const hasMessages = currentConversation && currentConversation.messages.length > 0;

  return (
    <main className="chat-main">
      {hasMessages ? (
        <div className="chat-messages">
          <div className="chat-messages__inner">
            {currentConversation.messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onArtifactClick={handleArtifactClick}
              />
            ))}
            {isStreaming && <StreamingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>
      ) : (
        <ExamplePrompts onPromptSelect={handleSendMessage} />
      )}
      <ChatInput onSend={handleSendMessage} disabled={isStreaming} />
    </main>
  );
}

export default ChatInterface;
