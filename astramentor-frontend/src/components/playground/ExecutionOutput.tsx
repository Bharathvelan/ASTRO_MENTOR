/**
 * ExecutionOutput Component
 * 
 * Displays code execution results with syntax highlighting, console logs,
 * error messages with line numbers, and execution metrics.
 * 
 * Requirements: 2.2, 2.3, 2.6
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ExecutionResult } from '@/types/enhanced-features';
import { AlertCircle, CheckCircle2, Clock, Database } from 'lucide-react';

interface ExecutionOutputProps {
  result: ExecutionResult | null;
  isExecuting?: boolean;
  className?: string;
}

export const ExecutionOutput: React.FC<ExecutionOutputProps> = ({
  result,
  isExecuting = false,
  className,
}) => {
  if (isExecuting) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Executing code...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Run your code to see the output here
        </p>
      </div>
    );
  }

  const hasError = !!result.error;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Status Header */}
      <div
        className={cn(
          'flex items-center justify-between p-3 border-b',
          hasError
            ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
            : 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
        )}
      >
        <div className="flex items-center gap-2">
          {hasError ? (
            <>
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-900 dark:text-red-100">
                Execution Failed
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Execution Successful
              </span>
            </>
          )}
        </div>

        {/* Execution Metrics */}
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{result.executionTime}ms</span>
          </div>
          <div className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            <span>{result.memoryUsed.toFixed(2)}MB</span>
          </div>
        </div>
      </div>

      {/* Output Content */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
        {hasError ? (
          <div className="space-y-3">
            <div className="font-mono text-sm">
              <div className="text-red-600 dark:text-red-400 font-semibold mb-2">
                Error:
              </div>
              <pre className="text-red-700 dark:text-red-300 whitespace-pre-wrap">
                {result.error}
              </pre>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Console Output */}
            {result.output && (
              <div>
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Console Output:
                </div>
                <pre className="font-mono text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700 whitespace-pre-wrap">
                  {result.output}
                </pre>
              </div>
            )}

            {!result.output && (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                No output produced
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
