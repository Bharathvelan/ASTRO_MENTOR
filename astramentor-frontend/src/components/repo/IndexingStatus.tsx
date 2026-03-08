'use client';

import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface IndexingStatusProps {
  status: 'completed' | 'failed';
  error?: string;
  repoId?: string;
  onRetry?: () => void;
}

/**
 * IndexingStatus - Displays indexing completion or error state
 * 
 * Shows success message when indexing completes.
 * Displays error message with retry option on failure.
 * Enables navigation to workspace and graph features.
 * 
 * Requirements: 2.4, 2.5
 */
export function IndexingStatus({ status, error, repoId, onRetry }: IndexingStatusProps) {
  const router = useRouter();

  if (status === 'completed') {
    return (
      <Card className="border-green-500 bg-green-50 p-6 dark:bg-green-950/20">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-8 w-8" />
            <div>
              <h3 className="font-semibold">Indexing Complete!</h3>
              <p className="text-sm">Your repository has been successfully analyzed</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => router.push('/dashboard/workspace')}
              className="flex-1"
            >
              Open Workspace
            </Button>
            <Button
              onClick={() => router.push('/dashboard/graph')}
              variant="outline"
              className="flex-1"
            >
              View Knowledge Graph
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (status === 'failed') {
    return (
      <Card className="border-destructive p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <XCircle className="h-8 w-8 flex-shrink-0 text-destructive" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive">Indexing Failed</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {error || 'An error occurred while indexing your repository'}
              </p>
            </div>
          </div>

          <div className="rounded-md bg-muted p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-600" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium">Common issues:</p>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  <li>Repository archive is corrupted</li>
                  <li>Unsupported file formats</li>
                  <li>Repository is too large</li>
                  <li>Network connection issues</li>
                </ul>
              </div>
            </div>
          </div>

          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="w-full">
              Retry Indexing
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return null;
}
