'use client';

import { memo } from 'react';
import { Slide, TransitionType } from '@/lib/parser/types';
import { SlideContent } from './SlideContent';
import './SlideRenderer.css';

interface SlideRendererProps {
  slide: Slide;
  highlightedElementId: string | null;
  transition?: TransitionType;
}

const SlideRendererComponent = ({
  slide,
  highlightedElementId,
  transition = 'none'
}: SlideRendererProps) => {
  // Build transition class name
  const transitionClass = transition !== 'none' ? `slide-transition-${transition}` : '';

  return (
    <div
      className={`slide ${transitionClass}`.trim()}
      role="article"
      aria-label={`Slide ${slide.order + 1}`}
    >
      <div className="slide-content">
        {slide.children.map((child, index) => (
          <SlideContent
            key={`slide-${slide.order}-${index}`}
            node={child}
            path={[index]}
            highlightedElementId={highlightedElementId}
          />
        ))}
      </div>
    </div>
  );
};

export const SlideRenderer = memo(SlideRendererComponent);
