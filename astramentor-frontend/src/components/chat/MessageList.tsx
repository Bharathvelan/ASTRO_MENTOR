'use client';

import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Message } from '@/lib/stores/chat-store';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  onRequestNextHint?: (messageId: string) => void;
  onShowSolution?: (messageId: string) => void;
}

export function MessageList({ messages, onRequestNextHint, onShowSolution }: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  // Set up virtualizer
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150, // Estimated message height
    overscan: 5, // Render 5 extra items above and below viewport
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (shouldAutoScroll.current && parentRef.current) {
      const scrollElement = parentRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages.length]);

  // Track if user has scrolled up
  const handleScroll = () => {
    if (parentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      shouldAutoScroll.current = isAtBottom;
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No messages yet</p>
          <p className="text-sm">Start a conversation by typing a message below</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto px-4 py-4"
      style={{ overflowAnchor: 'none' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <MessageBubble
                message={message}
                onRequestNextHint={onRequestNextHint}
                onShowSolution={onShowSolution}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
