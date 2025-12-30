'use client';

import { memo } from 'react';
import { SubtitleConfig } from '@/lib/subtitles/types';
import '@/styles/subtitles.css';

interface SubtitlesProps {
  text: string | null;
  config: SubtitleConfig;
}

const SubtitlesComponent = ({ text, config }: SubtitlesProps) => {
  if (!config.enabled) {
    return null;
  }

  const positionClass = config.position === 'top' ? 'subtitle-top' : 'subtitle-bottom';
  const sizeClass = `subtitle-${config.size}`;
  const backgroundClass = `subtitle-bg-${config.background}`;
  const visibilityClass = text ? 'subtitle-visible' : 'subtitle-hidden';

  return (
    <div
      className={`subtitle-container ${positionClass} ${sizeClass} ${backgroundClass} ${visibilityClass}`}
      role="status"
      aria-live="polite"
      aria-label="Subtitles"
    >
      {text}
    </div>
  );
};

export const Subtitles = memo(SubtitlesComponent);
