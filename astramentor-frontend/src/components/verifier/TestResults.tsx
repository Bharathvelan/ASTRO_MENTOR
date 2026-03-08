'use client';

import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { components } from '@/types/api.generated';

type TestResult = components['schemas']['TestResult'];

interface TestResultsProps {
  results: TestResult[];
  onTestClick?: (test: TestResult) => void;
}

/**
 * TestResults - Display test results
 * 
 * Shows pass/fail status with icons, test names, and execution times.
 * 
 * Requirements: 7.3, 7.4
 */
export function TestResults({ results, onTestClick }: TestResultsProps) {
  // Group results by suite
  const groupedBySuite = results.reduce((acc, test) => {
    const suite = test.suite || 'Default Suite';
    if (!acc[suite]) {
      acc[suite] = [];
    }
    acc[suite].push(test);
    return acc;
  }, {} as Record<string, TestResult[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedBySuite).map(([suiteName, tests]) => (
        <Card key={suiteName} className="p-4">
          <h3 className="mb-3 font-semibold">{suiteName}</h3>
          <div className="space-y-2">
            {tests.map((test, testIndex) => (
              <div
                key={testIndex}
                className={`flex items-center justify-between rounded-md border p-3 transition-colors ${
                  test.status === 'failed' 
                    ? 'cursor-pointer hover:bg-destructive/5' 
                    : ''
                }`}
                onClick={() => test.status === 'failed' && onTestClick?.(test)}
              >
                <div className="flex items-center gap-3">
                  {test.status === 'passed' && (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                  )}
                  {test.status === 'failed' && (
                    <XCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
                  )}
                  {test.status === 'skipped' && (
                    <Clock className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  )}
                  <span className={`text-sm ${test.status === 'failed' ? 'font-medium' : ''}`}>
                    {test.name}
                  </span>
                </div>
                {test.duration !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {test.duration}ms
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
