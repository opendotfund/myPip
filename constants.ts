import { ModelId, ModelOption } from './types';

export const APP_TITLE = 'myPip';

export const API_KEY_ENV_VAR = 'API_KEY'; // To make it clear where the API key comes from
export const MAX_FREE_PROMPTS = 5;
export const CONTACT_EMAIL = 'm3stastn@uwaterloo.ca';

// Hardcoded API key for the application
export const HARDCODED_API_KEY = 'AIzaSyCxC9RrXrpcUgyp0hFTWPhLaThoDgnCbxs';

// Early bird code that grants unlimited access
export const EARLY_BIRD_CODE = 'EARLYBIRD2024';

export const AI_MODELS: ModelOption[] = [
  { id: ModelId.GEMINI_FLASH, name: 'Gemini 2.5 Flash', available: true },
  { id: ModelId.CLAUDE, name: 'Claude (Coming Soon)', available: false },
  { id: ModelId.CHATGPT, name: 'ChatGPT (Coming Soon)', available: false },
];

export const GEMINI_MODEL_NAME = ModelId.GEMINI_FLASH;