import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { EARLY_BIRD_CODE } from '../constants';

interface EarlyBirdApiInputProps {
  onApplyApiKey: (apiKey: string) => Promise<void>;
  isLoading: boolean;
}

export const EarlyBirdApiInput: React.FC<EarlyBirdApiInputProps> = ({ onApplyApiKey, isLoading }) => {
  const [earlyBirdCode, setEarlyBirdCode] = useState<string>('');
  const [isValidCode, setIsValidCode] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!earlyBirdCode.trim() || isLoading) return;
    
    // Validate the early bird code
    if (earlyBirdCode.trim().toUpperCase() === EARLY_BIRD_CODE) {
      setIsValidCode(true);
      // Pass the hardcoded API key to the parent component
      onApplyApiKey('EARLY_BIRD_ACCESS_GRANTED');
    } else {
      setIsValidCode(false);
      // Clear the input on invalid code
      setEarlyBirdCode('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <label 
        htmlFor="early-bird-code" 
        className="text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors duration-150 whitespace-nowrap"
      >
        Early Bird Code:
      </label>
      <input
        type="text" 
        id="early-bird-code"
        value={earlyBirdCode}
        onChange={(e) => {
          setEarlyBirdCode(e.target.value);
          setIsValidCode(false); // Reset validation on input change
        }}
        placeholder="Enter Early Bird Code"
        className={`flex-grow p-1.5 border rounded-md text-sm text-neutral-800 placeholder-amber-500/70 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-colors duration-150 disabled:opacity-70 ${
          isValidCode 
            ? 'bg-emerald-50 border-emerald-300' 
            : 'bg-amber-50 border-amber-300'
        }`}
        disabled={isLoading}
        aria-label="Early Bird Code Input"
      />
      <button
        type="submit"
        disabled={isLoading || !earlyBirdCode.trim()}
        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-xs font-semibold rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 focus:ring-offset-white"
      >
        {isLoading ? <LoadingSpinner className="h-4 w-4 text-white" /> : 'Apply'}
      </button>
    </form>
  );
};
