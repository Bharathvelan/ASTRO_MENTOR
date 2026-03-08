'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  NodeTypes,
  EdgeTypes,
  NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useGraphData } from '@/lib/query/hooks';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ZapOff } from 'lucide-react';
import FileNode from '@/components/graph/FileNode';
import ClassNode from '@/components/graph/ClassNode';
import FunctionNode from '@/components/graph/FunctionNode';
import RelationshipEdge from '@/components/graph/RelationshipEdge';
import NodeDetailPanel from '@/components/graph/NodeDetailPanel';

// ── Mock data shown when backend is offline ───────────────────────────────────────────
const MOCK_GRAPH: { nodes: any[]; edges: any[] } = {
  nodes: [
    { id: '1', type: 'file', name: 'main.py', path: '/src/main.py', linesOfCode: 154, position: { x: 300, y: 50 } },
    { id: '2', type: 'file', name: 'db.py', path: '/src/db.py', linesOfCode: 312, position: { x: 600, y: 50 }, data: { riskScore: 0.8 } },
    { id: '3', type: 'class', name: 'AuthServer', path: '/src/main.py', methods: 5, complexity: 12, position: { x: 200, y: 200 } },
    { id: '4', type: 'function', name: 'handle_login()', path: '/src/main.py', parameters: 2, complexity: 8, position: { x: 100, y: 350 }, data: { riskScore: 0.9 } },
    { id: '5', type: 'function', name: 'verify_token()', path: '/src/main.py', parameters: 1, complexity: 4, position: { x: 300, y: 350 } },
    { id: '6', type: 'class', name: 'DatabaseConfig', path: '/src/db.py', methods: 8, complexity: 18, position: { x: 600, y: 200 } },
    { id: '7', type: 'function', name: 'connect()', path: '/src/db.py', parameters: 1, complexity: 2, position: { x: 700, y: 350 } },
    { id: '8', type: 'function', name: 'execute_query()', path: '/src/db.py', parameters: 3, complexity: 14, position: { x: 500, y: 350 }, data: { status: 'warning' } },
  ],
  edges: [
    { id: 'e1-2', source: '1', target: '2', label: 'imports', relationshipType: 'imports' },
    { id: 'e1-3', source: '1', target: '3', label: 'contains', relationshipType: 'contains' },
    { id: 'e2-6', source: '2', target: '6', label: 'contains', relationshipType: 'contains' },
    { id: 'e3-4', source: '3', target: '4', label: 'contains', relationshipType: 'contains' },
    { id: 'e3-5', source: '3', target: '5', label: 'contains', relationshipType: 'contains' },
    { id: 'e6-7', source: '6', target: '7', label: 'contains', relationshipType: 'contains' },
    { id: 'e6-8', source: '6', target: '8', label: 'contains', relationshipType: 'contains' },
    { id: 'e4-5', source: '4', target: '5', label: 'calls', relationshipType: 'calls' },
    { id: 'e4-8', source: '4', target: '8', label: 'depends_on', relationshipType: 'calls' },
  ]
};
// ──────────────────────────────────────────────────────────────────────────────────────

export default function GraphPage() {
  const router = useRouter();
  const { data: apiData, isLoading, error } = useGraphData('default-repo-id');
  
  // Use real data if available, else mock
  const graphData = error ? MOCK_GRAPH : apiData;
  const isOffline = !!error;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNodes, setFilteredNodes] = useState<Node[]>([]);

  // Define custom node types
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      fileNode: FileNode,
      classNode: ClassNode,
      functionNode: FunctionNode,
    }),
    []
  );

  // Define custom edge types
  const edgeTypes: EdgeTypes = useMemo(
    () => ({
      relationship: RelationshipEdge,
    }),
    []
  );

  // Filter nodes based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredNodes(nodes);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = nodes.filter((node) =>
      node.data.label?.toLowerCase().includes(query) ||
      node.data.path?.toLowerCase().includes(query)
    );
    setFilteredNodes(filtered);
  }, [searchQuery, nodes]);

  // Handle node click
  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNode({
      id: node.id,
      type: node.type === 'fileNode' ? 'file' : node.type === 'classNode' ? 'class' : 'function',
      label: node.data.label,
      ...node.data,
    });
  }, []);

  // Handle node double-click - navigate to workspace
  const onNodeDoubleClick: NodeMouseHandler = useCallback((_event, node) => {
    const path = node.data.path;
    const line = node.data.line || 1;
    
    if (path) {
      // Navigate to workspace with file and line number
      router.push(`/dashboard/workspace?file=${encodeURIComponent(path)}&line=${line}`);
    }
  }, [router]);

  // Transform API/Mock data to React Flow format
  useEffect(() => {
    if (!graphData) return;

    // Transform nodes
    const transformedNodes: Node[] = graphData.nodes?.map((node: any, index: number) => {
      const baseNode = {
        id: node.id || `node-${index}`,
        position: node.position || { x: Math.random() * 500, y: Math.random() * 500 },
        data: {
          label: node.name || node.label || 'Unknown',
          ...node.data,
        },
      };

      // Determine node type based on entity type
      switch (node.type || node.entityType) {
        case 'file':
          return {
            ...baseNode,
            type: 'fileNode',
            data: {
              ...baseNode.data,
              path: node.path,
              linesOfCode: node.linesOfCode,
            },
          };
        case 'class':
          return {
            ...baseNode,
            type: 'classNode',
            data: {
              ...baseNode.data,
              methods: node.methods,
              complexity: node.complexity,
            },
          };
        case 'function':
          return {
            ...baseNode,
            type: 'functionNode',
            data: {
              ...baseNode.data,
              parameters: node.parameters,
              complexity: node.complexity,
            },
          };
        default:
          return {
            ...baseNode,
            type: 'fileNode',
          };
      }
    }) || [];

    // Transform edges
    const transformedEdges: Edge[] = graphData.edges?.map((edge: any, index: number) => ({
      id: edge.id || `edge-${index}`,
      source: edge.source || edge.from,
      target: edge.target || edge.to,
      type: 'relationship',
      data: {
        label: edge.label,
        type: edge.relationshipType || edge.type || 'imports',
      },
      animated: edge.relationshipType === 'calls' || edge.label === 'calls',
    })) || [];

    setNodes(transformedNodes);
    setEdges(transformedEdges);
  }, [graphData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading knowledge graph...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!graphData || (nodes.length === 0 && edges.length === 0)) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="p-8">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">No graph data available</p>
            <p className="text-xs text-muted-foreground">
              Upload a repository to visualize its structure
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full relative">
      <ReactFlow
        nodes={filteredNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        panOnScroll
        panOnDrag
        zoomOnPinch
        zoomOnScroll
        zoomOnDoubleClick={false}
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="hidden md:block"
        />
        <Panel position="top-left" className="bg-background/80 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-[calc(100vw-2rem)] md:max-w-none space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 h-8"
            />
          </div>
          {searchQuery && (
            <p className="text-xs text-muted-foreground">
              Found {filteredNodes.length} of {nodes.length} nodes
            </p>
          )}
          {isOffline && (
            <div className="flex items-center gap-2 text-[11px] font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 rounded">
              <ZapOff className="h-3 w-3 shrink-0" />
              <span>Backend Offline (Demo Data)</span>
            </div>
          )}
        </Panel>
        <Panel position="top-right" className="hidden md:block bg-background/80 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-border/50">
          <div className="text-sm font-semibold mb-3 border-b pb-2">Legend</div>
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="text-muted-foreground">Files</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
              <span className="text-muted-foreground">Classes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
              <span className="text-muted-foreground">Functions</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
      
      <NodeDetailPanel
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}
