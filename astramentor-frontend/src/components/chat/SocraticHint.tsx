'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Lightbulb, Eye } from 'lucide-react';

interface SocraticHintProps {
  currentHint: number;
  totalHints: number;
  onNextHint: () => void;
  onShowSolution: () => void;
  isLoading?: boolean;
  className?: string;
}

export function SocraticHint({
  currentHint,
  totalHints,
  onNextHint,
  onShowSolution,
  isLoading = false,
  className,
}: SocraticHintProps) {
  const hasMoreHints = currentHint < totalHints;
  const allHintsShown = currentHint >= totalHints;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Socratic Mode Active
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Hint {currentHint} of {totalHints}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {hasMoreHints && (
          <Button
            onClick={onNextHint}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Show Next Hint
          </Button>
        )}

        {allHintsShown && (
          <Button
            onClick={onShowSolution}
            disabled={isLoading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            <Eye className="w-4 h-4 mr-2" />
            Show Solution
          </Button>
        )}
      </div>
    </div>
  );
}
