
import React from 'react';

export enum ModelId {
  GEMINI_FLASH = 'gemini-2.5-flash-preview-04-17',
  CLAUDE = 'claude',
  CHATGPT = 'chatgpt',
}

export interface ModelOption {
  id: ModelId;
  name: string;
  available: boolean;
}

export interface GeminiResponse {
  swiftCode: string;
  previewHtml: string;
}

// If this custom element were used in multiple places, a more central location
// or a different approach to ensuring global type visibility might be needed,
// potentially involving tsconfig.json adjustments.
// The declaration for 'stripe-buy-button' is now in stripe.d.ts.
