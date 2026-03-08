import { Suspense } from 'react';
import { VerifyForm } from '@/components/auth/VerifyForm';

export const metadata = {
  title: 'Verify Account - AstraMentor',
  description: 'Enter your verification code to confirm your account',
};

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Check Your Email</h1>
          <p className="text-sm text-muted-foreground">
            We sent you a verification code to confirm your account
          </p>
        </div>
        <Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}>
          <VerifyForm />
        </Suspense>
        <p className="text-center text-sm text-muted-foreground">
          Already verified?{' '}
          <a href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
