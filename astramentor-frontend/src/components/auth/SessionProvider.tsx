'use client';

import { useSessionRestore } from '@/hooks/useSessionRestore';

/**
 * Loading spinner component
 */
function LoadingSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-electric-purple"></div>
        <p className="text-sm text-gray-600">Initializing session...</p>
      </div>
    </div>
  );
}

interface SessionProviderProps {
  children: React.ReactNode;
}

/**
 * SessionProvider component for app initialization
 * Restores authentication session from stored tokens on page load
 * Validates token expiry and refreshes if needed
 * Handles invalid/expired tokens by clearing state
 */
export function SessionProvider({ children }: SessionProviderProps) {
  const { isRestoring } = useSessionRestore();

  // Show loading spinner while restoring session
  if (isRestoring) {
    return <LoadingSpinner />;
  }

  // Session restored, render children
  return <>{children}</>;
}
