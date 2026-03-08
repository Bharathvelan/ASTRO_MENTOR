'use client';

import { useEffect } from 'react';
import { Loader2, FileCode } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useRepoStatus } from '@/lib/query/hooks';

interface IndexingProgressProps {
  repoId: string;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * IndexingProgress - Displays repository indexing progress
 * 
 * Polls repo status every 2 seconds and displays progress bar.
 * Shows current file being indexed.
 * 
 * Requirements: 2.2, 2.3
 */
export function IndexingProgress({ repoId, onComplete, onError }: IndexingProgressProps) {
  const { data: status, error, isLoading } = useRepoStatus(repoId, {
    refetchInterval: 2000, // Poll every 2 seconds
    enabled: !!repoId,
  });

  useEffect(() => {
    if (status?.status === 'completed') {
      onComplete?.();
    } else if (status?.status === 'failed') {
      onError?.(new Error('Indexing failed'));
    }
  }, [status, onComplete, onError]);

  useEffect(() => {
    if (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to fetch status'));
    }
  }, [error, onError]);

  if (isLoading && !status) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading status...</p>
        </div>
      </Card>
    );
  }

  const progress = status?.progress || 0;
  const currentFile = status?.currentFile || '';
  const filesProcessed = status?.fileCount || 0;
  const totalFiles = status?.fileCount || 0;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <div className="flex-1">
            <h3 className="font-semibold">Indexing Repository</h3>
            <p className="text-sm text-muted-foreground">
              Analyzing your code structure...
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Files processed */}
        {totalFiles > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Files processed</span>
            <span className="font-medium">
              {filesProcessed} / {totalFiles}
            </span>
          </div>
        )}

        {/* Current file */}
        {currentFile && (
          <div className="flex items-start gap-2 rounded-md bg-muted p-3">
            <FileCode className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Currently indexing:</p>
              <p className="truncate text-sm font-mono">{currentFile}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
