import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Debug logging
  console.log('Build Mode:', mode);
  console.log('Available env variables:', Object.keys(env).filter(key => key.startsWith('VITE_')));
  console.log('Supabase key exists:', !!env.VITE_SUPABASE_ANON_KEY);
  console.log('Google email exists:', !!env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL);
  console.log('Google key exists:', !!env.VITE_GOOGLE_PRIVATE_KEY);

  // Validate required environment variables
  const requiredEnvVars = [
    'VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'VITE_GOOGLE_PRIVATE_KEY',
    'VITE_SUPABASE_ANON_KEY' // Added for comparison
  ];

  for (const envVar of requiredEnvVars) {
    if (!env[envVar]) {
      console.warn(`Warning: ${envVar} is not set. This may cause issues in production.`);
    }
  }

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Make env variables available at build time
      __VITE_ENV_VARS__: JSON.stringify({
        VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL: env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL,
        VITE_GOOGLE_PRIVATE_KEY: env.VITE_GOOGLE_PRIVATE_KEY,
        VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY
      })
    }
  };
});