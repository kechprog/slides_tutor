'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { parseSld } from '@/lib/parser';
import type { Slideshow } from '@/lib/parser/types';
import type {
  Message,
  Artifact,
  Conversation,
  SerializedConversation,
  ChatUIState,
} from '@/lib/chat/types';
import { DEFAULT_UI_STATE, PANEL_CONSTRAINTS } from '@/lib/chat/types';

const STORAGE_KEY = 'slides-tutor-chat-history';
const UI_STATE_KEY = 'slides-tutor-chat-ui';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate conversation title from first user message
 */
function generateTitle(content: string): string {
  const maxLength = 50;
  const cleaned = content.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength).trim() + '...';
}

/**
 * Serialize conversation for localStorage
 */
function serializeConversation(conv: Conversation): SerializedConversation {
  return {
    id: conv.id,
    title: conv.title,
    messages: conv.messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      artifactId: msg.artifactId,
    })),
    artifacts: conv.artifacts.map((art) => ({
      id: art.id,
      title: art.title,
      sldContent: art.sldContent,
      createdAt: art.createdAt.toISOString(),
    })),
    createdAt: conv.createdAt.toISOString(),
    updatedAt: conv.updatedAt.toISOString(),
  };
}

/**
 * Deserialize conversation from localStorage
 */
function deserializeConversation(data: SerializedConversation): Conversation {
  return {
    id: data.id,
    title: data.title,
    messages: data.messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      artifactId: msg.artifactId,
    })),
    artifacts: data.artifacts.map((art) => {
      const parseResult = parseSld(art.sldContent);
      return {
        id: art.id,
        title: art.title,
        sldContent: art.sldContent,
        slideshow: parseResult.success ? parseResult.slideshow : null,
        createdAt: new Date(art.createdAt),
      };
    }),
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

export interface ChatContextValue {
  // Conversations
  conversations: Conversation[];
  currentConversation: Conversation | null;
  createConversation: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;

  // Messaging
  addUserMessage: (content: string) => Message;
  addAssistantMessage: (content: string, artifactId?: string) => Message;
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;

  // Artifacts (multiple per chat)
  currentArtifact: Artifact | null;
  selectArtifact: (id: string) => void;
  addArtifact: (title: string, sldContent: string) => Artifact | null;

  // UI State
  isHistorySidebarOpen: boolean;
  setHistorySidebarOpen: (open: boolean) => void;
  isArtifactPanelOpen: boolean;
  setArtifactPanelOpen: (open: boolean) => void;

  // Panel Sizes (for resize persistence)
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  artifactPanelWidth: number;
  setArtifactPanelWidth: (width: number) => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentArtifactId, setCurrentArtifactId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // UI state
  const [isHistorySidebarOpen, setHistorySidebarOpen] = useState(DEFAULT_UI_STATE.isHistorySidebarOpen);
  const [isArtifactPanelOpen, setArtifactPanelOpen] = useState(DEFAULT_UI_STATE.isArtifactPanelOpen);
  const [sidebarWidth, setSidebarWidthState] = useState(DEFAULT_UI_STATE.sidebarWidth);
  const [artifactPanelWidth, setArtifactPanelWidthState] = useState(DEFAULT_UI_STATE.artifactPanelWidth);

  // Initialization flag
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      // Load conversations
      const storedConversations = localStorage.getItem(STORAGE_KEY);
      if (storedConversations) {
        const parsed: SerializedConversation[] = JSON.parse(storedConversations);
        const deserialized = parsed.map(deserializeConversation);
        setConversations(deserialized);
        // Select most recent conversation if any
        if (deserialized.length > 0) {
          const mostRecent = deserialized.reduce((a, b) =>
            a.updatedAt > b.updatedAt ? a : b
          );
          setCurrentConversationId(mostRecent.id);
          // Select most recent artifact if any
          if (mostRecent.artifacts.length > 0) {
            const latestArtifact = mostRecent.artifacts.reduce((a, b) =>
              a.createdAt > b.createdAt ? a : b
            );
            setCurrentArtifactId(latestArtifact.id);
          }
        }
      }

      // Load UI state
      const storedUIState = localStorage.getItem(UI_STATE_KEY);
      if (storedUIState) {
        const uiState: ChatUIState = JSON.parse(storedUIState);
        setHistorySidebarOpen(uiState.isHistorySidebarOpen);
        setArtifactPanelOpen(uiState.isArtifactPanelOpen);
        setSidebarWidthState(uiState.sidebarWidth);
        setArtifactPanelWidthState(uiState.artifactPanelWidth);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Persist conversations to localStorage
  useEffect(() => {
    if (isInitialized && conversations.length > 0) {
      try {
        const serialized = conversations.map(serializeConversation);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
      } catch (error) {
        console.error('Failed to save chat history:', error);
      }
    }
  }, [conversations, isInitialized]);

  // Persist UI state to localStorage
  useEffect(() => {
    if (isInitialized) {
      try {
        const uiState: ChatUIState = {
          isHistorySidebarOpen,
          isArtifactPanelOpen,
          sidebarWidth,
          artifactPanelWidth,
        };
        localStorage.setItem(UI_STATE_KEY, JSON.stringify(uiState));
      } catch (error) {
        console.error('Failed to save UI state:', error);
      }
    }
  }, [isHistorySidebarOpen, isArtifactPanelOpen, sidebarWidth, artifactPanelWidth, isInitialized]);

  // Get current conversation
  const currentConversation = useMemo(() => {
    return conversations.find((c) => c.id === currentConversationId) || null;
  }, [conversations, currentConversationId]);

  // Get current artifact
  const currentArtifact = useMemo(() => {
    if (!currentConversation || !currentArtifactId) return null;
    return currentConversation.artifacts.find((a) => a.id === currentArtifactId) || null;
  }, [currentConversation, currentArtifactId]);

  // Create new conversation
  const createConversation = useCallback(() => {
    const now = new Date();
    const newConversation: Conversation = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      artifacts: [],
      createdAt: now,
      updatedAt: now,
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setCurrentArtifactId(null);
    setArtifactPanelOpen(false);
  }, []);

  // Select conversation
  const selectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
    const conv = conversations.find((c) => c.id === id);
    if (conv && conv.artifacts.length > 0) {
      const latestArtifact = conv.artifacts.reduce((a, b) =>
        a.createdAt > b.createdAt ? a : b
      );
      setCurrentArtifactId(latestArtifact.id);
    } else {
      setCurrentArtifactId(null);
    }
  }, [conversations]);

  // Delete conversation
  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
      setCurrentArtifactId(null);
    }
  }, [currentConversationId]);

  // Add user message
  const addUserMessage = useCallback((content: string): Message => {
    const message: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setConversations((prev) => {
      // If no current conversation, create one
      if (!currentConversationId) {
        const now = new Date();
        const newConversation: Conversation = {
          id: generateId(),
          title: generateTitle(content),
          messages: [message],
          artifacts: [],
          createdAt: now,
          updatedAt: now,
        };
        setCurrentConversationId(newConversation.id);
        return [newConversation, ...prev];
      }

      return prev.map((conv) => {
        if (conv.id !== currentConversationId) return conv;
        const isFirstMessage = conv.messages.length === 0;
        return {
          ...conv,
          title: isFirstMessage ? generateTitle(content) : conv.title,
          messages: [...conv.messages, message],
          updatedAt: new Date(),
        };
      });
    });

    return message;
  }, [currentConversationId]);

  // Add assistant message
  const addAssistantMessage = useCallback((content: string, artifactId?: string): Message => {
    const message: Message = {
      id: generateId(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      artifactId,
    };

    setConversations((prev) => {
      return prev.map((conv) => {
        if (conv.id !== currentConversationId) return conv;
        return {
          ...conv,
          messages: [...conv.messages, message],
          updatedAt: new Date(),
        };
      });
    });

    return message;
  }, [currentConversationId]);

  // Select artifact
  const selectArtifact = useCallback((id: string) => {
    setCurrentArtifactId(id);
    setArtifactPanelOpen(true);
  }, []);

  // Add artifact
  const addArtifact = useCallback((title: string, sldContent: string): Artifact | null => {
    const parseResult = parseSld(sldContent);
    const artifact: Artifact = {
      id: generateId(),
      title,
      sldContent,
      slideshow: parseResult.success ? parseResult.slideshow : null,
      createdAt: new Date(),
    };

    setConversations((prev) => {
      return prev.map((conv) => {
        if (conv.id !== currentConversationId) return conv;
        return {
          ...conv,
          artifacts: [...conv.artifacts, artifact],
          updatedAt: new Date(),
        };
      });
    });

    setCurrentArtifactId(artifact.id);
    setArtifactPanelOpen(true);
    return artifact;
  }, [currentConversationId]);

  // Sidebar width with constraints
  const setSidebarWidth = useCallback((width: number) => {
    const constrained = Math.min(
      Math.max(width, PANEL_CONSTRAINTS.sidebar.min),
      PANEL_CONSTRAINTS.sidebar.max
    );
    setSidebarWidthState(constrained);
  }, []);

  // Artifact panel width with constraints
  const setArtifactPanelWidth = useCallback((width: number) => {
    const constrained = Math.min(
      Math.max(width, PANEL_CONSTRAINTS.artifact.min),
      PANEL_CONSTRAINTS.artifact.max
    );
    setArtifactPanelWidthState(constrained);
  }, []);

  const value: ChatContextValue = useMemo(
    () => ({
      conversations,
      currentConversation,
      createConversation,
      selectConversation,
      deleteConversation,
      addUserMessage,
      addAssistantMessage,
      isStreaming,
      setIsStreaming,
      currentArtifact,
      selectArtifact,
      addArtifact,
      isHistorySidebarOpen,
      setHistorySidebarOpen,
      isArtifactPanelOpen,
      setArtifactPanelOpen,
      sidebarWidth,
      setSidebarWidth,
      artifactPanelWidth,
      setArtifactPanelWidth,
    }),
    [
      conversations,
      currentConversation,
      createConversation,
      selectConversation,
      deleteConversation,
      addUserMessage,
      addAssistantMessage,
      isStreaming,
      currentArtifact,
      selectArtifact,
      addArtifact,
      isHistorySidebarOpen,
      isArtifactPanelOpen,
      sidebarWidth,
      setSidebarWidth,
      artifactPanelWidth,
      setArtifactPanelWidth,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
