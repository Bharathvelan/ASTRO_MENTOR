'use client';

import { X, FileCode, Box, Zap, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface NodeDetail {
  id: string;
  type: 'file' | 'class' | 'function';
  label: string;
  path?: string;
  linesOfCode?: number;
  methods?: number;
  parameters?: number;
  complexity?: number;
  dependencies?: number;
}

interface NodeDetailPanelProps {
  node: NodeDetail | null;
  onClose: () => void;
}

export default function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  const router = useRouter();

  if (!node) return null;

  const handleOpenInEditor = () => {
    // Navigate to workspace and open the file
    router.push(`/dashboard/workspace?file=${encodeURIComponent(node.path || '')}`);
  };

  const getIcon = () => {
    switch (node.type) {
      case 'file':
        return <FileCode className="h-5 w-5 text-blue-500" />;
      case 'class':
        return <Box className="h-5 w-5 text-purple-500" />;
      case 'function':
        return <Zap className="h-5 w-5 text-teal-500" />;
      default:
        return <FileCode className="h-5 w-5" />;
    }
  };

  const getTypeColor = () => {
    switch (node.type) {
      case 'file':
        return 'text-blue-500';
      case 'class':
        return 'text-purple-500';
      case 'function':
        return 'text-teal-500';
      default:
        return 'text-foreground';
    }
  };

  return (
    <Card className="absolute top-4 right-4 w-full max-w-[calc(100vw-2rem)] md:w-80 p-4 shadow-lg z-10 bg-background/95 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          {getIcon()}
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{node.label}</h3>
            <p className={`text-xs capitalize ${getTypeColor()}`}>{node.type}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {node.path && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Path</p>
            <p className="text-sm font-mono break-all">{node.path}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {node.linesOfCode !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Lines of Code</p>
              <p className="text-sm font-semibold">{node.linesOfCode}</p>
            </div>
          )}

          {node.methods !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Methods</p>
              <p className="text-sm font-semibold">{node.methods}</p>
            </div>
          )}

          {node.parameters !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Parameters</p>
              <p className="text-sm font-semibold">{node.parameters}</p>
            </div>
          )}

          {node.complexity !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Complexity</p>
              <p className="text-sm font-semibold">{node.complexity}</p>
            </div>
          )}

          {node.dependencies !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Dependencies</p>
              <p className="text-sm font-semibold">{node.dependencies}</p>
            </div>
          )}
        </div>

        {node.path && (
          <Button
            onClick={handleOpenInEditor}
            className="w-full"
            size="sm"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Editor
          </Button>
        )}
      </div>
    </Card>
  );
}
