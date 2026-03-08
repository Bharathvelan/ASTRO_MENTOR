'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/lib/stores/chat-store';
import { useChatStream } from '@/lib/hooks/useChatStream';
import { Button } from '@/components/ui/button';
import { Send, StopCircle, BookOpen, Bug, Hammer, CheckSquare, ChevronDown, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentType } from '@/lib/stores/chat-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface InputBarProps {
  disabled?: boolean;
  className?: string;
}

export function InputBar({ disabled = false, className }: InputBarProps) {
  const [streamInfo, setStreamInfo] = useState<{
    messageId: string;
    streamUrl: string;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, stopStream, isStreaming, draftInput, setDraftInput, currentAgentType, isSocraticModeEnabled, setAgentType, setSocraticMode } = useChatStore();
  const [input, setInput] = useState(draftInput);

  // Sync with draft input from store
  useEffect(() => {
    if (draftInput && draftInput !== input) {
      setInput(draftInput);
      setDraftInput(''); // Clear after setting
    }
  }, [draftInput, input, setDraftInput]);

  // Set up SSE streaming when we have stream info
  const { disconnect } = useChatStream({
    streamUrl: streamInfo?.streamUrl || '',
    messageId: streamInfo?.messageId || '',
    enabled: !!streamInfo,
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 5 * 24; // 5 lines * 24px line height
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [input]);

  const handleSubmit = async () => {
    if (!input.trim() || disabled) return;

    const message = input.trim();
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const result = await sendMessage(message);
      setStreamInfo(result);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleStop = () => {
    disconnect();
    stopStream();
    setStreamInfo(null);
  };

  const agentIcons: Record<AgentType, React.ReactNode> = {
    tutor: <BookOpen className="w-3.5 h-3.5 text-blue-500" />,
    debugger: <Bug className="w-3.5 h-3.5 text-red-500" />,
    builder: <Hammer className="w-3.5 h-3.5 text-purple-500" />,
    verifier: <CheckSquare className="w-3.5 h-3.5 text-green-500" />,
  };
  const agentNames: Record<AgentType, string> = {
    tutor: 'Tutor',
    debugger: 'Debugger',
    builder: 'Builder',
    verifier: 'Verifier',
  };

  return (
    <div className={cn('flex flex-col p-4 gap-2', className)}>
      <div className="flex items-center gap-2 px-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs px-2 shadow-sm">
              {agentIcons[currentAgentType]}
              {agentNames[currentAgentType]}
              <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[140px]">
            {(Object.keys(agentNames) as AgentType[]).map((type) => (
              <DropdownMenuItem
                key={type}
                onClick={() => setAgentType(type)}
                className="gap-2 text-xs"
              >
                {agentIcons[type]}
                {agentNames[type]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant={isSocraticModeEnabled ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSocraticMode(!isSocraticModeEnabled)}
          className={cn("h-7 gap-1.5 text-xs px-2.5 transition-all shadow-sm", isSocraticModeEnabled ? "bg-yellow-500 hover:bg-yellow-600 text-white border-transparent" : "text-muted-foreground")}
        >
          <Lightbulb className={cn("w-3 h-3", isSocraticModeEnabled && "fill-current")} />
          Socratic Mode
        </Button>
      </div>

      <div className="flex items-end gap-2">
        <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          disabled
            ? 'Waiting for response...'
            : 'Ask a question... (Shift+Enter for new line)'
        }
        disabled={disabled}
        className={cn(
          'flex-1 resize-none rounded-lg border border-input bg-background px-4 py-3',
          'text-sm placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'min-h-[48px] max-h-[120px]'
        )}
        rows={1}
      />

      {isStreaming ? (
        <Button
          onClick={handleStop}
          variant="destructive"
          size="icon"
          className="flex-shrink-0 h-12 w-12"
          aria-label="Stop streaming"
        >
          <StopCircle className="w-5 h-5" />
        </Button>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={!input.trim() || disabled}
          size="icon"
          className="flex-shrink-0 h-12 w-12"
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </Button>
      )}
      </div>
    </div>
  );
}
