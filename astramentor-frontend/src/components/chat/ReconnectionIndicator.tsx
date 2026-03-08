'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ReconnectionIndicatorProps {
  isReconnecting: boolean;
  reconnectAttempts: number;
  maxAttempts: number;
  onManualReconnect: () => void;
}

export function ReconnectionIndicator({
  isReconnecting,
  reconnectAttempts,
  maxAttempts,
  onManualReconnect,
}: ReconnectionIndicatorProps) {
  if (!isReconnecting && reconnectAttempts === 0) {
    return null;
  }

  const hasReachedMaxAttempts = reconnectAttempts >= maxAttempts;

  return (
    <Alert variant={hasReachedMaxAttempts ? 'destructive' : 'default'}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {hasReachedMaxAttempts
          ? 'Connection Failed'
          : 'Reconnecting...'}
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          {hasReachedMaxAttempts
            ? 'Unable to establish connection after multiple attempts.'
            : `Attempting to reconnect (${reconnectAttempts}/${maxAttempts})...`}
        </span>
        {hasReachedMaxAttempts && (
          <Button
            size="sm"
            variant="outline"
            onClick={onManualReconnect}
            className="ml-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
