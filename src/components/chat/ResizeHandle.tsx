'use client';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
  className?: string;
}

export function ResizeHandle({ onMouseDown, isDragging, className = '' }: ResizeHandleProps) {
  return (
    <div
      className={`resize-handle ${isDragging ? 'resize-handle--dragging' : ''} ${className}`}
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panel"
      tabIndex={0}
      onKeyDown={(e) => {
        // Allow keyboard resizing with arrow keys
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          // Keyboard resizing could be implemented here
        }
      }}
    />
  );
}

export default ResizeHandle;
