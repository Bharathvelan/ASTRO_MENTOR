'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useVerifyCode } from '@/lib/query/hooks';
import { useEditorStore } from '@/lib/stores/editor-store';
import { PlayIcon } from 'lucide-react';
import { VerifierLoading } from './VerifierLoading';
import { TestSummary } from './TestSummary';
import { TestResults } from './TestResults';
import { FailedTest } from './FailedTest';
import type { components } from '@/types/api.generated';

type VerifyCodeResponse = components['schemas']['VerifyCodeResponse'];
type TestResult = components['schemas']['TestResult'];

/**
 * VerifierPanel - Container component for code verification
 * 
 * Displays a "Verify Code" button and shows test results after verification.
 * Connects to TanStack Query mutation for verification API calls.
 * Integrates all verifier sub-components.
 * 
 * Requirements: 7.1, 7.6
 */
export function VerifierPanel() {
  const router = useRouter();
  const { content, language } = useEditorStore();
  const [results, setResults] = useState<VerifyCodeResponse | null>(null);
  const [selectedFailedTest, setSelectedFailedTest] = useState<TestResult | null>(null);
  
  const verifyMutation = useVerifyCode({
    onSuccess: (data) => {
      setResults(data);
      setSelectedFailedTest(null);
    },
  });

  const handleVerify = () => {
    if (!content.trim()) {
      return;
    }

    verifyMutation.mutate({
      code: content,
      language: language || 'javascript',
    });
  };

  const handleNavigateToCode = (filePath: string, line: number) => {
    // Navigate to workspace with file and line number
    router.push(`/dashboard/workspace?file=${encodeURIComponent(filePath)}&line=${line}`);
  };

  const handleTestClick = (test: TestResult) => {
    if (test.status === 'failed') {
      setSelectedFailedTest(test);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header with Verify Code button */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Code Verification</h2>
          <Button
            onClick={handleVerify}
            disabled={verifyMutation.isPending || !content.trim()}
            size="sm"
          >
            {verifyMutation.isPending ? (
              <>
                <PlayIcon className="mr-2 h-4 w-4" />
                Running...
              </>
            ) : (
              <>
                <PlayIcon className="mr-2 h-4 w-4" />
                Verify Code
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-auto p-4">
        {/* Loading state */}
        {verifyMutation.isPending && (
          <VerifierLoading message="Running tests..." />
        )}

        {/* Error state */}
        {verifyMutation.isError && (
          <Card className="border-destructive p-6">
            <div className="text-center">
              <p className="font-semibold text-destructive">Verification Failed</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {verifyMutation.error?.message || 'An error occurred while verifying code'}
              </p>
              <Button
                onClick={handleVerify}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </Card>
        )}

        {/* Results display */}
        {results && !verifyMutation.isPending && (
          <div className="space-y-4">
            {/* Summary statistics */}
            <TestSummary results={results} />

            {/* Selected failed test detail */}
            {selectedFailedTest && (
              <FailedTest 
                test={selectedFailedTest}
                onNavigateToCode={handleNavigateToCode}
              />
            )}

            {/* Test results */}
            {results.results && results.results.length > 0 && (
              <TestResults 
                results={results.results}
                onTestClick={handleTestClick}
              />
            )}
          </div>
        )}

        {/* Empty state */}
        {!results && !verifyMutation.isPending && !verifyMutation.isError && (
          <Card className="p-6">
            <div className="text-center text-muted-foreground">
              <p>Click "Verify Code" to run tests on your code</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
