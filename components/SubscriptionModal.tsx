/// <reference path="../stripe.d.ts" />

import React from 'react';
import ReactDOM from 'react-dom';
import { CloseIcon } from './icons/CloseIcon';
import { SparklesIcon } from './icons/SparklesIcon';
// LoadingSpinner is not directly used by stripe-buy-button but kept if needed for other parts or future UI elements.

// The global JSX.IntrinsicElements declaration has been moved to stripe.d.ts

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactEmail: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  contactEmail
}) => {
  if (!isOpen) return null;

  // Stripe Buy Button publishable key and buy button ID from user's prompt
  const STRIPE_PUBLISHABLE_KEY = 'pk_live_51RNEpPRuiXvWcuNILcE3Z1RPY9wSWV5pw0iNpfNq7WAHHmc0jKbRfexDSVhVTtlZTp9YHiyEQ3GyLJ5MsJZp5oTf00liqNnlUR';
  const STRIPE_BUY_BUTTON_ID = 'buy_btn_1RcHY0RuiXvWcuNIJ146Crfd';

  return ReactDOM.createPortal(
    <div
        className="modal-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-modal-title"
    >
      <div
        className="modal-content bg-white p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="subscription-modal-title" className="text-2xl font-semibold text-blue-600 flex items-center">
            <SparklesIcon className="h-6 w-6 mr-2 text-blue-500" />
            Help us Grow!
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-neutral-500 hover:text-neutral-700"
            aria-label="Close modal"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-xl font-semibold text-blue-700 mb-2">Limited Time: Early Bird Elite Plan!</h3>
            <p className="text-neutral-700 mb-1">
              Become a foundational supporter of myPip and get unlimited access, priority features, and direct input on our roadmap.
            </p>
            <p className="text-3xl font-bold text-blue-600 my-3">$1000 <span className="text-lg font-normal text-neutral-600">/ Year</span></p>
            
            <div className="mt-2 w-full flex justify-center">
              <stripe-buy-button
                buy-button-id={STRIPE_BUY_BUTTON_ID}
                publishable-key={STRIPE_PUBLISHABLE_KEY}
              >
              </stripe-buy-button>
            </div>
            
             <p className="text-xs text-neutral-500 italic text-center">
              Click the button above to go to Stripe's secure checkout page.
            </p>
          </div>

          <div className="border-t border-neutral-200 pt-6">
            <h3 className="text-xl font-semibold text-neutral-700 mb-3">Interested in our Seed Round?</h3>
            <p className="text-neutral-600 mb-4">
              We're building the future of app development. Join our seed round through Dealum, the next-generation investor collaboration platform.
            </p>
            <a
              href="https://app.dealum.com/#/company/fundingroundprofile/26521/o1727cw9xv2yu27n1f0pdq2yoyqq1jnc"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              View Seed Round on Dealum
            </a>
            <p className="text-sm text-neutral-500 mt-3 text-center">
              Opens in a new tab • Powered by Dealum
            </p>
          </div>
          
          <div className="text-center text-sm text-neutral-500 mt-6 pt-4 border-t border-neutral-200">
            <p>For any questions regarding launch scope, timelines, careers, or investment opportunities, please contact us anytime at:</p>
            <a href={`mailto:${contactEmail}`} className="font-medium text-blue-600 hover:text-blue-700">
              {contactEmail}
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')!
  );
};