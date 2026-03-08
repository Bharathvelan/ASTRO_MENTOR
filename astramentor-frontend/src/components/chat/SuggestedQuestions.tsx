'use client';

import React from 'react';
import { useChatStore } from '@/lib/stores/chat-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';

interface SuggestedQuestionsProps {
  questions: string[];
  className?: string;
}

export function SuggestedQuestions({
  questions,
  className,
}: SuggestedQuestionsProps) {
  const { sendMessage, isStreaming } = useChatStore();

  if (questions.length === 0) {
    return null;
  }

  const handleQuestionClick = async (question: string) => {
    if (isStreaming) return;
    await sendMessage(question);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MessageCircle className="w-4 h-4" />
        <span>Suggested questions:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => handleQuestionClick(question)}
            disabled={isStreaming}
            className={cn(
              'text-left justify-start h-auto py-2 px-3',
              'hover:bg-accent hover:text-accent-foreground',
              'transition-colors'
            )}
          >
            <span className="text-sm">{question}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
