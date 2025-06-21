
import React from 'react';
import { ModelId, ModelOption } from '../types';
import { AI_MODELS } from '../constants';
import { SendIcon } from './icons/SendIcon';
import { LoadingSpinner } from './LoadingSpinner';

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  selectedModel: ModelId;
  onModelChange: (modelId: string) => void;
  isDisabled?: boolean;
  actionText?: string;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  prompt,
  setPrompt,
  onSubmit,
  isLoading,
  selectedModel,
  onModelChange,
  isDisabled = false,
  actionText = "Generate App"
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
    <div className="space-y-3">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g., A simple todo list app with a button to add tasks..."
        className="w-full p-3 bg-amber-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-neutral-800 placeholder-neutral-400 min-h-[120px] resize-none disabled:opacity-70 disabled:cursor-not-allowed"
        rows={5}
        disabled={isLoading || isDisabled}
        aria-label="App description prompt"
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:w-auto">
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={isLoading || isDisabled}
            className="w-full appearance-none bg-amber-50 border border-neutral-300 text-neutral-800 py-2.5 px-3 pr-8 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            aria-label="Select AI Model"
          >
            {AI_MODELS.map((model: ModelOption) => (
              <option key={model.id} value={model.id} disabled={!model.available} className={model.available ? "text-neutral-800" : "text-neutral-400"}>
                {model.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
        <button
          onClick={onSubmit}
          disabled={isLoading || isDisabled || !prompt.trim()}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-400 disabled:text-neutral-100 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75"
        >
          {isLoading ? (
            <>
              <LoadingSpinner className="h-5 w-5 mr-2 text-white" />
              Generating...
            </>
          ) : (
            <>
              <SendIcon className="h-5 w-5 mr-2" />
              {actionText}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
