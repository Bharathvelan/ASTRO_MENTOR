import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js middleware - minimal configuration
 *
 * Route protection is handled entirely by the client-side AuthGuard component
 * which uses fetchAuthSession() from AWS Amplify as the ground truth.
 *
 * We keep this file only for future extensibility (e.g. i18n, A/B testing).
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
