'use client';

import React from 'react';
import { Evidence } from '@/lib/stores/chat-store';
import { cn } from '@/lib/utils';
import { FileCode, ExternalLink } from 'lucide-react';

interface EvidenceCardProps {
  evidence: Evidence;
  onNavigate?: (filePath: string, startLine: number, endLine: number) => void;
}

export function EvidenceCard({ evidence, onNavigate }: EvidenceCardProps) {
  const handleClick = () => {
    if (onNavigate) {
      onNavigate(evidence.filePath, evidence.startLine, evidence.endLine);
    }
  };

  return (
    <div
      className={cn(
        'border border-border rounded-lg overflow-hidden bg-card',
        onNavigate && 'cursor-pointer hover:border-primary transition-colors'
      )}
      onClick={handleClick}
      role={onNavigate ? 'button' : undefined}
      tabIndex={onNavigate ? 0 : undefined}
      onKeyDown={(e) => {
        if (onNavigate && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2 text-sm">
          <FileCode className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono text-xs text-foreground">
            {evidence.filePath}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Lines {evidence.startLine}-{evidence.endLine}
          </span>
          {onNavigate && (
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Code Snippet */}
      <div className="p-3">
        <pre className="text-xs font-mono bg-muted/30 p-2 rounded overflow-x-auto">
          <code>{evidence.snippet}</code>
        </pre>
      </div>

      {/* Explanation */}
      {evidence.explanation && (
        <div className="px-3 pb-3">
          <p className="text-sm text-muted-foreground">
            {evidence.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
