'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Info } from 'lucide-react';

const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const validated = loginSchema.parse(formData);

      await login(validated.email, validated.password);

      toast({
        title: '✅ Welcome back!',
        description: IS_DEV_MODE ? 'Signed in (dev mode).' : 'Logged in successfully.',
      });

      // Force full page reload so AuthGuard + middleware see the new cookie
      const returnUrl = searchParams.get('returnUrl') || '/dashboard';
      window.location.href = returnUrl;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        // Map Cognito error codes to human-friendly messages
        const cognitoError = error as { name?: string; message?: string };
        let description = 'Sign in failed. Please check your credentials and try again.';

        if (cognitoError?.name === 'UserNotConfirmedException') {
          description = 'Please check your email and confirm your account before signing in.';
        } else if (cognitoError?.name === 'UserNotFoundException') {
          description = 'No account found with that email. Please register first.';
        } else if (cognitoError?.name === 'NotAuthorizedException') {
          description = 'Incorrect password. Please try again.';
        } else if (
          cognitoError?.name === 'PasswordResetRequiredException' ||
          cognitoError?.name === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED' ||
          cognitoError?.name === 'RESET_PASSWORD'
        ) {
          description = 'A password reset is required. Please reset your password first.';
        } else if (IS_DEV_MODE) {
          // In dev mode this should never happen — surface raw error for debugging
          description = `Dev auth error: ${cognitoError?.message || 'Unknown error'}`;
        }

        console.error('Login error:', error);
        toast({
          title: '❌ Sign In Failed',
          description,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Dev mode banner */}
      {IS_DEV_MODE && (
        <div className="flex items-start gap-2 rounded-md border border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            <strong>Dev Mode:</strong> Use any email + any password (≥8 chars) to sign in.
            No AWS account needed.
          </span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={isLoading}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-red-500">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          disabled={isLoading}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-red-500">
            {errors.password}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Signing in…' : 'Sign In'}
      </Button>
    </form>
  );
}
