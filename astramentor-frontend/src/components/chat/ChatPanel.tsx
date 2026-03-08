'use client';

import React from 'react';
import { useChatStore, type AgentType } from '@/lib/stores/chat-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { MessageList } from './MessageList';
import { InputBar } from './InputBar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ChevronRight, GraduationCap, Bug, Hammer, CheckSquare, BrainCircuit } from 'lucide-react';

interface ChatPanelProps {
  className?: string;
}

const AGENT_CONFIG: Record<AgentType, { label: string; icon: React.ElementType; color: string; desc: string }> = {
  tutor: {
    label: 'Tutor',
    icon: GraduationCap,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    desc: 'Explains concepts, guides learning',
  },
  debugger: {
    label: 'Debugger',
    icon: Bug,
    color: 'text-red-500 bg-red-500/10 border-red-500/30',
    desc: 'Identifies bugs and root causes',
  },
  builder: {
    label: 'Builder',
    icon: Hammer,
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
    desc: 'Generates and scaffolds code',
  },
  verifier: {
    label: 'Verifier',
    icon: CheckSquare,
    color: 'text-green-500 bg-green-500/10 border-green-500/30',
    desc: 'Validates logic and correctness',
  },
};

export function ChatPanel({ className }: ChatPanelProps) {
  const {
    messages, isStreaming, sendMessage,
    currentAgentType, setAgentType,
    isSocraticModeEnabled, setSocraticMode,
  } = useChatStore();
  const { togglePanel } = useUIStore();

  const currentAgent = AGENT_CONFIG[currentAgentType];
  const AgentIcon = currentAgent.icon;

  const handleRequestNextHint = async (_messageId: string) => {
    await sendMessage('__NEXT_HINT__');
  };

  const handleShowSolution = async (_messageId: string) => {
    await sendMessage('__SHOW_SOLUTION__');
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-background border-l border-border relative',
        className
      )}
    >
      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute -left-3 top-4 z-10 h-6 w-6 rounded-full border bg-background p-0 shadow-sm"
        onClick={() => togglePanel('chat')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Header */}
      <div className="px-4 py-3 border-b border-border space-y-3">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">AI Workspace</h2>
          </div>
          {isStreaming && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>Thinking…</span>
            </div>
          )}
        </div>

        {/* Agent mode selector */}
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.entries(AGENT_CONFIG) as [AgentType, typeof currentAgent][]).map(([type, cfg]) => {
            const Icon = cfg.icon;
            const isActive = currentAgentType === type;
            return (
              <button
                key={type}
                onClick={() => setAgentType(type)}
                title={cfg.desc}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium border transition-all',
                  isActive
                    ? cn(cfg.color, 'shadow-sm')
                    : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Active agent description */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AgentIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{currentAgent.desc}</span>
          </div>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {currentAgentType}
          </Badge>
        </div>

        {/* Socratic mode toggle */}
        <div className="flex items-center justify-between pt-0.5">
          <div>
            <div className="text-xs font-medium">Socratic Mode</div>
            <div className="text-[10px] text-muted-foreground">
              AI guides with questions, not answers
            </div>
          </div>
          <Switch
            id="socratic-mode"
            checked={isSocraticModeEnabled}
            onCheckedChange={setSocraticMode}
          />
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          onRequestNextHint={handleRequestNextHint}
          onShowSolution={handleShowSolution}
        />
      </div>

      {/* Input Bar */}
      <div className="border-t border-border">
        <InputBar disabled={isStreaming} />
      </div>
    </div>
  );
}
