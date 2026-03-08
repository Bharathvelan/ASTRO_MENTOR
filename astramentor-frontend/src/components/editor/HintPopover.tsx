'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useChatStore } from '@/lib/stores/chat-store';
import { useEditorStore } from '@/lib/stores/editor-store';
import type { EditorHint } from '@/lib/stores/editor-store';
import { MessageSquare, Info, AlertTriangle, AlertCircle } from 'lucide-react';

interface HintPopoverProps {
  hint: EditorHint;
  children: React.ReactNode;
}

export function HintPopover({ hint, children }: HintPopoverProps) {
  const [open, setOpen] = useState(false);
  const { addMessage } = useChatStore();
  const { content } = useEditorStore();

  const handleAskFollowUp = () => {
    // Get the line of code where the hint is
    const lines = content.split('\n');
    const codeLine = lines[hint.line - 1] || '';

    // Create a context message for the chat
    const contextMessage = `I have a question about this code on line ${hint.line}:\n\`\`\`\n${codeLine}\n\`\`\`\n\nThe hint says: "${hint.message}"\n\nCan you explain this in more detail?`;

    // Add message to chat
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: contextMessage,
      timestamp: Date.now(),
      isComplete: true,
    });

    // Close popover
    setOpen(false);
  };

  const getIcon = () => {
    switch (hint.severity) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = () => {
    switch (hint.severity) {
      case 'info':
        return 'border-blue-500';
      case 'warning':
        return 'border-yellow-500';
      case 'error':
        return 'border-red-500';
      default:
        return 'border-gray-500';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className={`w-96 border-l-4 ${getSeverityColor()}`}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start gap-2">
            {getIcon()}
            <div className="flex-1">
              <h4 className="text-sm font-semibold capitalize">{hint.severity}</h4>
              <p className="text-xs text-muted-foreground">
                Line {hint.line}, Column {hint.column}
              </p>
            </div>
          </div>

          {/* Message */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {hint.message}
            </ReactMarkdown>
          </div>

          {/* Source */}
          {hint.source && (
            <div className="text-xs text-muted-foreground">
              Source: {hint.source === 'ai' ? 'AI Assistant' : 'Linter'}
            </div>
          )}

          {/* Actions */}
          {hint.source === 'ai' && (
            <div className="flex justify-end pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={handleAskFollowUp}
                className="gap-2"
              >
                <MessageSquare className="h-3 w-3" />
                Ask follow-up
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
