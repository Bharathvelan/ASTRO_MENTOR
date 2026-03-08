'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) return;

    setIsLoading(true);
    try {
      await confirmSignUp({ username: email, confirmationCode: code.trim() });

      toast({
        title: '✅ Account Verified!',
        description: 'Your account is confirmed. Please sign in.',
      });

      router.push('/login');
    } catch (error) {
      const err = error as { name?: string; message?: string };
      let description = 'Invalid code. Please try again.';

      if (err?.name === 'ExpiredCodeException') {
        description = 'Your code has expired. Please request a new one below.';
      } else if (err?.name === 'CodeMismatchException') {
        description = 'That code is incorrect. Check your email and try again.';
      }

      console.error('Verification error:', error);
      toast({ title: 'Verification Failed', description, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    try {
      await resendSignUpCode({ username: email });
      toast({
        title: 'Code Resent',
        description: `A new verification code has been sent to ${email}.`,
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not resend code. Try again later.', variant: 'destructive' });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-3">📧</div>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to <strong>{email || 'your email'}</strong>.
          <br />Enter it below to activate your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!email && (
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="code">Verification Code</Label>
          <Input
            id="code"
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isLoading}
            maxLength={6}
            className="text-center text-2xl tracking-widest font-mono"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || !code}>
          {isLoading ? 'Verifying...' : 'Verify Account'}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-primary hover:underline font-medium disabled:opacity-50"
          >
            {isResending ? 'Sending...' : 'Resend code'}
          </button>
        </p>
      </div>
    </div>
  );
}
