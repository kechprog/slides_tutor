'use client';

import { useRouter } from 'next/navigation';
import { useChat, useSlideshow } from '@/context';
import { ArtifactSelector } from './ArtifactSelector';
import { ArtifactPreview } from './ArtifactPreview';
import { ArtifactActions } from './ArtifactActions';

// Expand Icon (for Present button in header)
function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
      />
    </svg>
  );
}

interface ArtifactPanelProps {
  isOpen: boolean;
  width: number;
}

export function ArtifactPanel({ isOpen, width }: ArtifactPanelProps) {
  const router = useRouter();
  const { setSlideshow } = useSlideshow();
  const { currentConversation, currentArtifact, selectArtifact } = useChat();

  const artifacts = currentConversation?.artifacts || [];

  const handlePresentClick = () => {
    if (currentArtifact?.slideshow) {
      setSlideshow(currentArtifact.slideshow);
      router.push('/present');
    }
  };

  return (
    <aside
      className={`artifact-panel ${isOpen ? 'artifact-panel--open' : ''} ${!isOpen && artifacts.length === 0 ? 'artifact-panel--hidden' : ''}`}
      style={{ width: isOpen || artifacts.length > 0 ? `${width}px` : 0 }}
    >
      <div className="artifact-panel__header">
        <div className="artifact-panel__selector">
          <ArtifactSelector
            artifacts={artifacts}
            currentArtifactId={currentArtifact?.id || null}
            onSelect={selectArtifact}
          />
        </div>
        <button
          className="artifact-panel__present-button"
          onClick={handlePresentClick}
          disabled={!currentArtifact?.slideshow}
          aria-label="Present fullscreen"
          title="Present"
        >
          <ExpandIcon className="w-5 h-5" />
        </button>
      </div>

      <ArtifactPreview artifact={currentArtifact} />
      <ArtifactActions artifact={currentArtifact} />
    </aside>
  );
}

export default ArtifactPanel;
