'use client';

import { useState, useCallback, DragEvent, ChangeEvent } from 'react';

interface FileUploaderProps {
  onFileLoaded: (content: string, filename: string) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

export default function FileUploader({ onFileLoaded, onError, isLoading = false }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file: File): boolean => {
    if (!file.name.endsWith('.sld')) {
      onError('Invalid file type. Please upload a .sld file.');
      return false;
    }
    return true;
  };

  const readFile = async (file: File) => {
    try {
      const content = await file.text();
      onFileLoaded(content, file.name);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to read file';
      onError(`Error reading file: ${errorMessage}`);
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) {
      onError('No file selected.');
      return;
    }

    if (!validateFile(file)) {
      return;
    }

    readFile(file);
  };

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [onFileLoaded, onError]
  );

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [onFileLoaded, onError]
  );

  const handleClick = () => {
    if (!isLoading) {
      document.getElementById('file-input')?.click();
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={isLoading ? -1 : 0}
      aria-label="Upload slideshow file. Click to browse or drag and drop a .sld file"
      aria-disabled={isLoading}
      onKeyDown={(e) => {
        if (!isLoading && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`
        relative flex flex-col items-center justify-center
        min-h-[300px] p-8
        border-2 border-dashed rounded-lg
        transition-all duration-200 ease-in-out
        cursor-pointer
        ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-500'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        id="file-input"
        type="file"
        accept=".sld"
        onChange={handleFileInput}
        className="hidden"
        disabled={isLoading}
        aria-label="Choose slideshow file"
      />

      {isLoading ? (
        <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Processing file...</p>
        </div>
      ) : (
        <>
          {/* Upload Icon */}
          <svg
            className="w-16 h-16 mb-4 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          {/* Instruction Text */}
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Drop .sld file here or click to browse
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload your slideshow file to get started
            </p>
          </div>

          {/* File Type Badge */}
          <div className="mt-4 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              .sld files only
            </span>
          </div>
        </>
      )}
    </div>
  );
}
