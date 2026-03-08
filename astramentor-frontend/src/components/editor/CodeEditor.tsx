'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useEditorStore } from '@/lib/stores/editor-store';
import { useChatStore } from '@/lib/stores/chat-store';
import { useTheme } from 'next-themes';
import { getLanguageFromExtension } from '@/lib/utils/language-config';
import { useGutterHints } from './GutterHint';
import type { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

// Dynamically import Monaco Editor for code splitting
const Editor = dynamic(() => import('@monaco-editor/react'), {
  loading: () => (
    <div className="flex h-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading editor...</p>
      </div>
    </div>
  ),
  ssr: false,
});

interface CodeEditorProps {
  className?: string;
}

export function CodeEditor({ className }: CodeEditorProps) {
  const { theme } = useTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  
  const {
    content,
    language,
    cursorPosition,
    hints,
    navigationTarget,
    setContent,
    updateCursor,
    clearNavigationTarget,
  } = useEditorStore();

  const { addMessage } = useChatStore();
  const { setDraftInput } = useChatStore();

  // Store scroll position
  const scrollPositionRef = useRef<{ scrollTop: number; scrollLeft: number }>({
    scrollTop: 0,
    scrollLeft: 0,
  });

  // Handle editor mount
  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure language features
    configureLanguageFeatures(monaco);

    // Add custom context menu actions
    addContextMenuActions(editor, monaco);

    // Restore cursor position
    if (cursorPosition) {
      editor.setPosition({
        lineNumber: cursorPosition.line,
        column: cursorPosition.column,
      });
    }

    // Listen to cursor position changes
    editor.onDidChangeCursorPosition((e: editor.ICursorPositionChangedEvent) => {
      updateCursor({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // Listen to scroll position changes
    editor.onDidScrollChange((e) => {
      scrollPositionRef.current = {
        scrollTop: e.scrollTop,
        scrollLeft: e.scrollLeft,
      };
    });

    // Restore scroll position
    if (scrollPositionRef.current.scrollTop > 0 || scrollPositionRef.current.scrollLeft > 0) {
      editor.setScrollPosition(scrollPositionRef.current);
    }
  };

  // Configure language-specific features
  const configureLanguageFeatures = (monaco: Monaco) => {
    // TypeScript/JavaScript configuration
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types'],
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      allowJs: true,
    });

    // Enable diagnostics
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
  };

  // Add custom context menu actions
  const addContextMenuActions = (
    editorInstance: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    // Add "Ask about selection" action
    editorInstance.addAction({
      id: 'ask-about-selection',
      label: 'Ask AI About Selection',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyQ],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: (ed: editor.IStandaloneCodeEditor) => {
        const selection = ed.getSelection();
        if (!selection) return;

        const selectedText = ed.getModel()?.getValueInRange(selection);
        if (!selectedText) return;

        // Get line numbers for context
        const startLine = selection.startLineNumber;
        const endLine = selection.endLineNumber;

        // Create context message
        const contextMessage = `I have a question about this code (lines ${startLine}-${endLine}):\n\`\`\`${language}\n${selectedText}\n\`\`\`\n\nCan you explain what this does?`;

        // Set draft input in chat
        setDraftInput(contextMessage);
      },
    });

    // Add "Explain error" action
    editorInstance.addAction({
      id: 'explain-error',
      label: 'Ask AI to Explain Error',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyE],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.6,
      run: (ed: editor.IStandaloneCodeEditor) => {
        const position = ed.getPosition();
        if (!position) return;

        const model = ed.getModel();
        if (!model) return;

        // Get the line content
        const lineContent = model.getLineContent(position.lineNumber);

        // Create context message
        const contextMessage = `I'm getting an error on line ${position.lineNumber}:\n\`\`\`${language}\n${lineContent}\n\`\`\`\n\nCan you help me understand and fix this error?`;

        // Set draft input in chat
        setDraftInput(contextMessage);
      },
    });
  };

  // Handle content changes
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
    }
  };

  // Apply gutter hints when they change
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      useGutterHints({
        editor: editorRef.current,
        monaco: monacoRef.current,
        hints,
      });
    }
  }, [hints]);

  // Handle navigation to code from evidence cards
  useEffect(() => {
    if (navigationTarget && editorRef.current && monacoRef.current) {
      const editor = editorRef.current;
      const monaco = monacoRef.current;

      // Navigate to the line
      editor.revealLineInCenter(navigationTarget.startLine);
      
      // Set cursor position
      editor.setPosition({
        lineNumber: navigationTarget.startLine,
        column: 1,
      });

      // Highlight the range
      const range = new monaco.Range(
        navigationTarget.startLine,
        1,
        navigationTarget.endLine,
        1
      );

      // Add decoration for highlighting
      const decorations = editor.deltaDecorations(
        [],
        [
          {
            range,
            options: {
              isWholeLine: true,
              className: 'highlighted-code-range',
              inlineClassName: 'highlighted-code-inline',
            },
          },
        ]
      );

      // Clear decoration after 3 seconds
      setTimeout(() => {
        editor.deltaDecorations(decorations, []);
      }, 3000);

      // Clear navigation target
      clearNavigationTarget();
    }
  }, [navigationTarget, clearNavigationTarget]);

  // Determine Monaco theme based on app theme
  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs-light';

  return (
    <div className={className}>
      <Editor
        height="100%"
        language={language}
        value={content}
        theme={monacoTheme}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Consolas, monospace',
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          lineNumbers: 'on',
          glyphMargin: true,
          folding: true,
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          // IntelliSense and autocomplete settings
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false,
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnCommitCharacter: true,
          acceptSuggestionOnEnter: 'on',
          wordBasedSuggestions: 'matchingDocuments',
          parameterHints: { enabled: true },
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          autoIndent: 'full',
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  );
}
