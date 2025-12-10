'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Slideshow } from '../lib/parser/types';
import { buildNarrationQueue } from '../lib/narration';
import type { NarrationItem } from '../lib/narration';
import { WebSpeechTTS } from '../lib/tts/web-speech';
import type { TTSEngine } from '../lib/tts/types';

interface PlaybackState {
  status: 'idle' | 'playing' | 'paused' | 'finished';
  currentSlideIndex: number;
  currentNarrationIndex: number;
  highlightedElementId: string | null;
}

interface PlaybackControls {
  play(): void;
  pause(): void;
  stop(): void;
  nextSlide(): void;
  prevSlide(): void;
  goToSlide(index: number): void;
  setAutoAdvance(enabled: boolean): void;
  setPlaybackRate(rate: number): void;
}

export function usePlayback(slideshow: Slideshow | null): {
  state: PlaybackState;
  controls: PlaybackControls;
} {
  // State
  const [state, setState] = useState<PlaybackState>({
    status: 'idle',
    currentSlideIndex: 0,
    currentNarrationIndex: 0,
    highlightedElementId: null,
  });

  // Refs
  // Note: Refs are used as the source of truth for the playback loop to avoid stale closures.
  // The async playback loop needs to access the latest values without triggering re-renders.
  // State is derived from refs and used for UI updates only.
  const ttsEngineRef = useRef<TTSEngine | null>(null);
  const narrationQueueRef = useRef<NarrationItem[]>([]);
  const autoAdvanceRef = useRef<boolean>(true);
  const isPlayingRef = useRef<boolean>(false);
  const currentNarrationIndexRef = useRef<number>(0);
  const currentSlideIndexRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize TTS engine
  useEffect(() => {
    ttsEngineRef.current = new WebSpeechTTS({
      onError: (error) => {
        console.error('TTS Error:', error);
        setState((prev) => ({ ...prev, status: 'idle' }));
        isPlayingRef.current = false;
      },
    });

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (ttsEngineRef.current) {
        ttsEngineRef.current.stop();
      }
    };
  }, []);

  // Build narration queue when slideshow changes
  useEffect(() => {
    if (slideshow) {
      narrationQueueRef.current = buildNarrationQueue(slideshow);
    } else {
      narrationQueueRef.current = [];
    }
  }, [slideshow]);

  // Helper to get current slide's narration items
  const getCurrentSlideNarrations = useCallback((slideIndex: number): NarrationItem[] => {
    return narrationQueueRef.current.filter((item) => item.slideIndex === slideIndex);
  }, []);

  // Helper to find narration index for a slide
  const getFirstNarrationIndexForSlide = useCallback((slideIndex: number): number => {
    return narrationQueueRef.current.findIndex((item) => item.slideIndex === slideIndex);
  }, []);

  // Play next narration item
  const playNextNarration = useCallback(async () => {
    if (!slideshow || !ttsEngineRef.current || !isPlayingRef.current) {
      return;
    }

    const currentItem = narrationQueueRef.current[currentNarrationIndexRef.current];

    if (!currentItem) {
      // No more narration items
      if (autoAdvanceRef.current && currentSlideIndexRef.current < slideshow.slides.length - 1) {
        // Move to next slide
        const nextSlideIndex = currentSlideIndexRef.current + 1;
        const nextNarrationIndex = getFirstNarrationIndexForSlide(nextSlideIndex);

        if (nextNarrationIndex !== -1) {
          currentSlideIndexRef.current = nextSlideIndex;
          currentNarrationIndexRef.current = nextNarrationIndex;
          setState((prev) => ({
            ...prev,
            currentSlideIndex: nextSlideIndex,
            currentNarrationIndex: nextNarrationIndex,
            highlightedElementId: null,
          }));
          // Continue playing the next slide
          timeoutRef.current = setTimeout(() => playNextNarration(), 0);
        } else {
          // Next slide has no narrations, set to finished
          setState((prev) => ({
            ...prev,
            status: 'finished',
            highlightedElementId: null,
          }));
          isPlayingRef.current = false;
        }
      } else {
        // Finished or auto-advance disabled
        setState((prev) => ({
          ...prev,
          status: 'finished',
          highlightedElementId: null,
        }));
        isPlayingRef.current = false;
      }
      return;
    }

    // Check if we need to change slides
    if (currentItem.slideIndex !== currentSlideIndexRef.current) {
      currentSlideIndexRef.current = currentItem.slideIndex;
      setState((prev) => ({
        ...prev,
        currentSlideIndex: currentItem.slideIndex,
      }));
    }

    try {
      // Set highlighted element
      setState((prev) => ({
        ...prev,
        highlightedElementId: currentItem.id,
      }));

      // Speak the narration
      await ttsEngineRef.current.speak(currentItem.text);

      // If we were stopped during speaking, don't continue
      if (!isPlayingRef.current) {
        return;
      }

      // Wait for delay if specified
      if (currentItem.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, currentItem.delay));
      }

      // Clear highlight
      setState((prev) => ({
        ...prev,
        highlightedElementId: null,
      }));

      // Move to next narration item
      currentNarrationIndexRef.current += 1;
      setState((prev) => ({
        ...prev,
        currentNarrationIndex: currentNarrationIndexRef.current,
      }));

      // Continue playing
      if (isPlayingRef.current) {
        // Use setTimeout to avoid stack overflow with recursive calls
        timeoutRef.current = setTimeout(() => playNextNarration(), 0);
      }
    } catch (error) {
      // Error already logged by TTS engine
      console.error('Playback error:', error);
    }
  }, [slideshow, getFirstNarrationIndexForSlide]);

  // Play control
  const play = useCallback(() => {
    if (!slideshow || slideshow.slides.length === 0) {
      return;
    }

    // If finished, restart from beginning
    if (state.status === 'finished') {
      currentSlideIndexRef.current = 0;
      currentNarrationIndexRef.current = 0;
      setState({
        status: 'playing',
        currentSlideIndex: 0,
        currentNarrationIndex: 0,
        highlightedElementId: null,
      });
      isPlayingRef.current = true;
      timeoutRef.current = setTimeout(() => playNextNarration(), 0);
      return;
    }

    // If paused, resume
    if (state.status === 'paused' && ttsEngineRef.current?.isPaused()) {
      ttsEngineRef.current.resume();
      setState((prev) => ({ ...prev, status: 'playing' }));
      isPlayingRef.current = true;
      return;
    }

    // Start playing
    setState((prev) => ({ ...prev, status: 'playing' }));
    isPlayingRef.current = true;
    playNextNarration();
  }, [slideshow, state.status, playNextNarration]);

  // Pause control
  const pause = useCallback(() => {
    if (!ttsEngineRef.current) {
      return;
    }

    if (state.status === 'playing') {
      // Clear any pending timeouts to prevent race conditions
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      ttsEngineRef.current.pause();
      setState((prev) => ({ ...prev, status: 'paused' }));
      isPlayingRef.current = false;
    }
  }, [state.status]);

  // Stop control
  const stop = useCallback(() => {
    if (!ttsEngineRef.current) {
      return;
    }

    // Clear any pending timeouts to prevent race conditions
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    ttsEngineRef.current.stop();
    isPlayingRef.current = false;
    currentSlideIndexRef.current = 0;
    currentNarrationIndexRef.current = 0;
    setState({
      status: 'idle',
      currentSlideIndex: 0,
      currentNarrationIndex: 0,
      highlightedElementId: null,
    });
  }, []);

  // Next slide control
  const nextSlide = useCallback(() => {
    if (!slideshow || state.currentSlideIndex >= slideshow.slides.length - 1) {
      return;
    }

    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Stop current narration
    if (ttsEngineRef.current) {
      ttsEngineRef.current.stop();
    }
    isPlayingRef.current = false;

    const nextSlideIndex = state.currentSlideIndex + 1;
    const nextNarrationIndex = getFirstNarrationIndexForSlide(nextSlideIndex);

    currentSlideIndexRef.current = nextSlideIndex;
    currentNarrationIndexRef.current = nextNarrationIndex !== -1 ? nextNarrationIndex : state.currentNarrationIndex;
    setState({
      status: 'idle',
      currentSlideIndex: nextSlideIndex,
      currentNarrationIndex: nextNarrationIndex !== -1 ? nextNarrationIndex : state.currentNarrationIndex,
      highlightedElementId: null,
    });
  }, [slideshow, state.currentSlideIndex, state.currentNarrationIndex, getFirstNarrationIndexForSlide]);

  // Previous slide control
  const prevSlide = useCallback(() => {
    if (!slideshow || state.currentSlideIndex <= 0) {
      return;
    }

    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Stop current narration
    if (ttsEngineRef.current) {
      ttsEngineRef.current.stop();
    }
    isPlayingRef.current = false;

    const prevSlideIndex = state.currentSlideIndex - 1;
    const prevNarrationIndex = getFirstNarrationIndexForSlide(prevSlideIndex);

    currentSlideIndexRef.current = prevSlideIndex;
    currentNarrationIndexRef.current = prevNarrationIndex !== -1 ? prevNarrationIndex : state.currentNarrationIndex;
    setState({
      status: 'idle',
      currentSlideIndex: prevSlideIndex,
      currentNarrationIndex: prevNarrationIndex !== -1 ? prevNarrationIndex : state.currentNarrationIndex,
      highlightedElementId: null,
    });
  }, [slideshow, state.currentSlideIndex, state.currentNarrationIndex, getFirstNarrationIndexForSlide]);

  // Go to slide control
  const goToSlide = useCallback((index: number) => {
    if (!slideshow || index < 0 || index >= slideshow.slides.length) {
      return;
    }

    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Stop current narration
    if (ttsEngineRef.current) {
      ttsEngineRef.current.stop();
    }
    isPlayingRef.current = false;

    const narrationIndex = getFirstNarrationIndexForSlide(index);

    currentSlideIndexRef.current = index;
    currentNarrationIndexRef.current = narrationIndex !== -1 ? narrationIndex : state.currentNarrationIndex;
    setState({
      status: 'idle',
      currentSlideIndex: index,
      currentNarrationIndex: narrationIndex !== -1 ? narrationIndex : state.currentNarrationIndex,
      highlightedElementId: null,
    });
  }, [slideshow, state.currentNarrationIndex, getFirstNarrationIndexForSlide]);

  // Set auto-advance control
  const setAutoAdvance = useCallback((enabled: boolean) => {
    autoAdvanceRef.current = enabled;
  }, []);

  // Set playback rate control
  const setPlaybackRate = useCallback((rate: number) => {
    if (ttsEngineRef.current) {
      ttsEngineRef.current.setRate(rate);
    }
  }, []);

  return {
    state,
    controls: {
      play,
      pause,
      stop,
      nextSlide,
      prevSlide,
      goToSlide,
      setAutoAdvance,
      setPlaybackRate,
    },
  };
}
