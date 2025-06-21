import React, { useState, useRef, useEffect } from 'react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading && !isDisabled) {
        onSubmit();
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getModelConfig = (modelId: ModelId) => {
    switch (modelId) {
      case ModelId.GEMINI_FLASH:
        return {
          bgColor: 'bg-gradient-to-r from-blue-500 to-purple-600',
          borderColor: 'border-blue-400',
          textColor: 'text-white',
          icon: '🤖',
          description: 'Fast & Powerful'
        };
      case ModelId.CLAUDE:
        return {
          bgColor: 'bg-gradient-to-r from-orange-500 to-red-500',
          borderColor: 'border-orange-400',
          textColor: 'text-white',
          icon: '🧠',
          description: 'Coming Soon'
        };
      case ModelId.CHATGPT:
        return {
          bgColor: 'bg-gradient-to-r from-green-500 to-emerald-600',
          borderColor: 'border-green-400',
          textColor: 'text-white',
          icon: '💬',
          description: 'Coming Soon'
        };
      default:
        return {
          bgColor: 'bg-gray-500',
          borderColor: 'border-gray-400',
          textColor: 'text-white',
          icon: '❓',
          description: 'Unknown'
        };
    }
  };

  const selectedModelConfig = getModelConfig(selectedModel);
  const selectedModelData = AI_MODELS.find(model => model.id === selectedModel);

  return (
    <div className="space-y-3">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g., A simple todo list app with a button to add tasks..."
        className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-neutral-800 placeholder-neutral-400 min-h-[120px] resize-none disabled:opacity-70 disabled:cursor-not-allowed"
        rows={5}
        disabled={isLoading || isDisabled}
        aria-label="App description prompt"
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:w-auto" ref={dropdownRef}>
          {/* Custom Dropdown Button */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={isLoading || isDisabled}
            className={`w-full sm:w-64 flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70 disabled:cursor-not-allowed ${selectedModelConfig.bgColor} ${selectedModelConfig.borderColor} ${selectedModelConfig.textColor} hover:shadow-lg`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">{selectedModelConfig.icon}</span>
              <div className="text-left">
                <div className="font-semibold text-sm">{selectedModelData?.name}</div>
                <div className="text-xs opacity-80">{selectedModelConfig.description}</div>
              </div>
            </div>
            <svg 
              className={`w-5 h-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute z-50 w-full sm:w-64 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
              {AI_MODELS.map((model) => {
                const modelConfig = getModelConfig(model.id);
                const isSelected = model.id === selectedModel;
                const isAvailable = model.available;
                
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      if (isAvailable) {
                        onModelChange(model.id);
                        setIsDropdownOpen(false);
                      }
                    }}
                    disabled={!isAvailable}
                    className={`w-full p-3 flex items-center space-x-3 transition-all duration-150 hover:bg-gray-50 ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className="text-xl">{modelConfig.icon}</span>
                    <div className="text-left flex-1">
                      <div className={`font-semibold text-sm ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                {model.name}
                      </div>
                      <div className={`text-xs ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                        {modelConfig.description}
                      </div>
                    </div>
                    {isSelected && (
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {!isAvailable && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
          )}
        </div>
        <button
          onClick={onSubmit}
          disabled={isLoading || isDisabled || !prompt.trim()}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-neutral-400 disabled:text-neutral-100 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
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
