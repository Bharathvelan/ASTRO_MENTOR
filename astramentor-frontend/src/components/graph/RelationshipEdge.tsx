'use client';

import { memo } from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from 'reactflow';

export type RelationshipType = 'imports' | 'calls' | 'extends' | 'implements';

interface RelationshipEdgeData {
  label?: string;
  type: RelationshipType;
}

function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<RelationshipEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Style based on relationship type
  const getEdgeStyle = (type: RelationshipType) => {
    switch (type) {
      case 'imports':
        return {
          stroke: '#6366f1', // indigo
          strokeWidth: 2,
          strokeDasharray: 'none',
        };
      case 'calls':
        return {
          stroke: '#8b5cf6', // violet
          strokeWidth: 2,
          strokeDasharray: '5,5',
        };
      case 'extends':
        return {
          stroke: '#ec4899', // pink
          strokeWidth: 3,
          strokeDasharray: 'none',
        };
      case 'implements':
        return {
          stroke: '#14b8a6', // teal
          strokeWidth: 2,
          strokeDasharray: '2,2',
        };
      default:
        return {
          stroke: '#64748b', // slate
          strokeWidth: 2,
          strokeDasharray: 'none',
        };
    }
  };

  const edgeStyle = data?.type ? getEdgeStyle(data.type) : {};

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium border shadow-sm"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(RelationshipEdge);
