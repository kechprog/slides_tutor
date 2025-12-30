'use client';

import { useSettings } from '@/context/SettingsContext';

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

interface PlaybackControlsProps {
  state: PlaybackState;
  controls: PlaybackControls;
  totalSlides: number;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function PlaybackControls({
  state,
  controls,
  totalSlides,
}: PlaybackControlsProps) {
  const { status, currentSlideIndex } = state;
  const { settings, updateSettings } = useSettings();
  const { playbackRate, autoAdvance } = settings;

  const isPlaying = status === 'playing';
  const _isPaused = status === 'paused';
  const isIdle = status === 'idle';
  const isFinished = status === 'finished';
  const isFirstSlide = currentSlideIndex === 0;
  const isLastSlide = currentSlideIndex === totalSlides - 1;

  const handlePlayPause = () => {
    if (isPlaying) {
      controls.pause();
    } else {
      controls.play();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/80 to-transparent backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* Main Controls Row */}
        <div className="flex items-center justify-between gap-6 mb-3">
          {/* Left Section: Playback Controls */}
          <div className="flex items-center gap-3">
            {/* Previous Slide Button */}
            <button
              onClick={controls.prevSlide}
              disabled={isFirstSlide}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed transition-all duration-200 text-white disabled:text-white/30"
              title="Previous Slide"
              aria-label="Previous Slide"
            >
              <span className="text-lg" aria-hidden="true">⏮</span>
              <span className="sr-only">Previous Slide</span>
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 text-white shadow-lg hover:shadow-xl"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <>
                  <span className="text-xl" aria-hidden="true">⏸</span>
                  <span className="sr-only">Pause</span>
                </>
              ) : (
                <>
                  <span className="text-xl" aria-hidden="true">▶</span>
                  <span className="sr-only">Play</span>
                </>
              )}
            </button>

            {/* Stop Button */}
            <button
              onClick={controls.stop}
              disabled={isIdle && currentSlideIndex === 0}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed transition-all duration-200 text-white disabled:text-white/30"
              title="Stop"
              aria-label="Stop"
            >
              <span className="text-lg" aria-hidden="true">⏹</span>
              <span className="sr-only">Stop</span>
            </button>

            {/* Next Slide Button */}
            <button
              onClick={controls.nextSlide}
              disabled={isLastSlide}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed transition-all duration-200 text-white disabled:text-white/30"
              title="Next Slide"
              aria-label="Next Slide"
            >
              <span className="text-lg" aria-hidden="true">⏭</span>
              <span className="sr-only">Next Slide</span>
            </button>
          </div>

          {/* Center Section: Slide Counter */}
          <div className="flex-1 flex justify-center">
            <div
              className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm"
              role="status"
              aria-label={`Slide ${currentSlideIndex + 1} of ${totalSlides}`}
            >
              <span className="text-white font-medium tabular-nums" aria-hidden="true">
                {currentSlideIndex + 1} / {totalSlides}
              </span>
            </div>
          </div>

          {/* Right Section: Settings */}
          <div className="flex items-center gap-4">
            {/* Playback Speed Selector */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="playback-rate"
                className="text-white/80 text-sm font-medium"
              >
                Speed:
              </label>
              <select
                id="playback-rate"
                value={playbackRate}
                onChange={(e) => {
                  const newRate = Number(e.target.value);
                  updateSettings({ playbackRate: newRate });
                  controls.setPlaybackRate(newRate);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all duration-200"
              >
                {PLAYBACK_RATES.map((rate) => (
                  <option key={rate} value={rate} className="bg-gray-900">
                    {rate}x
                  </option>
                ))}
              </select>
            </div>

            {/* Auto-advance Toggle */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="auto-advance"
                className="text-white/80 text-sm font-medium"
              >
                Auto-advance:
              </label>
              <button
                id="auto-advance"
                role="switch"
                aria-checked={autoAdvance}
                aria-label="Toggle auto-advance between slides"
                onClick={() => {
                  const newValue = !autoAdvance;
                  updateSettings({ autoAdvance: newValue });
                  controls.setAutoAdvance(newValue);
                }}
                className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
                  autoAdvance ? 'bg-blue-600' : 'bg-white/20'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    autoAdvance ? 'translate-x-6' : 'translate-x-0'
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        {isFinished && (
          <div className="text-center text-white/70 text-sm">
            Presentation finished
          </div>
        )}
      </div>
    </div>
  );
}
