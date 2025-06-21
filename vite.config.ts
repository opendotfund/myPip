import path from 'path';
import { defineConfig } from 'vite';
import { HARDCODED_API_KEY } from './constants';

export default defineConfig(() => {
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(HARDCODED_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(HARDCODED_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
