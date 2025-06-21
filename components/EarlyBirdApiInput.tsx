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
  const [showInput, setShowInput] = useState<boolean>(false);

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
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-800">Early Bird Access</h3>
            <p className="text-xs text-amber-600">Unlimited prompts & priority features</p>
          </div>
        </div>
        {!showInput && (
          <button
            onClick={() => setShowInput(true)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
          >
            Enter Code
          </button>
        )}
      </div>

      {showInput && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="text" 
              id="early-bird-code"
              value={earlyBirdCode}
              onChange={(e) => {
                setEarlyBirdCode(e.target.value);
                setIsValidCode(false); // Reset validation on input change
              }}
              placeholder="Enter your Early Bird code"
              className={`w-full p-3 pr-12 border rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                isValidCode 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                  : 'bg-white border-amber-300 text-neutral-800 placeholder-amber-500/70'
              }`}
              disabled={isLoading}
              aria-label="Early Bird Code Input"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {isValidCode ? (
                <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              type="submit"
              disabled={isLoading || !earlyBirdCode.trim()}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-semibold rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2 text-white" />
                  Verifying...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Activate Unlimited Access
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInput(false);
                setEarlyBirdCode('');
                setIsValidCode(false);
              }}
              className="px-3 py-2 text-amber-600 hover:text-amber-800 text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!showInput && (
        <div className="text-xs text-amber-600 bg-amber-100/50 p-2 rounded border border-amber-200">
          <p className="font-medium">💎 Early Bird Benefits:</p>
          <ul className="mt-1 space-y-0.5">
            <li>• Unlimited AI prompts</li>
            <li>• Priority feature access</li>
            <li>• Direct roadmap input</li>
            <li>• Foundational supporter status</li>
          </ul>
        </div>
      )}
    </div>
  );
};
