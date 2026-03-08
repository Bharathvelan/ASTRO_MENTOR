'use client';

import { AlertCircle, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { components } from '@/types/api.generated';

type TestResult = components['schemas']['TestResult'];

interface FailedTestProps {
  test: TestResult;
  onNavigateToCode?: (filePath: string, line: number) => void;
}

/**
 * FailedTest - Detail view for failed tests
 * 
 * Displays failure message, stack trace with syntax highlighting,
 * and navigation to relevant code.
 * 
 * Requirements: 7.5, 7.6
 */
export function FailedTest({ test, onNavigateToCode }: FailedTestProps) {
  // Extract file path and line number from stack trace
  const extractLocation = (stackTrace?: string) => {
    if (!stackTrace) return null;
    
    // Match patterns like: at file.js:10:5 or (file.js:10:5)
    const match = stackTrace.match(/(?:at\s+)?(?:\()?([^:]+):(\d+)(?::\d+)?(?:\))?/);
    if (match) {
      return {
        filePath: match[1],
        line: parseInt(match[2], 10),
      };
    }
    return null;
  };

  const location = extractLocation(test.stackTrace);

  return (
    <Card className="border-destructive p-4">
      <div className="space-y-4">
        {/* Test name and status */}
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
          <div className="flex-1">
            <h4 className="font-semibold text-destructive">{test.name}</h4>
            {test.error && (
              <p className="mt-1 text-sm text-muted-foreground">{test.error}</p>
            )}
          </div>
        </div>

        {/* Stack trace */}
        {test.stackTrace && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium">Stack Trace:</h5>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
              <code className="text-muted-foreground">{test.stackTrace}</code>
            </pre>
          </div>
        )}

        {/* Navigate to code button */}
        {location && onNavigateToCode && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToCode(location.filePath, location.line)}
            className="w-full"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open {location.filePath}:{location.line} in Editor
          </Button>
        )}
      </div>
    </Card>
  );
}
