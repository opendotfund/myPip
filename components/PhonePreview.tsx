
import React, { useEffect, useRef } from 'react';

interface PhonePreviewProps {
  htmlContent: string;
  onPreviewInteraction: (actionId: string, actionDescription: string) => void;
}

export const PhonePreview: React.FC<PhonePreviewProps> = ({ htmlContent, onPreviewInteraction }) => {
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    // Clear previous listeners to avoid duplicates if htmlContent is somehow re-rendered without key change
    // This is more robustly handled by a key on the PhonePreview component in App.tsx if htmlContent changes
    
    const interactiveElements = container.querySelectorAll('[data-action-id]');
    const listenersToRemove: Array<{ el: Element, listener: (e: Event) => void }> = [];

    interactiveElements.forEach(el => {
      const actionId = el.getAttribute('data-action-id');
      const actionDescription = el.getAttribute('data-action-description');

      if (actionId) {
        const eventListener = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          // Ensure attribute still exists, though unlikely to change during a click
          const currentActionId = el.getAttribute('data-action-id');
          const currentActionDescription = el.getAttribute('data-action-description');
          if (currentActionId) {
            onPreviewInteraction(currentActionId, currentActionDescription || currentActionId);
          }
        };
        
        el.addEventListener('click', eventListener);
        listenersToRemove.push({ el, listener: eventListener });
      }
    });

    return () => {
      listenersToRemove.forEach(({ el, listener }) => {
        el.removeEventListener('click', listener);
      });
    };
  // Re-run if onPreviewInteraction callback changes, or htmlContent changes (though key in parent is better for htmlContent)
  }, [htmlContent, onPreviewInteraction]); 

  return (
    <div className="bg-neutral-200 p-2 rounded-3xl shadow-2xl w-[320px] h-[650px] md:w-[350px] md:h-[700px] flex-shrink-0">
      <div className="bg-neutral-800 w-full h-full rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-5 bg-neutral-800 rounded-b-lg z-10" aria-hidden="true"></div>
        
        <div 
          ref={previewContainerRef}
          className="w-full h-full overflow-y-auto bg-white text-neutral-800"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          aria-live="polite" // Announce changes in preview to assistive technologies
        />
        
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-neutral-500 rounded-full" aria-hidden="true"></div>
      </div>
    </div>
  );
};
