'use client';

import type { Artifact } from '@/lib/chat/types';

interface ArtifactSelectorProps {
  artifacts: Artifact[];
  currentArtifactId: string | null;
  onSelect: (artifactId: string) => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function ArtifactSelector({ artifacts, currentArtifactId, onSelect }: ArtifactSelectorProps) {
  if (artifacts.length === 0) {
    return (
      <div
        className="artifact-selector"
        style={{
          color: 'var(--color-text-muted)',
          cursor: 'default',
          backgroundImage: 'none',
        }}
      >
        No presentations yet
      </div>
    );
  }

  return (
    <select
      className="artifact-selector"
      value={currentArtifactId || ''}
      onChange={(e) => onSelect(e.target.value)}
      aria-label="Select presentation"
    >
      {artifacts.map((artifact) => (
        <option key={artifact.id} value={artifact.id}>
          {artifact.title} ({formatTime(artifact.createdAt)})
        </option>
      ))}
    </select>
  );
}

export default ArtifactSelector;
