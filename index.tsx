
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global capture for PWA Install Prompt
// This ensures we catch the event even if it fires before React finishes mounting
// @ts-ignore
window.deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  // @ts-ignore
  window.deferredPrompt = e;
  console.log("Global: beforeinstallprompt captured");
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
