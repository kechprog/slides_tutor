'use client';

import { memo } from 'react';
import { ContentNode, ContainerElement, TextNode, ImgElement } from '@/lib/parser/types';
import { HighlightStyle } from '@/lib/highlighting/types';
import { HighlightIndicator } from './HighlightIndicator';

interface SlideContentProps {
  node: ContentNode;
  path: number[];
  highlightedElementId: string | null;
  highlightStyle?: HighlightStyle;
  highlightColor?: string;
  showHighlightIndicator?: boolean;
}

const SlideContentComponent = ({
  node,
  path,
  highlightedElementId,
  highlightStyle = 'glow',
  highlightColor = '#fef08a',
  showHighlightIndicator = true,
}: SlideContentProps) => {
  // Handle text nodes
  if (node.type === 'text') {
    const textNode = node as TextNode;
    return <>{textNode.content}</>;
  }

  // Generate unique element ID from path
  const elementId = `elem-${path.join('-')}`;

  // Determine if this element should be highlighted
  const isHighlighted = elementId === highlightedElementId;

  // Build className with highlight style
  const getClassName = () => {
    const classes = ['slide-element'];
    if (isHighlighted) {
      classes.push('highlighted');
      classes.push(`highlight-${highlightStyle}`);
    }
    return classes.join(' ');
  };

  const className = getClassName();

  // CSS custom property for highlight color
  const style = isHighlighted
    ? { '--highlight-color': highlightColor } as React.CSSProperties
    : undefined;

  // ARIA attributes for highlighted elements
  const ariaProps = isHighlighted ? { 'aria-current': 'step' as const } : {};

  // Helper to wrap element with indicator if highlighted
  const wrapWithIndicator = (element: React.ReactElement) => {
    if (isHighlighted && showHighlightIndicator) {
      return (
        <div className="highlight-wrapper">
          {element}
          <HighlightIndicator color={highlightColor} />
        </div>
      );
    }
    return element;
  };

  // Handle image elements
  // Using native <img> for slideshow content that may have external URLs
  if (node.type === 'img') {
    const imgElement = node as ImgElement;
    return wrapWithIndicator(
      // eslint-disable-next-line @next/next/no-img-element
      <img
        id={elementId}
        className={className}
        style={style}
        src={imgElement.src}
        alt={imgElement.alt}
        width={imgElement.width}
        height={imgElement.height}
        {...ariaProps}
      />
    );
  }

  // Handle container elements
  const containerElement = node as ContainerElement;
  const { type, children } = containerElement;

  // Render children recursively
  const childElements = children.map((child, index) => (
    <SlideContent
      key={`${path.join('-')}-${index}`}
      node={child}
      path={[...path, index]}
      highlightedElementId={highlightedElementId}
      highlightStyle={highlightStyle}
      highlightColor={highlightColor}
      showHighlightIndicator={showHighlightIndicator}
    />
  ));

  // Map node types to appropriate HTML tags
  const props = {
    id: elementId,
    className,
    style,
    ...ariaProps,
  };

  // Create element based on type
  const createElement = () => {
    switch (type) {
      case 'div':
        return <div {...props}>{childElements}</div>;
      case 'p':
        return <p {...props}>{childElements}</p>;
      case 'h1':
        return <h1 {...props}>{childElements}</h1>;
      case 'h2':
        return <h2 {...props}>{childElements}</h2>;
      case 'h3':
        return <h3 {...props}>{childElements}</h3>;
      case 'h4':
        return <h4 {...props}>{childElements}</h4>;
      case 'h5':
        return <h5 {...props}>{childElements}</h5>;
      case 'h6':
        return <h6 {...props}>{childElements}</h6>;
      case 'ul':
        return <ul {...props}>{childElements}</ul>;
      case 'ol':
        return <ol {...props}>{childElements}</ol>;
      case 'li':
        return <li {...props}>{childElements}</li>;
      case 'blockquote':
        return <blockquote {...props}>{childElements}</blockquote>;
      case 'pre':
        return <pre {...props}>{childElements}</pre>;
      case 'span':
        return <span {...props}>{childElements}</span>;
      case 'strong':
        return <strong {...props}>{childElements}</strong>;
      case 'em':
        return <em {...props}>{childElements}</em>;
      case 'code':
        return <code {...props}>{childElements}</code>;
      default:
        // Fallback to div for unknown types
        return <div {...props}>{childElements}</div>;
    }
  };

  return wrapWithIndicator(createElement());
};

// Custom comparison function to handle array and object props
const arePropsEqual = (prevProps: SlideContentProps, nextProps: SlideContentProps): boolean => {
  // Compare highlightedElementId (simple string comparison)
  if (prevProps.highlightedElementId !== nextProps.highlightedElementId) {
    return false;
  }

  // Compare highlight settings
  if (prevProps.highlightStyle !== nextProps.highlightStyle) {
    return false;
  }
  if (prevProps.highlightColor !== nextProps.highlightColor) {
    return false;
  }
  if (prevProps.showHighlightIndicator !== nextProps.showHighlightIndicator) {
    return false;
  }

  // Compare path array (by length and each element)
  if (prevProps.path.length !== nextProps.path.length) {
    return false;
  }
  for (let i = 0; i < prevProps.path.length; i++) {
    if (prevProps.path[i] !== nextProps.path[i]) {
      return false;
    }
  }

  // Compare node object (by reference is sufficient since nodes are immutable)
  if (prevProps.node !== nextProps.node) {
    return false;
  }

  return true;
};

export const SlideContent = memo(SlideContentComponent, arePropsEqual);
