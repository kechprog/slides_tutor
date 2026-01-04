'use client';

import { EXAMPLE_PROMPTS } from '@/lib/chat/types';

// Sparkles Icon
function SparklesIcon({ className }: { className?: string }) {
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
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  );
}

interface ExamplePromptsProps {
  onPromptSelect: (prompt: string) => void;
}

export function ExamplePrompts({ onPromptSelect }: ExamplePromptsProps) {
  return (
    <div className="empty-state">
      <SparklesIcon className="empty-state__icon" />
      <h2 className="empty-state__title">Create a Presentation</h2>
      <p className="empty-state__description">
        Describe what you want to present and I&apos;ll generate narrated slides for you.
      </p>

      <div className="example-prompts">
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example.title}
            className="example-prompt"
            onClick={() => onPromptSelect(example.prompt)}
          >
            <div className="example-prompt__title">{example.title}</div>
            <div className="example-prompt__description">{example.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ExamplePrompts;
