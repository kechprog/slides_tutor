'use client';

import { useCallback, useRef, useEffect } from 'react';
import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import { useVolume } from '@/hooks/useVolume';

interface VolumeControlProps {
  className?: string;
  showValue?: boolean;
}

/**
 * Volume control component with slider and mute toggle.
 * Icon changes based on volume level (muted, low, medium, high).
 * Persists volume preference to localStorage.
 */
export function VolumeControl({ className = '', showValue = true }: VolumeControlProps) {
  const { volume, isMuted, setVolume, toggleMute, volumeLevel } = useVolume();
  const sliderRef = useRef<HTMLInputElement>(null);

  // Update slider custom property for filled track effect
  useEffect(() => {
    if (sliderRef.current) {
      const progress = isMuted ? 0 : volume;
      sliderRef.current.style.setProperty('--slider-progress', `${progress}%`);
    }
  }, [volume, isMuted]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = Number(e.target.value);
      setVolume(newVolume);
    },
    [setVolume]
  );

  const handleSliderKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Fine-grained volume control with arrow keys
      const step = e.shiftKey ? 10 : 5;
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        e.preventDefault();
        setVolume(Math.min(100, volume + step));
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setVolume(Math.max(0, volume - step));
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    },
    [volume, setVolume, toggleMute]
  );

  // Get the appropriate volume icon based on level
  const VolumeIcon = (() => {
    switch (volumeLevel) {
      case 'muted':
        return VolumeX;
      case 'low':
        return Volume;
      case 'medium':
        return Volume1;
      case 'high':
        return Volume2;
      default:
        return Volume2;
    }
  })();

  const effectiveVolume = isMuted ? 0 : volume;

  return (
    <div className={`volume-control ${className}`}>
      {/* Mute Toggle Button */}
      <div className="control-tooltip">
        <button
          type="button"
          onClick={toggleMute}
          className="control-button control-button--icon"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          aria-pressed={isMuted}
          title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
        >
          <VolumeIcon className="control-button__icon" aria-hidden="true" />
        </button>
        <span className="control-tooltip__content">
          {isMuted ? 'Unmute' : 'Mute'}
          <span className="control-tooltip__shortcut">M</span>
        </span>
      </div>

      {/* Volume Slider */}
      <div className="volume-control__slider-container">
        <input
          ref={sliderRef}
          type="range"
          min="0"
          max="100"
          step="1"
          value={effectiveVolume}
          onChange={handleVolumeChange}
          onKeyDown={handleSliderKeyDown}
          className="control-slider control-slider--filled volume-control__slider"
          aria-label="Volume"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={effectiveVolume}
          aria-valuetext={`Volume ${effectiveVolume}%`}
        />
      </div>

      {/* Volume Value Display */}
      {showValue && (
        <span className="volume-control__value" aria-hidden="true">
          {effectiveVolume}%
        </span>
      )}
    </div>
  );
}
