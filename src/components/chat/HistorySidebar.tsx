'use client';

import { useChat } from '@/context';
import { HistoryItem } from './HistoryItem';

// Plus Icon
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

interface HistorySidebarProps {
  isOpen: boolean;
  width: number;
}

export function HistorySidebar({ isOpen, width }: HistorySidebarProps) {
  const {
    conversations,
    currentConversation,
    createConversation,
    selectConversation,
    deleteConversation,
  } = useChat();

  return (
    <aside
      className={`history-sidebar ${isOpen ? 'history-sidebar--open' : ''}`}
      style={{ width: `${width}px` }}
    >
      <div className="history-sidebar__header">
        <span className="history-sidebar__title">History</span>
      </div>

      <button className="history-sidebar__new-button" onClick={createConversation}>
        <PlusIcon className="w-4 h-4" />
        <span>New Chat</span>
      </button>

      <div className="history-sidebar__list">
        {conversations.length === 0 ? (
          <div
            style={{
              padding: '1rem',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: '0.875rem',
            }}
          >
            No conversations yet
          </div>
        ) : (
          conversations.map((conversation) => (
            <HistoryItem
              key={conversation.id}
              conversation={conversation}
              isActive={currentConversation?.id === conversation.id}
              onClick={() => selectConversation(conversation.id)}
              onDelete={() => deleteConversation(conversation.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}

export default HistorySidebar;
