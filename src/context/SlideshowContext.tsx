'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Slideshow } from '@/lib/parser/types';

export interface SlideshowContextValue {
  slideshow: Slideshow | null;
  setSlideshow: (slideshow: Slideshow | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

// Create context with default values
const SlideshowContext = createContext<SlideshowContextValue | undefined>(undefined);

interface SlideshowProviderProps {
  children: ReactNode;
}

// Create SlideshowProvider component
export function SlideshowProvider({ children }: SlideshowProviderProps) {
  const [slideshow, setSlideshow] = useState<Slideshow | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const value: SlideshowContextValue = {
    slideshow,
    setSlideshow,
    isLoading,
    setIsLoading,
    error,
    setError,
  };

  return (
    <SlideshowContext.Provider value={value}>
      {children}
    </SlideshowContext.Provider>
  );
}

// Create useSlideshow hook for accessing context
export function useSlideshow(): SlideshowContextValue {
  const context = useContext(SlideshowContext);
  if (context === undefined) {
    throw new Error('useSlideshow must be used within a SlideshowProvider');
  }
  return context;
}
