'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSlideshow, useChat } from '@/context';
import { parseSld } from '@/lib/parser';
import { ThemeToggle } from '@/components/ThemeToggle';
import FileUploader from '@/components/FileUploader';

// Icons
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

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

function UploadIcon({ className }: { className?: string }) {
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
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { setSlideshow } = useSlideshow();
  const { addArtifact, currentConversation, createConversation } = useChat();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleLoadDemo = async () => {
    try {
      setIsLoadingDemo(true);
      const response = await fetch('/sample.sld');
      if (!response.ok) {
        throw new Error(`Failed to load demo: ${response.statusText}`);
      }

      const content = await response.text();
      const result = parseSld(content);

      if (!result.success) {
        console.error('Demo parsing failed:', result.errors);
        return;
      }

      // Set slideshow and navigate to present
      setSlideshow(result.slideshow);
      router.push('/present');
    } catch (error) {
      console.error('Failed to load demo:', error);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleFileLoaded = (content: string, filename: string) => {
    try {
      setUploadError(null);
      const result = parseSld(content);

      if (!result.success) {
        const errorMessages = result.errors
          .map((err) => `Error ${err.code} at line ${err.location.line}: ${err.message}`)
          .join('\n');
        setUploadError(errorMessages);
        return;
      }

      // Create conversation if none exists
      if (!currentConversation) {
        createConversation();
      }

      // Add as artifact to current conversation
      const title = result.slideshow.title || filename.replace('.sld', '');
      addArtifact(title, content);

      // Close modal
      setIsUploadModalOpen(false);
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while parsing the file'
      );
    }
  };

  const handleFileError = (errorMessage: string) => {
    setUploadError(errorMessage);
  };

  return (
    <>
      <header className="chat-header">
        <div className="chat-header__left">
          <button
            className="chat-header__button chat-header__button--menu"
            onClick={onMenuClick}
            aria-label="Toggle sidebar"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <span className="chat-header__logo">Slides Tutor</span>
        </div>

        <div className="chat-header__actions">
          <button
            className="chat-header__button"
            onClick={handleLoadDemo}
            disabled={isLoadingDemo}
            aria-label="Load demo presentation"
            title="Load Demo"
          >
            <PlayIcon className="w-5 h-5" />
          </button>
          <button
            className="chat-header__button"
            onClick={() => setIsUploadModalOpen(true)}
            aria-label="Upload .sld file"
            title="Upload"
          >
            <UploadIcon className="w-5 h-5" />
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div
          className="upload-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsUploadModalOpen(false);
              setUploadError(null);
            }
          }}
        >
          <div className="upload-modal">
            <div className="upload-modal__header">
              <h2 className="upload-modal__title">Upload Presentation</h2>
              <button
                className="upload-modal__close"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadError(null);
                }}
                aria-label="Close"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <FileUploader onFileLoaded={handleFileLoaded} onError={handleFileError} />
            {uploadError && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-error-bg, #fef2f2)',
                  border: '1px solid var(--color-error-border, #fecaca)',
                  borderRadius: '0.5rem',
                  color: 'var(--color-error, #dc2626)',
                  fontSize: '0.875rem',
                }}
              >
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: 0 }}>
                  {uploadError}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
