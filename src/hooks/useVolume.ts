'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const VOLUME_STORAGE_KEY = 'slides-tutor-volume';
const MUTED_STORAGE_KEY = 'slides-tutor-muted';

interface VolumeState {
  volume: number;      // 0-100
  isMuted: boolean;
  previousVolume: number;  // Volume before muting, for unmute restoration
}

interface UseVolumeReturn {
  volume: number;
  isMuted: boolean;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  mute: () => void;
  unmute: () => void;
  volumeLevel: 'muted' | 'low' | 'medium' | 'high';
}

/**
 * Custom hook for managing audio volume with localStorage persistence
 * and TTS audio element integration.
 */
export function useVolume(): UseVolumeReturn {
  const [state, setState] = useState<VolumeState>({
    volume: 75,
    isMuted: false,
    previousVolume: 75,
  });

  const isInitializedRef = useRef(false);

  // Load volume settings from localStorage on mount
  useEffect(() => {
    try {
      const storedVolume = localStorage.getItem(VOLUME_STORAGE_KEY);
      const storedMuted = localStorage.getItem(MUTED_STORAGE_KEY);

      const volume = storedVolume !== null ? Number(storedVolume) : 75;
      const isMuted = storedMuted === 'true';

      setState({
        volume: Math.max(0, Math.min(100, volume)),
        isMuted,
        previousVolume: volume,
      });
    } catch (error) {
      console.error('Failed to load volume settings from localStorage:', error);
    } finally {
      isInitializedRef.current = true;
    }
  }, []);

  // Save volume settings to localStorage whenever they change
  useEffect(() => {
    if (!isInitializedRef.current) return;

    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(state.volume));
      localStorage.setItem(MUTED_STORAGE_KEY, String(state.isMuted));
    } catch (error) {
      console.error('Failed to save volume settings to localStorage:', error);
    }
  }, [state.volume, state.isMuted]);

  // Apply volume to any audio elements with data-tts-audio attribute
  useEffect(() => {
    const effectiveVolume = state.isMuted ? 0 : state.volume / 100;

    // Apply to all TTS audio elements
    const audioElements = document.querySelectorAll<HTMLAudioElement>('audio[data-tts-audio]');
    audioElements.forEach((audio) => {
      audio.volume = effectiveVolume;
    });

    // Also update any existing audio elements that might be playing
    const allAudioElements = document.querySelectorAll<HTMLAudioElement>('audio');
    allAudioElements.forEach((audio) => {
      // Only update if it seems to be a TTS-related audio element
      if (audio.src && (audio.src.includes('tts') || audio.src.includes('speech'))) {
        audio.volume = effectiveVolume;
      }
    });
  }, [state.volume, state.isMuted]);

  // Set volume (0-100)
  const setVolume = useCallback((value: number) => {
    const clampedValue = Math.max(0, Math.min(100, value));
    setState((prev) => ({
      ...prev,
      volume: clampedValue,
      isMuted: clampedValue === 0 ? true : false,
      previousVolume: clampedValue > 0 ? clampedValue : prev.previousVolume,
    }));
  }, []);

  // Toggle mute state
  const toggleMute = useCallback(() => {
    setState((prev) => {
      if (prev.isMuted) {
        // Unmuting: restore previous volume (or default to 75 if previous was 0)
        return {
          ...prev,
          isMuted: false,
          volume: prev.previousVolume > 0 ? prev.previousVolume : 75,
        };
      } else {
        // Muting: save current volume and mute
        return {
          ...prev,
          isMuted: true,
          previousVolume: prev.volume > 0 ? prev.volume : prev.previousVolume,
        };
      }
    });
  }, []);

  // Explicit mute
  const mute = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isMuted: true,
      previousVolume: prev.volume > 0 ? prev.volume : prev.previousVolume,
    }));
  }, []);

  // Explicit unmute
  const unmute = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isMuted: false,
      volume: prev.previousVolume > 0 ? prev.previousVolume : 75,
    }));
  }, []);

  // Determine volume level for icon display
  const volumeLevel: 'muted' | 'low' | 'medium' | 'high' = (() => {
    if (state.isMuted || state.volume === 0) return 'muted';
    if (state.volume <= 33) return 'low';
    if (state.volume <= 66) return 'medium';
    return 'high';
  })();

  return {
    volume: state.volume,
    isMuted: state.isMuted,
    setVolume,
    toggleMute,
    mute,
    unmute,
    volumeLevel,
  };
}
