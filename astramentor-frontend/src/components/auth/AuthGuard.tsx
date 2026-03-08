'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useAuthStore } from '@/lib/stores/auth-store';

function LoadingSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard — protects dashboard routes.
 *
 * Strategy (in order):
 * 1. Wait for Zustand persist to hydrate from localStorage.
 * 2. If Zustand says isAuthenticated=true AND token is non-expired → allow.
 * 3. Otherwise call fetchAuthSession() (Amplify v6) to validate.
 * 4. If both fail → redirect to /login.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, setTokens } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    console.log('[AuthGuard] Mounted. isChecking: true, isAuthorized: false');

    const runAuthCheck = async () => {
      console.log('[AuthGuard] runAuthCheck started');
      
      // ── Phase 1: Zustand persisted state ──
      const { isAuthenticated, tokens } = useAuthStore.getState();
      console.log('[AuthGuard] Phase 1 state:', { isAuthenticated, hasTokens: !!tokens });
      
      const tokenNotExpired = tokens && tokens.expiresAt > Date.now();
      console.log('[AuthGuard] Phase 1 token expired check:', { tokenNotExpired, expiresAt: tokens?.expiresAt, now: Date.now() });

      if (isAuthenticated && tokenNotExpired) {
        console.log('[AuthGuard] Phase 1 SUCCEEDED. Allowing access.');
        document.cookie = `auth_token=${tokens!.accessToken}; path=/; max-age=3600; SameSite=Lax`;
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }
      
      console.log('[AuthGuard] Phase 1 FAILED. Proceeding to Phase 2 (Amplify session).');

      // ── Phase 2: Amplify session (covers hard refresh / direct URL) ──
      try {
        console.log('[AuthGuard] Phase 2: Calling fetchAuthSession()...');
        const session = await fetchAuthSession();
        console.log('[AuthGuard] Phase 2: fetchAuthSession returned:', { hasTokens: !!session.tokens });
        
        const amplifyTokens = session.tokens;

        if (amplifyTokens?.accessToken) {
          console.log('[AuthGuard] Phase 2 SUCCEEDED. Syncing tokens to avoid future Phase 2 calls.');
          const accessToken = amplifyTokens.accessToken.toString();

          setTokens({
            accessToken,
            refreshToken: amplifyTokens.idToken?.toString() || '',
            expiresAt: Date.now() + 3600 * 1000,
          });

          const sub = amplifyTokens.accessToken.payload.sub as string;
          const email = amplifyTokens.accessToken.payload.email as string | undefined;
          setUser({
            id: sub,
            email: email || '',
            name: email ? email.split('@')[0] : 'User',
            skillLevel: 'intermediate',
            preferences: {
              theme: 'system',
              socraticMode: false,
              editorFontSize: 14,
              editorTheme: 'vs-dark',
            },
          });

          document.cookie = `auth_token=${accessToken}; path=/; max-age=3600; SameSite=Lax`;
          setIsAuthorized(true);
          setIsChecking(false);
          return;
        } else {
          console.log('[AuthGuard] Phase 2 FAILED (amplifyTokens.accessToken is falsy).');
        }
      } catch (err) {
        console.warn('[AuthGuard] Phase 2 FAILED. fetchAuthSession threw:', err);
      }

      // ── Phase 3: No valid session → redirect ──
      console.log('[AuthGuard] Phase 3: No valid session. Redirecting to login...');
      setIsChecking(false);
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
    };

    // Wait for Zustand persist hydration before checking auth.
    if (useAuthStore.persist.hasHydrated()) {
      console.log('[AuthGuard] Zustand already hydrated. Running check.');
      runAuthCheck();
    } else {
      console.log('[AuthGuard] Zustand NOT hydrated. Waiting for onFinishHydration...');
      const unsub = useAuthStore.persist.onFinishHydration(() => {
        console.log('[AuthGuard] onFinishHydration fired. Running check.');
        unsub();
        runAuthCheck();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log('[AuthGuard] Component render. isChecking:', isChecking, 'isAuthorized:', isAuthorized);

  if (isChecking) return <LoadingSpinner />;
  if (!isAuthorized) return <LoadingSpinner />;
  return <>{children}</>;
}

