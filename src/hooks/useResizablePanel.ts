'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseResizablePanelOptions {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  side: 'left' | 'right';
  onWidthChange?: (width: number) => void;
}

export interface UseResizablePanelReturn {
  width: number;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
}

export function useResizablePanel({
  initialWidth,
  minWidth,
  maxWidth,
  side,
  onWidthChange,
}: UseResizablePanelOptions): UseResizablePanelReturn {
  const [width, setWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Update width when initialWidth changes (e.g., from localStorage)
  useEffect(() => {
    setWidth(initialWidth);
  }, [initialWidth]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  }, [width]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startXRef.current;
      // For left panel, moving right increases width
      // For right panel, moving left increases width
      const multiplier = side === 'left' ? 1 : -1;
      const newWidth = startWidthRef.current + deltaX * multiplier;
      const constrainedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);

      setWidth(constrainedWidth);
      onWidthChange?.(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minWidth, maxWidth, side, onWidthChange]);

  return {
    width,
    isDragging,
    handleMouseDown,
  };
}
