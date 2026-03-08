'use client';

import { CheckCircle2, XCircle, Clock, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { components } from '@/types/api.generated';

type VerifyCodeResponse = components['schemas']['VerifyCodeResponse'];

interface TestSummaryProps {
  results: VerifyCodeResponse;
}

/**
 * TestSummary - Summary statistics for test results
 * 
 * Displays total tests, passed, failed, skipped, and coverage percentage.
 * Shows success message with green checkmark when all tests pass.
 * 
 * Requirements: 7.7, 7.8
 */
export function TestSummary({ results }: TestSummaryProps) {
  const summary = results.summary;
  const total = summary?.total || 0;
  const passed = summary?.passed || 0;
  const failed = summary?.failed || 0;
  const skipped = summary?.skipped || 0;
  const coverage = summary?.coverage || 0;
  
  const allPassed = total > 0 && failed === 0 && passed === total - skipped;

  return (
    <Card className={`p-6 ${allPassed ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}`}>
      <div className="space-y-4">
        {/* Success message */}
        {allPassed && (
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-6 w-6" />
            <p className="font-semibold">All tests passed!</p>
          </div>
        )}

        {/* Statistics grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold">{total}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Passed</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{passed}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Failed</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{failed}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Skipped</span>
            </div>
            <p className="text-2xl font-bold text-muted-foreground">{skipped}</p>
          </div>
        </div>

        {/* Coverage */}
        {coverage > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Code Coverage</span>
              <span className="text-2xl font-bold">{coverage.toFixed(1)}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${coverage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
