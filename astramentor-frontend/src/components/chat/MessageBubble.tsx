'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Message, AgentType } from '@/lib/stores/chat-store';
import { useEditorStore } from '@/lib/stores/editor-store';
import { EvidenceCard } from './EvidenceCard';
import { SuggestedQuestions } from './SuggestedQuestions';
import { SocraticHint } from './SocraticHint';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Bug,
  Hammer,
  CheckSquare,
  Zap,
  User,
  Play,
} from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  onRequestNextHint?: (messageId: string) => void;
  onShowSolution?: (messageId: string) => void;
}

const agentIcons: Record<AgentType, React.ReactNode> = {
  tutor: <BookOpen className="w-5 h-5" />,
  debugger: <Bug className="w-5 h-5" />,
  builder: <Hammer className="w-5 h-5" />,
  verifier: <CheckSquare className="w-5 h-5" />,
};

const agentColors: Record<AgentType, string> = {
  tutor: 'bg-blue-500',
  debugger: 'bg-red-500',
  builder: 'bg-purple-500',
  verifier: 'bg-green-500',
};

const agentNames: Record<AgentType, string> = {
  tutor: 'Tutor',
  debugger: 'Debugger',
  builder: 'Builder',
  verifier: 'Verifier',
};

export function MessageBubble({ message, onRequestNextHint, onShowSolution }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const agentType = message.agentType || 'tutor';
  const { navigateToCode } = useEditorStore();

  const handleNextHint = () => {
    if (onRequestNextHint) {
      onRequestNextHint(message.id);
    }
  };

  const handleShowSolution = () => {
    if (onShowSolution) {
      onShowSolution(message.id);
    }
  };

  const handleEvidenceNavigate = (filePath: string, startLine: number, endLine: number) => {
    navigateToCode(filePath, startLine, endLine);
  };

  return (
    <div
      className={cn(
        'flex gap-3 mb-6',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatar - only for assistant */}
      {!isUser && (
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white',
            agentColors[agentType]
          )}
        >
          {agentIcons[agentType]}
        </div>
      )}

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Agent Name - only for assistant */}
        {!isUser && (
          <div className="text-sm font-medium text-muted-foreground mb-1">
            {agentNames[agentType]}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            'rounded-lg px-4 py-3',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  // Customize code blocks
                  code: ({ className, children, ...props }: any) => {
                    const inline = !className;
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';

                    return inline ? (
                      <code
                        className="bg-muted-foreground/10 px-1 py-0.5 rounded text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <div className="relative group mt-2 mb-4 overflow-hidden rounded-md border">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 text-xs font-sans border-b">
                          <span className="text-muted-foreground font-medium">{language || 'code'}</span>
                          {(language === 'python' || language === 'javascript' || language === 'typescript') && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => {
                                const codeStr = String(children).replace(/\n$/, '');
                                localStorage.setItem('playground_init_code', codeStr);
                                localStorage.setItem('playground_init_lang', language);
                                window.location.href = '/dashboard/playground';
                              }}
                            >
                              <Play className="h-3 w-3" />
                              Run in Playground
                            </Button>
                          )}
                        </div>
                        <pre className="p-4 m-0 overflow-x-auto bg-muted/30">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Streaming indicator */}
          {!message.isComplete && !isUser && (
            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
          )}
        </div>

        {/* Evidence Cards */}
        {message.evidence && message.evidence.length > 0 && (
          <div className="mt-3 space-y-2 w-full">
            {message.evidence.map((evidence, index) => (
              <EvidenceCard 
                key={index} 
                evidence={evidence}
                onNavigate={handleEvidenceNavigate}
              />
            ))}
          </div>
        )}

        {/* Socratic Mode Hint Controls */}
        {message.isComplete &&
          message.socraticMode?.enabled &&
          !isUser && (
            <div className="mt-3 w-full">
              <SocraticHint
                currentHint={message.socraticMode.currentHint}
                totalHints={message.socraticMode.totalHints}
                onNextHint={handleNextHint}
                onShowSolution={handleShowSolution}
              />
            </div>
          )}

        {/* Suggested Questions */}
        {message.isComplete &&
          message.suggestedQuestions &&
          message.suggestedQuestions.length > 0 &&
          !message.socraticMode?.enabled && (
            <div className="mt-3 w-full">
              <SuggestedQuestions questions={message.suggestedQuestions} />
            </div>
          )}

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* Avatar - only for user */}
      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <User className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
