'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUploader from '@/components/FileUploader';
import { useSlideshow } from '@/context';
import { parseSld } from '@/lib/parser';

export default function HomePage() {
  const router = useRouter();
  const { setSlideshow } = useSlideshow();
  const [error, setError] = useState<string | null>(null);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const handleFileLoaded = (content: string, _filename: string) => {
    try {
      setError(null);
      const result = parseSld(content);

      if (!result.success) {
        // Format validation errors with line numbers
        const errorMessages = result.errors
          .map((err) => `Error ${err.code} at line ${err.location.line}: ${err.message}`)
          .join('\n');
        setError(errorMessages);
        return;
      }

      // Success: set slideshow and navigate to presentation
      setSlideshow(result.slideshow);
      router.push('/present');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while parsing the file'
      );
    }
  };

  const handleFileError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleLoadDemo = async () => {
    try {
      setError(null);
      setIsLoadingDemo(true);

      // Fetch the demo slideshow
      const response = await fetch('/sample.sld');
      if (!response.ok) {
        throw new Error(`Failed to load demo: ${response.statusText}`);
      }

      const content = await response.text();
      const result = parseSld(content);

      if (!result.success) {
        // Format validation errors with line numbers
        const errorMessages = result.errors
          .map((err) => `Error ${err.code} at line ${err.location.line}: ${err.message}`)
          .join('\n');
        setError(errorMessages);
        return;
      }

      // Success: set slideshow and navigate to presentation
      setSlideshow(result.slideshow);
      router.push('/present');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while loading the demo'
      );
    } finally {
      setIsLoadingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Slides Tutor
          </h1>
          <p className="text-xl text-gray-700">
            Present narrated slideshows with interactive tutorials
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Upload a .sld file or try the demo to get started
          </p>
        </div>

        {/* File Uploader */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <FileUploader onFileLoaded={handleFileLoaded} onError={handleFileError} />
        </div>

        {/* Demo Button */}
        <div className="text-center mb-6">
          <button
            onClick={handleLoadDemo}
            disabled={isLoadingDemo}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoadingDemo ? 'Loading Demo...' : 'Load Demo Slideshow'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  Parsing Error
                </h3>
                <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono bg-red-100 p-3 rounded overflow-x-auto">
                  {error}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            How to Use
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Upload a .sld file using the uploader above, or try the demo</li>
            <li>The slideshow will be parsed and validated</li>
            <li>If successful, you&apos;ll be taken to the presentation view</li>
            <li>Use playback controls to navigate and hear narration</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
