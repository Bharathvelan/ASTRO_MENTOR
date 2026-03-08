'use client';

import React from 'react';
import Editor, { EditorProps } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CodeEditorProps extends Omit<EditorProps, 'theme'> {
  className?: string;
  wrapperClassName?: string;
}

export function CodeEditor({ className, wrapperClassName, ...props }: CodeEditorProps) {
  const { theme, systemTheme } = useTheme();
  
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  return (
    <div className={cn('relative h-full w-full overflow-hidden rounded-md border border-border bg-background', wrapperClassName)}>
      <Editor
        theme={isDark ? 'vs-dark' : 'vs'}
        className={cn('h-full w-full', className)}
        loading={
          <div className="flex h-full items-center justify-center p-4 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm">Loading Editor...</span>
          </div>
        }
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontLigatures: true,
          formatOnPaste: true,
          padding: { top: 16, bottom: 16 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorSmoothCaretAnimation: 'on',
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          ...props.options,
        }}
        {...props}
      />
    </div>
  );
}
