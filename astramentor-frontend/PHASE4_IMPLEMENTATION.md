# Phase 4 Implementation: Route Protection & Session Management

## Overview
Phase 4 implements authentication middleware, client-side route guards, and session restoration for the AstraMentor frontend application.

## Completed Tasks

### Task 4.1: Next.js Middleware for Route Protection ✅
**File:** `src/middleware.ts`

- Protects routes under `/dashboard/*` and `/workspace/*`
- Redirects unauthenticated users to `/login` with return URL
- Allows public routes: `/`, `/login`, `/register`, `/callback`
- Checks for authentication token in cookies
- Runs on all routes except static files and images

**Usage:**
```typescript
// Middleware automatically runs on protected routes
// No manual configuration needed
```

### Task 4.2: AuthGuard Component for Client-Side Protection ✅
**Files:**
- `src/components/auth/AuthGuard.tsx`
- `src/lib/stores/auth-store.ts`
- `src/types/auth.ts`

**Features:**
- HOC component for wrapping protected pages
- Checks authentication state from Zustand store
- Shows loading spinner while checking auth
- Redirects to login if not authenticated
- Attempts token refresh on mount

**Usage:**
```tsx
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function ProtectedPage() {
  return (
    <AuthGuard>
      <YourProtectedContent />
    </AuthGuard>
  );
}
```

### Task 4.3: Session Restoration on Page Load ✅
**Files:**
- `src/lib/auth/session-restore.ts`
- `src/hooks/useSessionRestore.ts`
- `src/components/auth/SessionProvider.tsx`

**Features:**
- Restores session from stored tokens on app initialization
- Validates token expiry and refreshes if needed
- Handles invalid/expired tokens by clearing state
- Uses AWS Amplify's `fetchAuthSession` with force refresh
- Persists auth state to localStorage via Zustand middleware

**Usage:**
```tsx
// In root layout
import { SessionProvider } from '@/components/auth/SessionProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

## Architecture

### Authentication Flow
1. **Initial Load:**
   - `SessionProvider` runs `useSessionRestore` hook
   - Attempts to restore session from Amplify
   - Validates token expiry
   - Updates Zustand auth store

2. **Route Protection:**
   - Server-side: `middleware.ts` checks for auth cookie
   - Client-side: `AuthGuard` checks Zustand store
   - Both redirect to `/login?returnUrl=<current-path>` if unauthenticated

3. **Token Refresh:**
   - Automatic refresh when token expires within 5 minutes
   - Uses Amplify's `fetchAuthSession({ forceRefresh: true })`
   - On failure, clears state and redirects to login

### State Management
- **Zustand Store:** `useAuthStore`
  - Persists to localStorage as `auth-storage`
  - Stores: user, tokens, isAuthenticated, isLoading
  - Actions: login, logout, refreshToken, loginWithOAuth

### Type Definitions
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  preferences: UserPreferences;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}
```

## Configuration Files Created
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration with path aliases

## Next Steps
To use these components in your application:

1. **Wrap your app with SessionProvider:**
   ```tsx
   // src/app/layout.tsx
   import { SessionProvider } from '@/components/auth/SessionProvider';
   
   export default function RootLayout({ children }) {
     return (
       <SessionProvider>
         {children}
       </SessionProvider>
     );
   }
   ```

2. **Protect dashboard routes:**
   ```tsx
   // src/app/(dashboard)/layout.tsx
   import { AuthGuard } from '@/components/auth/AuthGuard';
   
   export default function DashboardLayout({ children }) {
     return (
       <AuthGuard>
         {children}
       </AuthGuard>
     );
   }
   ```

3. **Configure AWS Amplify:**
   - Ensure environment variables are set in `.env.local`
   - Initialize Amplify in root layout with `amplifyConfig`

## Testing Recommendations
1. Test middleware redirects for protected routes
2. Test AuthGuard with authenticated/unauthenticated states
3. Test session restoration with valid/expired tokens
4. Test token refresh flow
5. Test logout and state clearing

## Dependencies
- `@aws-amplify/auth` ^6.19.1
- `@aws-amplify/core` ^6.16.1
- `zustand` ^5.0.11
- `next` 14.2.18

## Notes
- OAuth implementation is stubbed and will be completed in Phase 3 (Task 3.6)
- User preferences are currently hardcoded and will be loaded from backend API later
- Token expiry is set to 1 hour by default
- Middleware only checks cookie-based tokens; localStorage tokens are checked by AuthGuard
