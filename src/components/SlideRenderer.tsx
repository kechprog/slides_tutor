'use client';

import { memo } from 'react';
import { Slide, TransitionType } from '@/lib/parser/types';
import { SlideContent } from './SlideContent';
import './SlideRenderer.css';

interface SlideRendererProps {
  slide: Slide;
  slideIndex: number;
  highlightedElementId: string | null;
  transition?: TransitionType;
  onElementClick?: (elementId: string) => void;
  narratableElementIds?: Set<string>;
}

const SlideRendererComponent = ({
  slide,
  slideIndex,
  highlightedElementId,
  transition = 'none',
  onElementClick,
  narratableElementIds,
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
            slideIndex={slideIndex}
            path={[index]}
            highlightedElementId={highlightedElementId}
            onElementClick={onElementClick}
            narratableElementIds={narratableElementIds}
          />
        ))}
      </div>
    </div>
  );
};

export const SlideRenderer = memo(SlideRendererComponent);
