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
  seedName: string;
  setSeedName: (name: string) => void;
  seedEmail: string;
  setSeedEmail: (email: string) => void;
  onSeedInterestSubmit: () => void;
  seedFormMessage: string | null;
  contactEmail: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  seedName,
  setSeedName,
  seedEmail,
  setSeedEmail,
  onSeedInterestSubmit,
  seedFormMessage,
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
          <h2 id="subscription-modal-title" className="text-2xl font-semibold text-amber-600 flex items-center">
            <SparklesIcon className="h-6 w-6 mr-2 text-amber-500" />
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
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h3 className="text-xl font-semibold text-amber-700 mb-2">Limited Time: Early Bird Elite Plan!</h3>
            <p className="text-neutral-700 mb-1">
              Become a foundational supporter of myPip and get unlimited access, priority features, and direct input on our roadmap.
            </p>
            <p className="text-3xl font-bold text-amber-600 my-3">$1000 <span className="text-lg font-normal text-neutral-600">/ Year</span></p>
            
            <div className="mt-2 w-full flex justify-center">
              <stripe-buy-button
                buy-button-id={STRIPE_BUY_BUTTON_ID}
                publishable-key={STRIPE_PUBLISHABLE_KEY}
              >
              </stripe-buy-button>
            </div>
            
            <p className="text-sm text-neutral-600 mt-3 mb-1">
              <strong>Accepted Payments (via Stripe):</strong> Major Debit/Credit Cards, Apple Pay, Google Pay, and more.
            </p>
             <p className="text-xs text-neutral-500 italic text-center">
              Click the button above to go to Stripe's secure checkout page.
            </p>
          </div>

          <div className="border-t border-neutral-200 pt-6">
            <h3 className="text-xl font-semibold text-neutral-700 mb-3">Interested in our Seed Round?</h3>
            <p className="text-neutral-600 mb-4">
              We're building the future of app development. If you're interested in learning about seed investment opportunities, let us know!
            </p>
            <form onSubmit={(e) => { e.preventDefault(); onSeedInterestSubmit(); }} className="space-y-4">
              <div>
                <label htmlFor="seedName" className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
                <input
                  type="text"
                  id="seedName"
                  value={seedName}
                  onChange={(e) => setSeedName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-neutral-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-neutral-800 placeholder-neutral-400"
                  placeholder="Your Name"
                  required
                />
              </div>
              <div>
                <label htmlFor="seedEmail" className="block text-sm font-medium text-neutral-700 mb-1">Email Address</label>
                <input
                  type="email"
                  id="seedEmail"
                  value={seedEmail}
                  onChange={(e) => setSeedEmail(e.target.value)}
                  className="w-full p-2.5 bg-white border border-neutral-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-neutral-800 placeholder-neutral-400"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                Express Interest
              </button>
              {seedFormMessage && (
                <p className={`mt-3 text-sm ${seedFormMessage.startsWith("Thank you") ? 'text-emerald-600' : 'text-red-600'}`}>
                  {seedFormMessage}
                </p>
              )}
            </form>
          </div>
          
          <div className="text-center text-sm text-neutral-500 mt-6 pt-4 border-t border-neutral-200">
            <p>For any questions regarding launch scope, timelines, careers, or investment opportunities, please contact us anytime at:</p>
            <a href={`mailto:${contactEmail}`} className="font-medium text-amber-600 hover:text-amber-700">
              {contactEmail}
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')!
  );
};