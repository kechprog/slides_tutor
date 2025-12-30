'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

export interface Settings {
  playbackRate: number;         // 0.5 - 2.0, default 1.0
  autoAdvance: boolean;         // Auto-advance slides, default true
  voiceId: string | null;       // Selected TTS voice
  highlightColor: string;       // Highlight color, default '#fef08a'
  theme: 'light' | 'dark';      // UI theme, default 'light'
  ttsProvider: 'web-speech' | 'openai';  // TTS provider
}

export interface SettingsContextValue {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
}

// Default settings
const DEFAULT_SETTINGS: Settings = {
  playbackRate: 1.0,
  autoAdvance: true,
  voiceId: 'soprano',  // Default to local soprano TTS service
  highlightColor: '#fef08a',
  theme: 'light',
  ttsProvider: 'openai',  // Default to OpenAI-compatible (local soprano)
};

const STORAGE_KEY = 'slides-tutor-settings';

// Create context with default settings
const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

// Create SettingsProvider component that persists to localStorage
export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save settings to localStorage:', error);
      }
    }
  }, [settings, isInitialized]);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const value: SettingsContextValue = useMemo(() => ({
    settings,
    updateSettings,
  }), [settings, updateSettings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Create useSettings hook for accessing context
export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
