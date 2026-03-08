/**
 * SkillTree Component
 * 
 * Interactive skill tree visualization showing learning topics and their completion status.
 * Displays nodes with status (completed/in-progress/locked), prerequisites, and mastery levels.
 * 
 * Requirements: 1.3, 1.5
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { SkillTreeNode } from '@/types/enhanced-features';
import { CheckCircle2, Circle, Lock } from 'lucide-react';

interface SkillTreeProps {
  userId: string;
  nodes: SkillTreeNode[];
  onNodeClick?: (node: SkillTreeNode) => void;
}

interface TreeNodeProps {
  node: SkillTreeNode;
  level: number;
  onNodeClick?: (node: SkillTreeNode) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, onNodeClick }) => {
  const getStatusIcon = () => {
    switch (node.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Circle className="h-5 w-5 text-blue-500" />;
      case 'locked':
        return <Lock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (node.status) {
      case 'completed':
        return 'border-green-500 bg-green-50 dark:bg-green-950';
      case 'in-progress':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      case 'locked':
        return 'border-gray-300 bg-gray-50 dark:bg-gray-900 opacity-60';
    }
  };

  const isClickable = node.status !== 'locked';

  return (
    <div className="relative">
      {/* Node Card */}
      <div
        className={cn(
          'relative rounded-lg border-2 p-4 transition-all',
          getStatusColor(),
          isClickable && 'cursor-pointer hover:shadow-md',
          !isClickable && 'cursor-not-allowed'
        )}
        onClick={() => isClickable && onNodeClick?.(node)}
        role="button"
        tabIndex={isClickable ? 0 : -1}
        aria-label={`${node.title} - ${node.status}`}
        onKeyDown={(e) => {
          if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onNodeClick?.(node);
          }
        }}
      >
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className="flex-shrink-0 mt-0.5">{getStatusIcon()}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
              {node.title}
            </h3>

            {/* Mastery Level */}
            {node.status !== 'locked' && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Mastery</span>
                  <span className="font-medium">{node.masteryLevel}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      node.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                    )}
                    style={{ width: `${node.masteryLevel}%` }}
                    role="progressbar"
                    aria-valuenow={node.masteryLevel}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            )}

            {/* Prerequisites indicator */}
            {node.prerequisites.length > 0 && node.status === 'locked' && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Requires {node.prerequisites.length} prerequisite{node.prerequisites.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {node.children.length > 0 && (
        <div className="mt-4 ml-8 space-y-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const SkillTree: React.FC<SkillTreeProps> = ({ nodes, onNodeClick }) => {
  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Circle className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No Skills Yet
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
          Start learning to build your skill tree. Complete activities to unlock new topics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Skill Tree
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track your learning journey and unlock new topics
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-gray-600 dark:text-gray-400">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">Locked</span>
          </div>
        </div>
      </div>

      {/* Tree */}
      <div className="space-y-6">
        {nodes.map((node) => (
          <TreeNode key={node.id} node={node} level={0} onNodeClick={onNodeClick} />
        ))}
      </div>
    </div>
  );
};
