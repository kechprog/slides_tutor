'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Settings,
} from 'lucide-react';
import { VolumeControl } from './VolumeControl';
import { useSettings } from '@/context/SettingsContext';
import '@/styles/controls.css';

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

interface ControlPanelProps {
  state: PlaybackState;
  controls: PlaybackControls;
  totalSlides: number;
  onSettingsClick?: () => void;
  autoHideDelay?: number;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
const DEFAULT_AUTO_HIDE_DELAY = 3000; // 3 seconds

/**
 * Unified control panel for playback and settings.
 * Features auto-hide on inactivity, keyboard shortcuts with tooltips,
 * and responsive layout.
 */
export function ControlPanel({
  state,
  controls,
  totalSlides,
  onSettingsClick,
  autoHideDelay = DEFAULT_AUTO_HIDE_DELAY,
}: ControlPanelProps) {
  const { status, currentSlideIndex } = state;
  const { settings, updateSettings } = useSettings();
  const { playbackRate } = settings;

  const [isVisible, setIsVisible] = useState(true);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isPlaying = status === 'playing';
  const isIdle = status === 'idle';
  const isFinished = status === 'finished';
  const isFirstSlide = currentSlideIndex === 0;
  const isLastSlide = currentSlideIndex === totalSlides - 1;

  // Reset hide timer
  const resetHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setIsVisible(true);

    if (autoHideDelay > 0) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);
    }
  }, [autoHideDelay]);

  // Set up initial auto-hide timer
  useEffect(() => {
    if (autoHideDelay > 0) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [autoHideDelay]);

  // Show panel on mouse move or keyboard activity
  useEffect(() => {
    const handleActivity = () => {
      resetHideTimer();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Show panel on any key activity
      resetHideTimer();

      // Don't handle if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Handle volume shortcuts
      if (e.key === 'm' || e.key === 'M') {
        // Volume mute is handled by VolumeControl
        return;
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [resetHideTimer]);

  // Keep visible when interacting with the panel
  const handlePanelInteraction = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setIsVisible(true);
  }, []);

  const handlePanelLeave = useCallback(() => {
    resetHideTimer();
  }, [resetHideTimer]);

  // Play/Pause handler
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      controls.pause();
    } else {
      controls.play();
    }
  }, [isPlaying, controls]);

  // Speed change handler
  const handleSpeedChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newRate = Number(e.target.value);
      updateSettings({ playbackRate: newRate });
      controls.setPlaybackRate(newRate);
    },
    [updateSettings, controls]
  );

  return (
    <div
      ref={panelRef}
      className={`control-panel ${isVisible ? 'control-panel--visible' : 'control-panel--hidden'}`}
      onMouseEnter={handlePanelInteraction}
      onMouseLeave={handlePanelLeave}
      onFocus={handlePanelInteraction}
      role="toolbar"
      aria-label="Playback controls"
    >
      <div className="control-panel__inner">
        {/* Main Controls Row */}
        <div className="control-panel__row control-panel__row--main">
          {/* Left Section: Playback Controls */}
          <div className="control-group control-group--spaced">
            {/* Previous Slide */}
            <div className="control-tooltip">
              <button
                type="button"
                onClick={controls.prevSlide}
                disabled={isFirstSlide}
                className="control-button control-button--icon"
                aria-label="Previous slide"
              >
                <SkipBack className="control-button__icon" aria-hidden="true" />
              </button>
              <span className="control-tooltip__content">
                Previous Slide
                <span className="control-tooltip__shortcut">P / Left</span>
              </span>
            </div>

            {/* Play/Pause */}
            <div className="control-tooltip">
              <button
                type="button"
                onClick={handlePlayPause}
                className="control-button control-button--primary"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                aria-pressed={isPlaying}
              >
                {isPlaying ? (
                  <Pause className="control-button__icon" aria-hidden="true" />
                ) : (
                  <Play className="control-button__icon" aria-hidden="true" />
                )}
              </button>
              <span className="control-tooltip__content">
                {isPlaying ? 'Pause' : 'Play'}
                <span className="control-tooltip__shortcut">Space</span>
              </span>
            </div>

            {/* Stop */}
            <div className="control-tooltip">
              <button
                type="button"
                onClick={controls.stop}
                disabled={isIdle && currentSlideIndex === 0}
                className="control-button control-button--icon"
                aria-label="Stop"
              >
                <Square className="control-button__icon" aria-hidden="true" />
              </button>
              <span className="control-tooltip__content">
                Stop
                <span className="control-tooltip__shortcut">S</span>
              </span>
            </div>

            {/* Next Slide */}
            <div className="control-tooltip">
              <button
                type="button"
                onClick={controls.nextSlide}
                disabled={isLastSlide}
                className="control-button control-button--icon"
                aria-label="Next slide"
              >
                <SkipForward className="control-button__icon" aria-hidden="true" />
              </button>
              <span className="control-tooltip__content">
                Next Slide
                <span className="control-tooltip__shortcut">N / Right</span>
              </span>
            </div>
          </div>

          {/* Center Section: Progress Indicator */}
          <div
            className="progress-indicator"
            role="status"
            aria-label={`Slide ${currentSlideIndex + 1} of ${totalSlides}`}
          >
            <span className="progress-indicator__current">{currentSlideIndex + 1}</span>
            <span className="progress-indicator__separator">/</span>
            <span className="progress-indicator__total">{totalSlides}</span>
          </div>

          {/* Right Section: Speed, Volume, Settings */}
          <div className="control-group control-group--spaced">
            {/* Speed Control */}
            <div className="speed-control">
              <label htmlFor="speed-select" className="control-group__label">
                Speed
              </label>
              <select
                id="speed-select"
                value={playbackRate}
                onChange={handleSpeedChange}
                className="speed-control__select"
                aria-label="Playback speed"
              >
                {PLAYBACK_RATES.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}x
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group__divider" aria-hidden="true" />

            {/* Volume Control */}
            <VolumeControl showValue={true} />

            <div className="control-group__divider" aria-hidden="true" />

            {/* Settings Button */}
            {onSettingsClick && (
              <div className="control-tooltip">
                <button
                  type="button"
                  onClick={onSettingsClick}
                  className="control-button control-button--icon control-button--secondary settings-button"
                  aria-label="Open settings"
                >
                  <Settings className="control-button__icon" aria-hidden="true" />
                </button>
                <span className="control-tooltip__content">Settings</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        {isFinished && (
          <div className="text-center text-white/70 text-sm mt-2" role="status">
            Presentation finished
          </div>
        )}
      </div>
    </div>
  );
}
