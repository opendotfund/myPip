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

type AppView = 'initial' | 'refinement';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [refinementPrompt, setRefinementPrompt] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<ModelId>(ModelId.GEMINI_FLASH);
  const [generatedCode, setGeneratedCode] = useState<string>('// Code will appear here once generated...');
  const [previewHtml, setPreviewHtml] = useState<string>('<div class="w-full h-full flex items-center justify-center text-neutral-400 p-4 text-center"><p>App preview will appear here after you describe your app.</p></div>');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('initial');
  const [freePromptsRemaining, setFreePromptsRemaining] = useState<number>(MAX_FREE_PROMPTS);
  const [chatHistory, setChatHistory] = useState<{ type: 'user' | 'ai' | 'interaction'; content: string }[]>([]);
  
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [seedName, setSeedName] = useState<string>('');
  const [seedEmail, setSeedEmail] = useState<string>('');
  const [seedFormMessage, setSeedFormMessage] = useState<string | null>(null);
  const [previewRefreshKey, setPreviewRefreshKey] = useState<number>(0);

  const [userProvidedApiKey, setUserProvidedApiKey] = useState<string | null>(null); // Added
  const [isEarlyBirdKeyApplied, setIsEarlyBirdKeyApplied] = useState<boolean>(false); // Added

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


  const handleInitialSubmit = useCallback(async () => {
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
      setCurrentView('refinement');
      if (!isEarlyBirdKeyApplied) {
        setFreePromptsRemaining(prev => Math.max(0, prev - 1));
      }
      setChatHistory([{ type: 'user', content: `Initial idea: ${prompt}` }, { type: 'ai', content: 'Initial app generated.' }]);
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

  const handleRefinementSubmit = useCallback(async () => {
    if (!refinementPrompt.trim() || !canSubmit) {
      if (!canSubmit) {
        if (isEarlyBirdKeyApplied) {
          setError('Error with Early Bird access.');
        } else {
          setError('You have used all your free prompts for refinement.');
          // Show subscription modal when user runs out of prompts
          setIsSubscriptionModalOpen(true);
        }
      } else {
        setError('Refinement prompt cannot be empty.');
      }
      return;
    }
    setIsLoading(true);
    setError(null);
    const oldCode = generatedCode;
    const oldPreview = previewHtml;

    setChatHistory(prev => [...prev, { type: 'user', content: refinementPrompt }]);

    try {
      const result = await refineAppCodeAndPreview(generatedCode, previewHtml, refinementPrompt);
      setGeneratedCode(result.swiftCode);
      setPreviewHtml(result.previewHtml);
      if (!isEarlyBirdKeyApplied) {
        setFreePromptsRemaining(prev => Math.max(0, prev - 1));
      }
      setChatHistory(prev => [...prev, { type: 'ai', content: 'App refined successfully.' }]);
      setRefinementPrompt('');
      setPreviewRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to refine content: ${errorMessage}`);
      setGeneratedCode(oldCode);
      setPreviewHtml(oldPreview);
      setChatHistory(prev => [...prev, { type: 'ai', content: `Error refining: ${errorMessage}` }]);
      setPreviewRefreshKey(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, [refinementPrompt, generatedCode, previewHtml, canSubmit, isEarlyBirdKeyApplied]);

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
      case 'user': return 'bg-amber-100 text-amber-800';
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

  const handleSeedInterestSubmit = () => {
    if (!seedName.trim() || !seedEmail.trim()) {
      setSeedFormMessage("Please enter both name and email.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(seedEmail)) {
        setSeedFormMessage("Please enter a valid email address.");
        return;
    }

    const subject = "Seed Round Interest";
    const body = `Hi Misha,\n\nI am interested in your seed round for myPip.\nCould you tell me more!\n\nThanks,\n${seedName}`;
    const mailtoLink = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailtoLink;

    setSeedFormMessage(`Thank you, ${seedName}! Your interest has been noted. If your email client didn't open, please manually send your details to ${CONTACT_EMAIL}.`);
    setSeedName('');
    setSeedEmail('');
  };

  const refreshPreview = () => {
    setPreviewRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-neutral-800 font-sans">
      <header className="p-4 border-b border-neutral-200 sticky top-0 bg-white/80 backdrop-blur-md z-20">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src="https://i.postimg.cc/L8NLxJTv/Whisk-493ff6cbcd.jpg" 
              alt="myPip Logo" 
              className="h-14 w-36 rounded"
            />
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="flex items-center px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs sm:text-sm font-medium transition-colors"
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
              <div className="text-xs sm:text-sm font-medium text-amber-700 bg-amber-100 px-2 sm:px-3 py-1 rounded-full">
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
              className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
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
          <div className="flex flex-col sm:flex-row justify-end items-end gap-3 mb-2"> {/* Changed items-center to items-end */}
             <EarlyBirdApiInput onApplyApiKey={handleApplyApiKey} isLoading={isLoading} />
             <button
                title="Connect GitHub (Coming Soon)"
                disabled
                className="flex items-center px-3 py-1.5 bg-neutral-200 text-neutral-500 rounded-md text-sm font-medium cursor-not-allowed opacity-70"
              >
                <GithubIcon className="h-4 w-4 mr-2" />
                Connect GitHub
              </button>
          </div>

          {currentView === 'initial' && (
            <div className="transition-opacity duration-500 ease-in-out">
              <h2 className="text-xl font-semibold mb-3 text-neutral-700">1. Describe Your App</h2>
              <PromptInput
                prompt={prompt}
                setPrompt={setPrompt}
                onSubmit={handleInitialSubmit}
                isLoading={isLoading}
                selectedModel={selectedModel}
                onModelChange={(modelId) => setSelectedModel(modelId as ModelId)}
                isDisabled={!canSubmit || isLoading}
                actionText="Generate App"
              />
            </div>
          )}

          {currentView === 'refinement' && (
             <div className="space-y-4 transition-opacity duration-500 ease-in-out">
                <div>
                  <h2 className="text-xl font-semibold mb-3 text-neutral-700">2. Refine Your App</h2>
                  <ChatInput
                    prompt={refinementPrompt}
                    setPrompt={setRefinementPrompt}
                    onSubmit={handleRefinementSubmit}
                    isLoading={isLoading}
                    isDisabled={!canSubmit || isLoading}
                    actionText="Refine App"
                  />
                </div>
                 {chatHistory.length > 0 && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-neutral-200 text-xs">
                    <p className="font-semibold text-neutral-600 mb-2">Refinement Log:</p>
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
                    {currentView === 'initial' ? 'Generated iOS Code (SwiftUI)' : 'Updated iOS Code (SwiftUI)'}
                </h2>
                <button
                    onClick={downloadSwiftCode}
                    disabled={isLoading || generatedCode.startsWith('//') || generatedCode.startsWith('Error:')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-300 text-white text-xs font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                    title="Download .swift file"
                >
                    Download Code
                </button>
             </div>
            <CodeDisplay code={generatedCode} />
          </div>

          {!canSubmit && currentView === 'refinement' && !isEarlyBirdKeyApplied && (
            <div className="p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md text-sm text-center">
              You've used all your free prompts. Enter an Early Bird Code for unlimited access or subscribe for unlimited prompts!
            </div>
          )}
        </div>
      </main>
      <footer className="p-4 text-center text-sm text-neutral-500 border-t border-neutral-200">
        &copy; {new Date().getFullYear()} {APP_TITLE}. All rights reserved. Contact: {CONTACT_EMAIL}
      </footer>

      {isSubscriptionModalOpen && (
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => {
            setIsSubscriptionModalOpen(false);
            setSeedFormMessage(null); 
          }}
          seedName={seedName}
          setSeedName={setSeedName}
          seedEmail={seedEmail}
          setSeedEmail={setSeedEmail}
          onSeedInterestSubmit={handleSeedInterestSubmit}
          seedFormMessage={seedFormMessage}
          contactEmail={CONTACT_EMAIL}
        />
      )}
    </div>
  );
};

export default App;
