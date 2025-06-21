import React from 'react';
import { SendIcon } from './icons/SendIcon';
import { LoadingSpinner } from './LoadingSpinner';

interface ChatInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isDisabled?: boolean;
  actionText?: string;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  prompt,
  setPrompt,
  onSubmit,
  isLoading,
  isDisabled = false,
  actionText = "Send",
  placeholder = "e.g., Change the background color to blue, add a title..."
}) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading && !isDisabled) {
        onSubmit();
      }
    }
  };

  return (
    <div className="flex items-start space-x-2">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-grow p-3 bg-amber-50 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-neutral-800 placeholder-neutral-400 resize-none disabled:opacity-70 disabled:cursor-not-allowed"
        rows={2}
        disabled={isLoading || isDisabled}
        aria-label="Refinement prompt"
      />
      <button
        onClick={onSubmit}
        disabled={isLoading || isDisabled || !prompt.trim()}
        className="flex-shrink-0 flex items-center justify-center px-5 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-400 disabled:text-neutral-100 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75 h-[58px]" // Match typical textarea height with padding
        title={actionText}
      >
        {isLoading ? (
          <LoadingSpinner className="h-5 w-5 text-white" />
        ) : (
          <SendIcon className="h-5 w-5" />
        )}
        <span className="sr-only">{actionText}</span>
      </button>
    </div>
  );
};
