'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SlideRenderer } from '@/components/SlideRenderer';
import { ControlPanel } from '@/components/ControlPanel';
import { ProgressBar } from '@/components/ProgressBar';
import { useSlideshow, useSettings } from '@/context';
import { usePlayback } from '@/hooks';
import { X, Settings } from 'lucide-react';

export default function PresentPage() {
  const router = useRouter();
  const { slideshow } = useSlideshow();
  const { settings, updateSettings } = useSettings();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize playback hook
  const { state, controls } = usePlayback(slideshow);

  // Handle case where no slideshow is loaded
  useEffect(() => {
    if (!slideshow) {
      router.push('/');
    }
  }, [slideshow, router]);

  // Exit presentation handler
  const handleExit = useCallback(() => {
    controls.stop();
    router.push('/');
  }, [controls, router]);

  // Fullscreen toggle handler
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Error attempting to enable fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('Error attempting to exit fullscreen:', err);
      }
    }
  }, []);

  // Speed adjustment handlers
  const increaseSpeed = useCallback(() => {
    const newRate = Math.min(2.0, settings.playbackRate + 0.1);
    updateSettings({ playbackRate: newRate });
    controls.setPlaybackRate(newRate);
  }, [settings.playbackRate, updateSettings, controls]);

  const decreaseSpeed = useCallback(() => {
    const newRate = Math.max(0.5, settings.playbackRate - 0.1);
    updateSettings({ playbackRate: newRate });
    controls.setPlaybackRate(newRate);
  }, [settings.playbackRate, updateSettings, controls]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case ' ':
          event.preventDefault();
          if (state.status === 'playing') {
            controls.pause();
          } else if (state.status === 'paused' || state.status === 'idle') {
            controls.play();
          }
          break;

        case 'ArrowRight':
        case 'n':
        case 'N':
          event.preventDefault();
          controls.nextSlide();
          break;

        case 'ArrowLeft':
        case 'p':
        case 'P':
          event.preventDefault();
          controls.prevSlide();
          break;

        case 'Escape':
          event.preventDefault();
          handleExit();
          break;

        case 'f':
        case 'F':
          event.preventDefault();
          toggleFullscreen();
          break;

        case '+':
        case '=':
          event.preventDefault();
          increaseSpeed();
          break;

        case '-':
        case '_':
          event.preventDefault();
          decreaseSpeed();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.status, controls, handleExit, toggleFullscreen, increaseSpeed, decreaseSpeed]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Don't render if no slideshow is loaded
  if (!slideshow) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No slideshow loaded</h1>
          <p className="text-gray-400 mb-6">Please select or upload a slideshow to present.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const currentSlide = slideshow.slides[state.currentSlideIndex];
  const totalSlides = slideshow.slides.length;

  return (
    <div className="relative w-full h-screen bg-gray-900 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4">
        {/* Exit Button */}
        <button
          onClick={handleExit}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors shadow-lg"
          aria-label="Exit presentation"
        >
          <X className="w-5 h-5" />
          <span className="font-medium">Exit</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors shadow-lg"
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
      </div>

      {/* Settings Modal Placeholder */}
      {showSettings && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Playback Speed</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={decreaseSpeed}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    -
                  </button>
                  <span className="text-lg font-mono w-12 text-center">
                    {settings.playbackRate.toFixed(1)}x
                  </span>
                  <button
                    onClick={increaseSpeed}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Auto-advance Slides</label>
                <button
                  onClick={() => {
                    const newValue = !settings.autoAdvance;
                    updateSettings({ autoAdvance: newValue });
                    controls.setAutoAdvance(newValue);
                  }}
                  className={`w-full px-4 py-2 rounded transition-colors ${
                    settings.autoAdvance
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {settings.autoAdvance ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="pt-4 text-xs text-gray-400 space-y-1">
                <p className="font-semibold">Keyboard Shortcuts:</p>
                <p><kbd className="px-1 py-0.5 bg-gray-700 rounded">Space</kbd> Play/Pause</p>
                <p><kbd className="px-1 py-0.5 bg-gray-700 rounded">→</kbd> or <kbd className="px-1 py-0.5 bg-gray-700 rounded">N</kbd> Next Slide</p>
                <p><kbd className="px-1 py-0.5 bg-gray-700 rounded">←</kbd> or <kbd className="px-1 py-0.5 bg-gray-700 rounded">P</kbd> Previous Slide</p>
                <p><kbd className="px-1 py-0.5 bg-gray-700 rounded">F</kbd> Toggle Fullscreen</p>
                <p><kbd className="px-1 py-0.5 bg-gray-700 rounded">+/-</kbd> Adjust Speed</p>
                <p><kbd className="px-1 py-0.5 bg-gray-700 rounded">Esc</kbd> Exit</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <SlideRenderer
          slide={currentSlide}
          highlightedElementId={state.highlightedElementId}
          transition={currentSlide.transition || 'fade'}
        />
      </div>

      {/* Unified Control Panel - auto-hides after inactivity */}
      <ControlPanel
        state={state}
        controls={controls}
        totalSlides={totalSlides}
        onSettingsClick={() => setShowSettings(!showSettings)}
        autoHideDelay={3000}
      />

      {/* Progress Bar - always visible at the very bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <ProgressBar
          currentSlide={state.currentSlideIndex}
          totalSlides={totalSlides}
          narrationProgress={state.currentNarrationIndex}
        />
      </div>

      {/* Fullscreen Indicator */}
      {isFullscreen && (
        <div className="absolute top-16 right-4 z-10 px-3 py-1 bg-gray-800 bg-opacity-75 rounded text-xs text-gray-400">
          Fullscreen Mode
        </div>
      )}
    </div>
  );
}
