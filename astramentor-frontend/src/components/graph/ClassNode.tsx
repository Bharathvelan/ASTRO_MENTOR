'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClassNodeData {
  label: string;
  methods?: number;
  complexity?: number;
}

function ClassNode({ data, selected }: NodeProps<ClassNodeData>) {
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 bg-background shadow-md transition-all',
        'min-w-[180px]',
        selected
          ? 'border-purple-500 shadow-lg shadow-purple-500/20'
          : 'border-purple-400 hover:border-purple-500'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-purple-500"
      />
      
      <div className="flex items-center gap-2">
        <Box className="h-4 w-4 text-purple-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate" title={data.label}>
            {data.label}
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            {data.methods !== undefined && (
              <span>{data.methods} methods</span>
            )}
            {data.complexity !== undefined && (
              <span>complexity: {data.complexity}</span>
            )}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-purple-500"
      />
    </div>
  );
}

export default memo(ClassNode);
