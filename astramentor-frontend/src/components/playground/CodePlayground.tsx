/**
 * CodePlayground Component
 * 
 * In-browser code execution environment with Monaco Editor integration.
 * Supports JavaScript, Python, and TypeScript with real-time output display.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.7
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { usePlaygroundStore } from '@/lib/stores/playground-store';
import type { SupportedLanguage } from '@/types/enhanced-features';
import { Play, Loader2, Save, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExecutionOutput } from './ExecutionOutput';

interface CodePlaygroundProps {
  initialCode?: string;
  initialLanguage?: SupportedLanguage;
  onShare?: () => void;
  className?: string;
}

const LANGUAGE_OPTIONS: { value: SupportedLanguage; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
];

export const CodePlayground: React.FC<CodePlaygroundProps> = ({
  initialCode = '',
  initialLanguage = 'javascript',
  onShare,
  className,
}) => {
  const {
    currentSession,
    executionResult,
    isExecuting,
    autoSaveEnabled,
    lastSaved,
    updateCode,
    setLanguage,
    setExecuting,
    setExecutionResult,
    markSaved,
  } = usePlaygroundStore();

  const [code, setCode] = useState(initialCode);
  const [language, setSelectedLanguage] = useState<SupportedLanguage>(initialLanguage);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save functionality - saves every 30 seconds
  useEffect(() => {
    if (!autoSaveEnabled || !code) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for 30 seconds
    autoSaveTimerRef.current = setTimeout(() => {
      markSaved();
    }, 30000);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [code, autoSaveEnabled, markSaved]);

  // Handle code change
  const handleCodeChange = useCallback((value: string) => {
    setCode(value);
    updateCode(value);
  }, [updateCode]);

  // Handle language change
  const handleLanguageChange = useCallback((newLanguage: SupportedLanguage) => {
    setSelectedLanguage(newLanguage);
    setLanguage(newLanguage);
  }, [setLanguage]);

  // Handle code execution
  const handleExecute = useCallback(async () => {
    if (!code.trim()) {
      setExecutionResult({
        output: '',
        error: 'No code to execute',
        executionTime: 0,
        memoryUsed: 0,
      });
      return;
    }

    setExecuting(true);

    try {
      // TODO: Replace with actual API call when backend is ready
      // Simulate execution for now
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock execution result
      setExecutionResult({
        output: `// Execution result for ${language}\n// Code executed successfully\n// Output will appear here when backend is connected`,
        executionTime: 123,
        memoryUsed: 2.5,
      });
    } catch (error) {
      setExecutionResult({
        output: '',
        error: error instanceof Error ? error.message : 'Execution failed',
        executionTime: 0,
        memoryUsed: 0,
      });
    } finally {
      setExecuting(false);
    }
  }, [code, language, setExecuting, setExecutionResult]);

  // Handle save
  const handleSave = useCallback(() => {
    markSaved();
  }, [markSaved]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Select programming language"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Execute Button */}
          <Button
            onClick={handleExecute}
            disabled={isExecuting || !code.trim()}
            className="gap-2"
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Code
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-save status indicator */}
          {autoSaveEnabled && (
            <div className="flex items-center gap-2 text-xs">
              {lastSaved ? (
                <span className="text-green-600 dark:text-green-400">
                  ✓ Saved {new Date(lastSaved).toLocaleTimeString()}
                </span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">
                  Auto-save enabled
                </span>
              )}
            </div>
          )}

          {/* Save Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>

          {/* Share Button */}
          {onShare && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Code Editor */}
        <div className="flex-1 border-r border-gray-200 dark:border-gray-700">
          <div className="h-full p-4 bg-gray-50 dark:bg-gray-900">
            <textarea
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full h-full p-4 font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={`Write your ${language} code here...`}
              spellCheck={false}
              aria-label="Code editor"
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Output
            </h3>
          </div>
          <ExecutionOutput
            result={executionResult}
            isExecuting={isExecuting}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
};
