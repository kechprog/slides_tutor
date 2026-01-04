'use client';

import { useState } from 'react';
import type { Artifact } from '@/lib/chat/types';
import { SlideRenderer } from '@/components/SlideRenderer';

// Navigation icons
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

interface ArtifactPreviewProps {
  artifact: Artifact | null;
}

export function ArtifactPreview({ artifact }: ArtifactPreviewProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  if (!artifact || !artifact.slideshow) {
    return (
      <div className="artifact-panel__preview">
        <div className="artifact-preview">
          <div className="artifact-preview__empty">
            {artifact ? 'Failed to parse presentation' : 'Select a presentation to preview'}
          </div>
        </div>
      </div>
    );
  }

  const { slideshow } = artifact;
  const totalSlides = slideshow.slides.length;
  const currentSlide = slideshow.slides[currentSlideIndex];

  const goToPrevSlide = () => {
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNextSlide = () => {
    setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1));
  };

  return (
    <div className="artifact-panel__preview">
      <div className="artifact-preview">
        <div
          style={{
            width: '200%',
            height: '200%',
            transform: 'scale(0.5)',
            transformOrigin: 'top left',
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <SlideRenderer
            slide={currentSlide}
            slideIndex={currentSlideIndex}
            highlightedElementId={null}
            transition="none"
          />
        </div>
      </div>

      <div className="artifact-navigation">
        <button
          className="artifact-navigation__button"
          onClick={goToPrevSlide}
          disabled={currentSlideIndex === 0}
          aria-label="Previous slide"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <span className="artifact-navigation__indicator">
          {currentSlideIndex + 1} / {totalSlides}
        </span>
        <button
          className="artifact-navigation__button"
          onClick={goToNextSlide}
          disabled={currentSlideIndex === totalSlides - 1}
          aria-label="Next slide"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default ArtifactPreview;
