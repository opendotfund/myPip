import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PhonePreview } from './components/PhonePreview';
import { PromptInput } from './components/PromptInput';
import { CodeDisplay } from './components/CodeDisplay';
import { generateAppCodeAndPreview, refineAppCodeAndPreview, handleInteractionAndUpdateCodeAndPreview, setExternalApiKey } from './services/geminiService';
import { ModelId } from './types';
import { APP_TITLE, MAX_FREE_PROMPTS, CONTACT_EMAIL } from './constants';
import { GithubIcon } from './components/icons/GithubIcon';
import { ChatInput } from './components/ChatInput';
import { SubscriptionModal } from './components/SubscriptionModal';
import { RefreshIcon } from './components/icons/RefreshIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { EarlyBirdApiInput } from './components/EarlyBirdApiInput'; // Added

type AppView = 'main';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<ModelId>(ModelId.GEMINI_FLASH);
  const [generatedCode, setGeneratedCode] = useState<string>('// Code will appear here once generated...');
  const [previewHtml, setPreviewHtml] = useState<string>('<div class="w-full h-full flex items-center justify-center text-neutral-400 p-4 text-center"><p>App preview will appear here after you describe your app.</p></div>');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('main');
  const [freePromptsRemaining, setFreePromptsRemaining] = useState<number>(MAX_FREE_PROMPTS);
  const [chatHistory, setChatHistory] = useState<{ type: 'user' | 'ai' | 'interaction'; content: string }[]>([]);
  
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [previewRefreshKey, setPreviewRefreshKey] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false); // Added for mobile sidebar

  const [userProvidedApiKey, setUserProvidedApiKey] = useState<string | null>(null); // Added
  const [isEarlyBirdKeyApplied, setIsEarlyBirdKeyApplied] = useState<boolean>(false); // Added

  // Configuration modal states
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [configPlatform, setConfigPlatform] = useState<string>('');
  const [configApiKey, setConfigApiKey] = useState<string>('');

  const chatHistoryRef = useRef<HTMLDivElement>(null);

  const canSubmit = isEarlyBirdKeyApplied || freePromptsRemaining > 0; // Updated

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleApplyApiKey = useCallback(async (apiKey: string) => {
    setIsLoading(true);
    setError(null);
    
    // Check if this is an early bird access grant
    if (apiKey === 'EARLY_BIRD_ACCESS_GRANTED') {
      setUserProvidedApiKey(apiKey);
      setIsEarlyBirdKeyApplied(true);
      setError("Early Bird Code applied successfully! You now have unlimited access."); // Temporary success message
      setTimeout(() => setError(null), 3000);
    } else {
      setError("Invalid Early Bird Code. Please check your code and try again.");
      setIsEarlyBirdKeyApplied(false);
    }
    
    setIsLoading(false);
  }, []);

  const openConfigModal = (platform: string) => {
    setConfigPlatform(platform);
    setConfigApiKey('');
    setIsConfigModalOpen(true);
  };

  const handleConfigSubmit = () => {
    // Here you would typically save the API key to your backend
    console.log(`Saving ${configPlatform} API key:`, configApiKey);
    setError(`${configPlatform} API key saved successfully!`);
    setTimeout(() => setError(null), 3000);
    setIsConfigModalOpen(false);
  };

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || !canSubmit) {
      if (!canSubmit) {
        if (isEarlyBirdKeyApplied) {
          setError('Error with Early Bird access.');
        } else {
          setError('You have used all your free prompts.');
          // Show subscription modal when user runs out of prompts
          setIsSubscriptionModalOpen(true);
        }
      } else {
        setError('Prompt cannot be empty.');
      }
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedCode('// Generating Swift code...');
    setPreviewHtml('<div class="w-full h-full flex items-center justify-center text-neutral-500"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div><p class="ml-3 text-neutral-600">Generating app & preview...</p></div>');
    setChatHistory([]);

    try {
      const result = await generateAppCodeAndPreview(prompt);
      setGeneratedCode(result.swiftCode);
      setPreviewHtml(result.previewHtml);
      if (!isEarlyBirdKeyApplied) {
        setFreePromptsRemaining(prev => Math.max(0, prev - 1));
      }
      setChatHistory([{ type: 'user', content: `App idea: ${prompt}` }, { type: 'ai', content: 'App generated successfully.' }]);
      setPrompt(''); 
      setPreviewRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate content: ${errorMessage}`);
      setPreviewHtml(`<div class="w-full h-full flex flex-col items-center justify-center text-red-600 p-4 text-center"><p class="font-semibold">Error Generating Preview</p><p class="text-sm mt-2">${errorMessage}</p></div>`);
      setGeneratedCode(`// Error: ${errorMessage}`);
      setPreviewRefreshKey(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, canSubmit, isEarlyBirdKeyApplied]);

  const handlePreviewInteraction = useCallback(async (actionId: string, actionDescription: string) => {
    if (!canSubmit) {
      if (isEarlyBirdKeyApplied) {
        setError('Error with Early Bird access.');
      } else {
        setError('You have used all your free prompts for interaction-based refinement.');
        // Show subscription modal when user runs out of prompts
        setIsSubscriptionModalOpen(true);
      }
      return;
    }
    setIsLoading(true);
    setError(null);
    const oldCode = generatedCode;
    const oldPreview = previewHtml;

    const interactionLog = `User clicked "${actionDescription || actionId}" in preview.`;
    setChatHistory(prev => [...prev, { type: 'interaction', content: interactionLog }]);
    
    try {
      const result = await handleInteractionAndUpdateCodeAndPreview(generatedCode, previewHtml, actionId, actionDescription);
      setGeneratedCode(result.swiftCode);
      setPreviewHtml(result.previewHtml);
      if (!isEarlyBirdKeyApplied) {
        setFreePromptsRemaining(prev => Math.max(0, prev - 1));
      }
      setChatHistory(prev => [...prev, { type: 'ai', content: 'App updated based on preview interaction.' }]);
      setPreviewRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to update based on interaction: ${errorMessage}`);
      setGeneratedCode(oldCode);
      setPreviewHtml(oldPreview);
      setChatHistory(prev => [...prev, { type: 'ai', content: `Error processing interaction: ${errorMessage}` }]);
      setPreviewRefreshKey(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, [generatedCode, previewHtml, canSubmit, isEarlyBirdKeyApplied]);
  
  const downloadSwiftCode = () => {
    if (!generatedCode || generatedCode.startsWith('//') || generatedCode.startsWith('Error:')) {
      setError("No valid code to download.");
      return;
    }
    const blob = new Blob([generatedCode], { type: 'text/swift' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MyPipApp.swift';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getChatItemBackgroundClass = (type: 'user' | 'ai' | 'interaction') => {
    switch (type) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'ai': return 'bg-neutral-100 text-neutral-700';
      case 'interaction': return 'bg-sky-100 text-sky-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
   const getChatSpeaker = (type: 'user' | 'ai' | 'interaction') => {
    switch (type) {
      case 'user': return 'You:';
      case 'ai': return 'AI:';
      case 'interaction': return 'Preview Interaction:';
      default: return 'Log:';
    }
  };

  const refreshPreview = () => {
    setPreviewRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-neutral-800 font-sans">
      {/* Hidden Sidebar - Hidden on mobile, hover on desktop */}
      <div className={`fixed left-0 top-0 h-full transition-all duration-300 ease-in-out bg-blue-900 text-white z-30 group hidden md:block ${isSidebarOpen ? 'w-64' : 'w-16 hover:w-64'}`}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-4 border-b border-blue-800">
            <div className="flex items-center">
              <img 
                src="https://i.postimg.cc/QCGLyzyj/temp-Imagec-Se0jt.avif" 
                alt="myPip Logo" 
                className="h-8 w-8 rounded"
              />
              <span className="ml-3 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                myPip
              </span>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            {/* My Account Section */}
            <div className="space-y-1">
              <div className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  My Account
                </span>
              </div>
              <div className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Edit Profile
                </span>
              </div>
              <div className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                </svg>
                <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Settings
                </span>
              </div>
            </div>

            {/* Community Section */}
            <div className="pt-4 border-t border-blue-800">
              <div className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01 1l-1.7 2.26A6.003 6.003 0 0 0 8 16v6h2v-6c0-2.21 1.79-4 4-4s4 1.79 4 4v6h2zm-8-2v-6c0-1.1.9-2 2-2s2 .9 2 2v6h-4z"/>
                </svg>
                <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Community
                </span>
                <span className="ml-auto text-xs bg-blue-700 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Soon
                </span>
              </div>
              <div className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  My Pips
                </span>
              </div>
            </div>
            
            {/* Configuration Section */}
            <div className="pt-4 border-t border-blue-800">
              <div className="text-xs text-blue-300 mb-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Configuration
              </div>
              <div 
                onClick={() => openConfigModal('Supabase')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.29 12.29a1 1 0 0 0-1.42 0L15 16.17V4a1 1 0 0 0-2 0v12.17l-3.88-3.88a1 1 0 0 0-1.41 1.41l5.59 5.59a1 1 0 0 0 1.41 0l5.59-5.59a1 1 0 0 0 0-1.41z"/>
                </svg>
                <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Supabase
                </span>
              </div>
              
              <div 
                onClick={() => openConfigModal('Stripe')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Stripe
                </span>
              </div>
              
              <div 
                onClick={() => openConfigModal('n8n')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  n8n
                </span>
              </div>
            </div>
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-blue-800">
            <div className="flex items-center">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="ml-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Developer Tools
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-blue-900 text-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-4 border-b border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img 
                  src="https://i.postimg.cc/QCGLyzyj/temp-Imagec-Se0jt.avif" 
                  alt="myPip Logo" 
                  className="h-8 w-8 rounded"
                />
                <span className="ml-3 text-sm font-semibold">
                  myPip
                </span>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-white hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            {/* My Account Section */}
            <div className="space-y-1">
              <div className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span className="ml-3 text-sm">
                  My Account
                </span>
              </div>
              <div className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                <span className="ml-3 text-sm">
                  Edit Profile
                </span>
              </div>
              <div className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                </svg>
                <span className="ml-3 text-sm">
                  Settings
                </span>
              </div>
            </div>

            {/* Community Section */}
            <div className="pt-4 border-t border-blue-800">
              <div className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01 1l-1.7 2.26A6.003 6.003 0 0 0 8 16v6h2v-6c0-2.21 1.79-4 4-4s4 1.79 4 4v6h2zm-8-2v-6c0-1.1.9-2 2-2s2 .9 2 2v6h-4z"/>
                </svg>
                <span className="ml-3 text-sm">
                  Community
                </span>
                <span className="ml-auto text-xs bg-blue-700 px-2 py-1 rounded">
                  Soon
                </span>
              </div>
              <div className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span className="ml-3 text-sm">
                  My Pips
                </span>
              </div>
            </div>
            
            {/* Configuration Section */}
            <div className="pt-4 border-t border-blue-800">
              <div className="text-xs text-blue-300 mb-2 px-2">
                Configuration
              </div>
              <div 
                onClick={() => openConfigModal('Supabase')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.29 12.29a1 1 0 0 0-1.42 0L15 16.17V4a1 1 0 0 0-2 0v12.17l-3.88-3.88a1 1 0 0 0-1.41 1.41l5.59 5.59a1 1 0 0 0 1.41 0l5.59-5.59a1 1 0 0 0 0-1.41z"/>
                </svg>
                <span className="ml-3 text-sm">
                  Supabase
                </span>
              </div>
              
              <div 
                onClick={() => openConfigModal('Stripe')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="ml-3 text-sm">
                  Stripe
                </span>
              </div>
              
              <div 
                onClick={() => openConfigModal('n8n')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                <span className="ml-3 text-sm">
                  n8n
                </span>
              </div>
            </div>
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-blue-800">
            <div className="flex items-center">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="ml-3 text-xs">
                Developer Tools
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with left margin for sidebar */}
      <div className="ml-0 md:ml-16">
        <header className="p-4 border-b border-neutral-200 sticky top-0 bg-white/80 backdrop-blur-md z-20">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src="https://i.postimg.cc/QCGLyzyj/temp-Imagec-Se0jt.avif" 
                alt="myPip Logo" 
                className="h-14 w-36 rounded cursor-pointer md:cursor-default"
                onClick={() => setIsSidebarOpen(true)}
              />
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs sm:text-sm font-medium transition-colors"
                title="Get Unlimited Prompts & Support Us!"
              >
                <SparklesIcon className="h-4 w-4 mr-1 sm:mr-2" />
                Get Unlimited
              </button>
              {isEarlyBirdKeyApplied ? (
                <div className="text-xs sm:text-sm font-medium text-emerald-700 bg-emerald-100 px-2 sm:px-3 py-1 rounded-full">
                  Unlimited Access
                </div>
              ) : (
                <div className="text-xs sm:text-sm font-medium text-blue-700 bg-blue-100 px-2 sm:px-3 py-1 rounded-full">
                  Prompts: {freePromptsRemaining}/{MAX_FREE_PROMPTS}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-grow container mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="flex flex-col items-center justify-start md:sticky md:top-28 h-full md:h-[calc(100vh-8rem)]">
            <div className="w-full flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-neutral-700">App Preview</h2>
              <button
                onClick={refreshPreview}
                title="Refresh Preview"
                className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <RefreshIcon className="h-5 w-5" />
              </button>
            </div>
            <PhonePreview 
              htmlContent={previewHtml} 
              onPreviewInteraction={handlePreviewInteraction}
              key={previewRefreshKey} 
            />
          </div>

          <div className="flex flex-col space-y-6">
            {/* Mobile-only stacked buttons section */}
            <div className="md:hidden space-y-3">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => window.open('https://developer.apple.com/app-store/', '_blank')}
                  disabled
                  className="flex items-center px-3 py-1.5 bg-blue-200 text-blue-600 rounded-md text-sm font-medium cursor-not-allowed opacity-70 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-white"
                  title="Deploy to App Store (Coming Soon)"
                >
                  <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Deploy to App Store
                </button>
                <button
                  onClick={() => window.open('https://play.google.com/console/', '_blank')}
                  disabled
                  className="flex items-center px-3 py-1.5 bg-green-200 text-green-600 rounded-md text-sm font-medium cursor-not-allowed opacity-70 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 focus:ring-offset-white"
                  title="Deploy to Google Play Store (Coming Soon)"
                >
                  <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  Deploy to Google Play
                </button>
              </div>
              
              <div className="flex flex-col gap-2">
                <button
                  title="Connect GitHub (Coming Soon)"
                  disabled
                  className="flex items-center px-3 py-1.5 bg-neutral-200 text-neutral-500 rounded-md text-sm font-medium cursor-not-allowed opacity-70"
                >
                  <GithubIcon className="h-4 w-4 mr-2" />
                  Connect GitHub
                </button>
                
                {/* Early Bird Access - Compact version */}
                <div className="bg-gradient-to-r from-neutral-50 to-stone-50 border border-neutral-200 rounded-md p-2 shadow-sm">
                  <EarlyBirdApiInput 
                    onApplyApiKey={handleApplyApiKey} 
                    isLoading={isLoading} 
                    onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                  />
                </div>
                
                <button
                  title="Open in Xcode (Coming Soon)"
                  disabled
                  className="flex items-center px-3 py-1.5 bg-neutral-200 text-neutral-500 rounded-md text-sm font-medium cursor-not-allowed opacity-70"
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z"/>
                  </svg>
                  Open in Xcode
                </button>
              </div>
            </div>

            {/* Desktop-only horizontal layout */}
            <div className="hidden md:flex justify-between items-start gap-3 mb-2">
              {/* Left side - Deploy buttons stacked */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => window.open('https://developer.apple.com/app-store/', '_blank')}
                  disabled
                  className="flex items-center px-3 py-1.5 bg-blue-200 text-blue-600 rounded-md text-sm font-medium cursor-not-allowed opacity-70 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-white"
                  title="Deploy to App Store (Coming Soon)"
                >
                  <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Deploy to App Store
                </button>
                <button
                  onClick={() => window.open('https://play.google.com/console/', '_blank')}
                  disabled
                  className="flex items-center px-3 py-1.5 bg-green-200 text-green-600 rounded-md text-sm font-medium cursor-not-allowed opacity-70 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 focus:ring-offset-white"
                  title="Deploy to Google Play Store (Coming Soon)"
                >
                  <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  Deploy to Google Play
                </button>
              </div>

              {/* Middle - Early Bird Access */}
              <div className="bg-gradient-to-r from-neutral-50 to-stone-50 border border-neutral-200 rounded-lg p-3 shadow-sm min-w-[200px]">
                <EarlyBirdApiInput 
                  onApplyApiKey={handleApplyApiKey} 
                  isLoading={isLoading} 
                  onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                />
              </div>

              {/* Right side - Connect/Open buttons stacked */}
              <div className="flex flex-col gap-2">
                <button
                  title="Connect GitHub (Coming Soon)"
                  disabled
                  className="flex items-center px-3 py-1.5 bg-neutral-200 text-neutral-500 rounded-md text-sm font-medium cursor-not-allowed opacity-70"
                >
                  <GithubIcon className="h-4 w-4 mr-2" />
                  Connect GitHub
                </button>
                <button
                  title="Open in Xcode (Coming Soon)"
                  disabled
                  className="flex items-center px-3 py-1.5 bg-neutral-200 text-neutral-500 rounded-md text-sm font-medium cursor-not-allowed opacity-70"
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z"/>
                  </svg>
                  Open in Xcode
                </button>
              </div>
            </div>

            {currentView === 'main' && (
              <div className="transition-opacity duration-500 ease-in-out">
                <h2 className="text-xl font-semibold mb-3 text-neutral-700">Describe Your App</h2>
                <PromptInput
                  prompt={prompt}
                  setPrompt={setPrompt}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  selectedModel={selectedModel}
                  onModelChange={(modelId) => setSelectedModel(modelId as ModelId)}
                  isDisabled={!canSubmit || isLoading}
                  actionText="Generate App"
                />
                
                {chatHistory.length > 0 && (
                  <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs">
                    <p className="font-semibold text-neutral-600 mb-2">Activity Log:</p>
                    <div ref={chatHistoryRef} className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {chatHistory.map((item, index) => (
                        <div key={index} className={`p-1.5 rounded text-xs ${getChatItemBackgroundClass(item.type)}`}>
                          <strong>{getChatSpeaker(item.type)}</strong> {item.content}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {error && <div className={`p-3 border rounded-md text-sm transition-opacity duration-300 ease-in-out ${error.includes("successfully") ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-red-100 border-red-300 text-red-700'}`}>{error}</div>}
            
            <div className="mt-2">
               <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-neutral-700">
                      {currentView === 'main' ? 'Generated iOS Code (SwiftUI)' : 'Updated iOS Code (SwiftUI)'}
                  </h2>
                  <button
                      onClick={downloadSwiftCode}
                      disabled={isLoading || generatedCode.startsWith('//') || generatedCode.startsWith('Error:')}
                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-neutral-300 text-white text-xs font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                      title="Download .swift file"
                  >
                      Download Code
                  </button>
               </div>
              <CodeDisplay code={generatedCode} />
            </div>

            {!canSubmit && currentView === 'main' && !isEarlyBirdKeyApplied && (
              <div className="p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md text-sm text-center">
                You've used all your free prompts. Enter an Early Bird Code for unlimited access or subscribe for unlimited prompts!
              </div>
            )}
          </div>
        </main>
        <footer className="p-4 text-center text-sm text-neutral-500 border-t border-neutral-200">
          &copy; {new Date().getFullYear()} {APP_TITLE}. All rights reserved.
        </footer>

        {isSubscriptionModalOpen && (
          <SubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => {
              setIsSubscriptionModalOpen(false);
            }}
            contactEmail={CONTACT_EMAIL}
          />
        )}

        {/* Configuration Modal */}
        {isConfigModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsConfigModalOpen(false)}
          >
            <div
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-neutral-800">
                  Configure {configPlatform}
                </h2>
                <button
                  onClick={() => setIsConfigModalOpen(false)}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {configPlatform} API Key
                  </label>
                  <input
                    type="password"
                    value={configApiKey}
                    onChange={(e) => setConfigApiKey(e.target.value)}
                    placeholder={`Enter your ${configPlatform} API key`}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsConfigModalOpen(false)}
                    className="px-4 py-2 text-neutral-600 hover:text-neutral-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfigSubmit}
                    disabled={!configApiKey.trim()}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-neutral-300 text-white font-medium rounded-lg transition-colors"
                  >
                    Save API Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
