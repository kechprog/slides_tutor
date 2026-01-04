'use client';

import type { Message } from '@/lib/chat/types';

// Document Icon
function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

interface ChatMessageProps {
  message: Message;
  onArtifactClick?: (artifactId: string) => void;
}

export function ChatMessage({ message, onArtifactClick }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-message chat-message--${message.role}`}>
      <div className={`chat-message__avatar chat-message__avatar--${message.role}`}>
        {isUser ? 'U' : 'AI'}
      </div>
      <div className="chat-message__content">
        <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
        {message.artifactId && onArtifactClick && (
          <button
            className="chat-message__artifact-link"
            onClick={() => onArtifactClick(message.artifactId!)}
          >
            <DocumentIcon className="w-4 h-4" />
            <span>View Presentation</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
