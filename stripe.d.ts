// This file declares the 'stripe-buy-button' custom element for TypeScript's JSX understanding.

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-buy-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'buy-button-id': string;
        'publishable-key': string;
      }, HTMLElement>;
    }
  }
}

// This export makes the file a module, allowing global augmentation.
export {};
