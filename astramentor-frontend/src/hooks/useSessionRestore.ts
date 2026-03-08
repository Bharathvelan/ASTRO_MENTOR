'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  restoreSession,
  isTokenExpired,
  clearInvalidTokens,
} from '@/lib/auth/session-restore';

/**
 * Hook to restore authentication session on app initialization
 * Validates token expiry and refreshes if needed
 * Handles invalid/expired tokens by clearing state
 */
export function useSessionRestore() {
  const [isRestoring, setIsRestoring] = useState(true);
  const { setUser, setTokens, refreshToken } = useAuthStore();

  useEffect(() => {
    const runRestore = async () => {
      try {
        // Read the hydrated state directly
        const { tokens } = useAuthStore.getState();

        // Check if we have stored tokens
        if (tokens) {
          // Validate token expiry
          if (isTokenExpired(tokens)) {
            console.log('Tokens expired, attempting refresh...');
            try {
              // Try to refresh token
              await refreshToken();
            } catch (error) {
              console.error('Token refresh failed:', error);
              // Clear invalid tokens
              clearInvalidTokens();
              setUser(null);
              setTokens(null);
            }
          }
        } else {
          // No stored tokens, try to restore from Amplify session
          const session = await restoreSession();

          if (session.isAuthenticated && session.user && session.tokens) {
            setUser(session.user);
            setTokens(session.tokens);
          } else {
            // No valid session found
            setUser(null);
            setTokens(null);
          }
        }
      } catch (error) {
        console.error('Session restoration error:', error);
        // Clear invalid state
        clearInvalidTokens();
        setUser(null);
        setTokens(null);
      } finally {
        setIsRestoring(false);
      }
    };

    // Wait for Zustand persist hydration before checking auth.
    if (useAuthStore.persist.hasHydrated()) {
      runRestore();
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => {
        unsub();
        runRestore();
      });
    }
  }, [setUser, setTokens, refreshToken]); // Run only once on mount

  return { isRestoring };
}
