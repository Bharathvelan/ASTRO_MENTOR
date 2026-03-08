'use client';

import { useEffect } from 'react';
import type { editor } from 'monaco-editor';
import type { Monaco } from '@monaco-editor/react';
import type { EditorHint } from '@/lib/stores/editor-store';

interface GutterHintProps {
  editor: editor.IStandaloneCodeEditor;
  monaco: Monaco;
  hints: EditorHint[];
}

/**
 * GutterHint component manages hint decorations in the Monaco editor gutter
 * This is a utility component that doesn't render anything itself
 */
export function useGutterHints({ editor, monaco, hints }: GutterHintProps) {
  useEffect(() => {
    if (!editor || !monaco) return;

    // Create decorations for each hint
    const decorations = hints.map((hint) => ({
      range: new monaco.Range(hint.line, 1, hint.line, 1),
      options: {
        isWholeLine: false,
        glyphMarginClassName: `gutter-hint-${hint.severity}`,
        glyphMarginHoverMessage: { value: hint.message },
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      },
    }));

    // Apply decorations
    const decorationIds = editor.deltaDecorations([], decorations);

    // Cleanup function to remove decorations
    return () => {
      editor.deltaDecorations(decorationIds, []);
    };
  }, [editor, monaco, hints]);
}

/**
 * Helper function to add a hint to the editor
 */
export function addHintDecoration(
  editor: editor.IStandaloneCodeEditor,
  monaco: Monaco,
  hint: EditorHint
): string[] {
  const decoration = {
    range: new monaco.Range(hint.line, 1, hint.line, 1),
    options: {
      isWholeLine: false,
      glyphMarginClassName: `gutter-hint-${hint.severity}`,
      glyphMarginHoverMessage: { value: hint.message },
      stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
    },
  };

  return editor.deltaDecorations([], [decoration]);
}

/**
 * Helper function to remove hint decorations
 */
export function removeHintDecorations(
  editor: editor.IStandaloneCodeEditor,
  decorationIds: string[]
): void {
  editor.deltaDecorations(decorationIds, []);
}

/**
 * Helper function to clear all hint decorations
 */
export function clearAllHintDecorations(
  editor: editor.IStandaloneCodeEditor
): void {
  const model = editor.getModel();
  if (!model) return;

  const allDecorations = model.getAllDecorations();
  const hintDecorationIds = allDecorations
    .filter((d) => d.options.glyphMarginClassName?.startsWith('gutter-hint-'))
    .map((d) => d.id);

  editor.deltaDecorations(hintDecorationIds, []);
}
