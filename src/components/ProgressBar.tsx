'use client';

interface ProgressBarProps {
  currentSlide: number;       // 0-indexed current slide
  totalSlides: number;        // Total number of slides
  narrationProgress: number;  // 0-1 progress within current slide
  onSlideClick?: (index: number) => void;  // Optional: click to navigate
}

export function ProgressBar({
  currentSlide,
  totalSlides,
  narrationProgress,
  onSlideClick,
}: ProgressBarProps) {
  // Ensure narrationProgress is between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, narrationProgress));

  return (
    <div
      className="w-full bg-gray-800/50 backdrop-blur-sm py-2 px-4"
      role="progressbar"
      aria-label="Presentation progress"
      aria-valuenow={currentSlide + 1}
      aria-valuemin={1}
      aria-valuemax={totalSlides}
      aria-valuetext={`Slide ${currentSlide + 1} of ${totalSlides}, ${Math.round(clampedProgress * 100)}% complete`}
    >
      <div className="flex gap-1 items-center h-2">
        {Array.from({ length: totalSlides }, (_, index) => {
          const isCompleted = index < currentSlide;
          const isCurrent = index === currentSlide;
          const isFuture = index > currentSlide;

          // Calculate the fill width for the current slide
          const fillWidth = isCurrent ? `${clampedProgress * 100}%` : '100%';

          return (
            <div
              key={index}
              className={`
                relative flex-1 h-full rounded-sm overflow-hidden
                transition-all duration-300 ease-out
                ${onSlideClick ? 'cursor-pointer hover:h-3' : ''}
                ${isCurrent ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-800' : ''}
              `}
              onClick={() => onSlideClick?.(index)}
              role={onSlideClick ? 'button' : undefined}
              tabIndex={onSlideClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onSlideClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSlideClick(index);
                }
              }}
              aria-label={`Go to slide ${index + 1} of ${totalSlides}${isCurrent ? ' (current)' : isCompleted ? ' (completed)' : ''}`}
            >
              {/* Background (empty state) */}
              <div className="absolute inset-0 bg-gray-600" />

              {/* Fill (progress state) */}
              <div
                className={`
                  absolute inset-0 origin-left transition-all duration-200 ease-out
                  ${isCompleted ? 'bg-blue-500' : ''}
                  ${isCurrent ? 'bg-gradient-to-r from-blue-500 to-blue-400' : ''}
                  ${isFuture ? 'bg-gray-600' : ''}
                `}
                style={{
                  width: isCompleted ? '100%' : isCurrent ? fillWidth : '0%',
                }}
              />

              {/* Animated shimmer effect for current slide */}
              {isCurrent && (
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                  style={{
                    width: fillWidth,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Optional: Slide counter */}
      <div className="text-center text-xs text-gray-300 mt-1">
        Slide {currentSlide + 1} / {totalSlides}
      </div>
    </div>
  );
}
