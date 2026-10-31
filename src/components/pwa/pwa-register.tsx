'use client';

import { useEffect } from 'react';

/**
 * PWA Service Worker Registration Component
 * Registers /sw.js safely on the client side after the page mounts.
 * Strictly non-blocking, zero DOM footprint.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerSw = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Check for updates periodically or on navigation
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content available, active worker will update on next navigation
                  console.log('[CRMate PWA] New version installed and ready.');
                } else {
                  console.log('[CRMate PWA] Content cached for offline use.');
                }
              }
            });
          }
        });

        console.log('[CRMate PWA] Service Worker registered with scope:', registration.scope);
      } catch (error) {
        console.warn('[CRMate PWA] Service Worker registration failed:', error);
      }
    };

    registerSw();
  }, []);

  return null;
}
