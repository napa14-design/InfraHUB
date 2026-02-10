
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { logger } from './utils/logger';

logger.log('[Index] Starting application...');

// Global capture for PWA Install Prompt
// This ensures we catch the event even if it fires before React finishes mounting
// @ts-ignore
window.deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // We do NOT call e.preventDefault() here.
  // This allows the browser (especially Chrome on Android) to show its native
  // "Add to Home Screen" mini-infobar automatically if criteria are met.
  
  // We still stash the event so it can be triggered later if the user dismisses the native prompt but clicks a button later.
  // @ts-ignore
  window.deferredPrompt = e;
  logger.log("Global: beforeinstallprompt captured (Native prompt allowed)");
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  logger.error('[Index] FATAL: Could not find root element');
  throw new Error("Could not find root element to mount to");
}

logger.log('[Index] Root element found, mounting React...');
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
logger.log('[Index] Render called.');
