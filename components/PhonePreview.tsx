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

    // Add a small delay to ensure the HTML content is fully rendered
    const timeoutId = setTimeout(() => {
    const interactiveElements = container.querySelectorAll('[data-action-id]');
      console.log(`Found ${interactiveElements.length} interactive elements in preview`);
      
    const listenersToRemove: Array<{ el: Element, listener: (e: Event) => void }> = [];

      interactiveElements.forEach((el, index) => {
      const actionId = el.getAttribute('data-action-id');
      const actionDescription = el.getAttribute('data-action-description');
        
        console.log(`Setting up listener for element ${index}:`, { actionId, actionDescription });

      if (actionId) {
        const eventListener = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
            console.log(`Interaction detected:`, { actionId, actionDescription });
            
            // Ensure attribute still exists
          const currentActionId = el.getAttribute('data-action-id');
          const currentActionDescription = el.getAttribute('data-action-description');
          if (currentActionId) {
            onPreviewInteraction(currentActionId, currentActionDescription || currentActionId);
          }
        };
        
          // Add both click and touchstart events for better mobile support
        el.addEventListener('click', eventListener);
          el.addEventListener('touchstart', eventListener, { passive: false });
          
          // Make the element look clickable
          if (el instanceof HTMLElement) {
            el.style.cursor = 'pointer';
            el.style.userSelect = 'none';
          }
          
        listenersToRemove.push({ el, listener: eventListener });
      }
    });

    return () => {
      listenersToRemove.forEach(({ el, listener }) => {
        el.removeEventListener('click', listener);
          el.removeEventListener('touchstart', listener);
      });
      };
    }, 100); // Small delay to ensure content is rendered

    return () => {
      clearTimeout(timeoutId);
    };
  }, [htmlContent, onPreviewInteraction]); 

  return (
    <div className="bg-neutral-200 p-2 rounded-3xl shadow-2xl w-[320px] h-[650px] md:w-[350px] md:h-[700px] flex-shrink-0">
      <div className="bg-neutral-800 w-full h-full rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-5 bg-neutral-800 rounded-b-lg z-10" aria-hidden="true"></div>
        
        <div 
          ref={previewContainerRef}
          className="w-full h-full overflow-y-auto bg-white text-neutral-800 relative"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          aria-live="polite"
          style={{ 
            pointerEvents: 'auto',
            touchAction: 'manipulation'
          }}
        />
        
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-neutral-500 rounded-full" aria-hidden="true"></div>
      </div>
    </div>
  );
};
