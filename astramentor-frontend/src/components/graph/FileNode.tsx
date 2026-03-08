'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileNodeData {
  label: string;
  path: string;
  linesOfCode?: number;
}

function FileNode({ data, selected }: NodeProps<FileNodeData>) {
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 bg-background shadow-md transition-all',
        'min-w-[180px]',
        selected
          ? 'border-blue-500 shadow-lg shadow-blue-500/20'
          : 'border-blue-400 hover:border-blue-500'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500"
      />
      
      <div className="flex items-center gap-2">
        <FileCode className="h-4 w-4 text-blue-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate" title={data.label}>
            {data.label}
          </div>
          {data.linesOfCode !== undefined && (
            <div className="text-xs text-muted-foreground">
              {data.linesOfCode} lines
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500"
      />
    </div>
  );
}

export default memo(FileNode);
