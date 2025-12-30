'use client';

import { memo } from 'react';

interface HighlightIndicatorProps {
  color?: string;
}

/**
 * Speech bubble indicator component shown near highlighted elements
 * during narration to draw attention to the current element.
 */
const HighlightIndicatorComponent = ({ color = '#fef08a' }: HighlightIndicatorProps) => {
  return (
    <div className="highlight-indicator-container">
      <div className="highlight-indicator" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Speech bubble shape */}
          <path
            d="M12 2C6.48 2 2 5.58 2 10c0 2.12.89 4.04 2.34 5.48-.32 1.48-1.04 2.78-1.04 2.78s2.64-.04 4.42-.9c1.3.44 2.74.64 4.28.64 5.52 0 10-3.58 10-8s-4.48-8-10-8z"
            fill={color}
            stroke="#000"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* Sound wave lines */}
          <path
            d="M8 9h2M8 11h4M8 13h3"
            stroke="#000"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};

export const HighlightIndicator = memo(HighlightIndicatorComponent);
