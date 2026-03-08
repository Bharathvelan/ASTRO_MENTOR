'use client';

import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface VerifierLoadingProps {
  progress?: number;
  message?: string;
}

/**
 * VerifierLoading - Loading state UI for code verification
 * 
 * Displays a spinner with "Running tests..." message and optional progress indicator.
 * 
 * Requirements: 7.2
 */
export function VerifierLoading({ progress, message = 'Running tests...' }: VerifierLoadingProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="w-full space-y-2 text-center">
          <p className="text-sm font-medium">{message}</p>
          {progress !== undefined && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
