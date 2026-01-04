import { Slideshow } from '@/lib/parser/types';

/**
 * A single chat message in a conversation
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  /** Optional reference to an artifact generated in this message */
  artifactId?: string;
}

/**
 * A generated presentation artifact
 */
export interface Artifact {
  id: string;
  title: string;
  /** Raw .sld XML content */
  sldContent: string;
  /** Parsed slideshow object for preview/presentation */
  slideshow: Slideshow | null;
  createdAt: Date;
}

/**
 * A conversation containing messages and artifacts
 */
export interface Conversation {
  id: string;
  /** Auto-generated from first user message */
  title: string;
  messages: Message[];
  /** Multiple artifacts can be generated per conversation */
  artifacts: Artifact[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Example prompt shown in empty state
 */
export interface ExamplePrompt {
  title: string;
  description: string;
  prompt: string;
}

/**
 * Serializable version of conversation for localStorage
 */
export interface SerializedConversation {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    artifactId?: string;
  }>;
  artifacts: Array<{
    id: string;
    title: string;
    sldContent: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Chat UI state persisted to localStorage
 */
export interface ChatUIState {
  sidebarWidth: number;
  artifactPanelWidth: number;
  isHistorySidebarOpen: boolean;
  isArtifactPanelOpen: boolean;
}

/**
 * Default UI state values
 */
export const DEFAULT_UI_STATE: ChatUIState = {
  sidebarWidth: 260,
  artifactPanelWidth: 400,
  isHistorySidebarOpen: true,
  isArtifactPanelOpen: false,
};

/**
 * Panel size constraints
 */
export const PANEL_CONSTRAINTS = {
  sidebar: {
    min: 200,
    max: 400,
    collapsed: 60,
  },
  artifact: {
    min: 300,
    max: 600,
  },
} as const;

/**
 * Example prompts for empty state
 */
export const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    title: 'Climate Change',
    description: 'Create an educational presentation',
    prompt: 'Create a 5-slide presentation about climate change, covering causes, effects, and solutions',
  },
  {
    title: 'JavaScript Tutorial',
    description: 'Build a beginner-friendly tutorial',
    prompt: 'Make a tutorial slideshow teaching JavaScript basics: variables, functions, and loops',
  },
  {
    title: 'Product Launch',
    description: 'Design professional slides',
    prompt: 'Design a product launch presentation with sections for features, benefits, and pricing',
  },
  {
    title: 'Solar System',
    description: 'Explore our solar system',
    prompt: 'Build an educational slideshow about the solar system, covering each planet with fun facts',
  },
];
