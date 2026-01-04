'use client';

import { useRouter } from 'next/navigation';
import { useSlideshow } from '@/context';
import type { Artifact } from '@/lib/chat/types';

// Icons
function PlayIcon({ className }: { className?: string }) {
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
        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
      />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
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
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

interface ArtifactActionsProps {
  artifact: Artifact | null;
}

export function ArtifactActions({ artifact }: ArtifactActionsProps) {
  const router = useRouter();
  const { setSlideshow } = useSlideshow();

  const handlePresent = () => {
    if (artifact?.slideshow) {
      setSlideshow(artifact.slideshow);
      router.push('/present');
    }
  };

  const handleDownload = () => {
    if (!artifact) return;

    const blob = new Blob([artifact.sldContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${artifact.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.sld`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isDisabled = !artifact || !artifact.slideshow;

  return (
    <div className="artifact-panel__actions">
      <button
        className="artifact-action-button artifact-action-button--primary"
        onClick={handlePresent}
        disabled={isDisabled}
      >
        <PlayIcon className="w-4 h-4" />
        <span>Present</span>
      </button>
      <button
        className="artifact-action-button artifact-action-button--secondary"
        onClick={handleDownload}
        disabled={!artifact}
      >
        <DownloadIcon className="w-4 h-4" />
        <span>Download</span>
      </button>
    </div>
  );
}

export default ArtifactActions;
