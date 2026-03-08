import networkx as nx
import json
import os
from typing import Dict, List, Optional, Any
from src.core.config import settings


class KnowledgeGraphManager:
    """Manages knowledge graphs for code repositories"""
    
    def __init__(self, storage_path: Optional[str] = None):
        self.storage_path = storage_path or settings.GRAPH_STORAGE_PATH
        self.graphs: Dict[str, nx.DiGraph] = {}
        
        # Ensure storage directory exists
        os.makedirs(self.storage_path, exist_ok=True)
    
    def load_graph(self, repo_id: str) -> nx.DiGraph:
        """Load graph from disk or create new"""
        if repo_id in self.graphs:
            return self.graphs[repo_id]
        
        graph_file = os.path.join(self.storage_path, f"{repo_id}_graph.json")
        
        if os.path.exists(graph_file):
            with open(graph_file, 'r') as f:
                data = json.load(f)
                graph = nx.node_link_graph(data)
                self.graphs[repo_id] = graph
                return graph
        
        # Create new graph
        graph = nx.DiGraph()
        self.graphs[repo_id] = graph
        return graph
    
    def save_graph(self, repo_id: str) -> None:
        """Persist graph to disk"""
        graph = self.graphs.get(repo_id)
        if not graph:
            return
        
        graph_file = os.path.join(self.storage_path, f"{repo_id}_graph.json")
        data = nx.node_link_data(graph)
        
        with open(graph_file, 'w') as f:
            json.dump(data, f)
    
    def add_node(
        self,
        repo_id: str,
        node_id: str,
        node_type: str,
        attributes: Optional[Dict[str, Any]] = None
    ) -> None:
        """Add node to knowledge graph"""
        graph = self.load_graph(repo_id)
        attrs = attributes or {}
        graph.add_node(node_id, type=node_type, **attrs)
        self.graphs[repo_id] = graph
    
    def add_edge(
        self,
        repo_id: str,
        source: str,
        target: str,
        relationship: str,
        attributes: Optional[Dict[str, Any]] = None
    ) -> None:
        """Add edge to knowledge graph"""
        graph = self.load_graph(repo_id)
        attrs = attributes or {}
        graph.add_edge(source, target, relationship=relationship, **attrs)
        self.graphs[repo_id] = graph
    
    def get_node(self, repo_id: str, node_id: str) -> Optional[Dict[str, Any]]:
        """Get node data"""
        graph = self.load_graph(repo_id)
        
        if node_id not in graph:
            return None
        
        return dict(graph.nodes[node_id])
    
    def get_related_nodes(
        self,
        repo_id: str,
        entity: str,
        max_depth: int = 2
    ) -> List[Dict[str, Any]]:
        """Get nodes related to entity within max_depth using BFS"""
        graph = self.load_graph(repo_id)
        
        if entity not in graph:
            return []
        
        related = []
        visited = set()
        queue = [(entity, 0)]
        
        while queue:
            node, depth = queue.pop(0)
            
            if node in visited or depth > max_depth:
                continue
            
            visited.add(node)
            node_data = dict(graph.nodes[node])
            
            related.append({
                "node_id": node,
                "type": node_data.get("type"),
                "attributes": node_data,
                "depth": depth,
            })
            
            # Add neighbors to queue
            for neighbor in graph.neighbors(node):
                if neighbor not in visited:
                    queue.append((neighbor, depth + 1))
        
        return related
    
    def find_dependencies(self, repo_id: str, entity: str) -> List[Dict[str, Any]]:
        """Find all dependencies of an entity"""
        graph = self.load_graph(repo_id)
        
        if entity not in graph:
            return []
        
        dependencies = []
        
        for successor in graph.successors(entity):
            edge_data = graph.edges[entity, successor]
            relationship = edge_data.get("relationship")
            
            if relationship in ["imports", "depends_on", "calls"]:
                dependencies.append({
                    "entity": successor,
                    "relationship": relationship,
                    "attributes": dict(graph.nodes[successor]),
                })
        
        return dependencies
    
    def find_dependents(self, repo_id: str, entity: str) -> List[Dict[str, Any]]:
        """Find all entities that depend on this entity"""
        graph = self.load_graph(repo_id)
        
        if entity not in graph:
            return []
        
        dependents = []
        
        for predecessor in graph.predecessors(entity):
            edge_data = graph.edges[predecessor, entity]
            relationship = edge_data.get("relationship")
            
            if relationship in ["imports", "depends_on", "calls"]:
                dependents.append({
                    "entity": predecessor,
                    "relationship": relationship,
                    "attributes": dict(graph.nodes[predecessor]),
                })
        
        return dependents
    
    def find_concept_clusters(self, repo_id: str) -> List[List[str]]:
        """Identify concept clusters using community detection"""
        graph = self.load_graph(repo_id)
        
        if len(graph.nodes) == 0:
            return []
        
        # Convert to undirected for community detection
        undirected = graph.to_undirected()
        
        try:
            # Use Louvain community detection if available
            import community as community_louvain
            communities = community_louvain.best_partition(undirected)
            
            # Group nodes by community
            clusters: Dict[int, List[str]] = {}
            for node, community_id in communities.items():
                if community_id not in clusters:
                    clusters[community_id] = []
                clusters[community_id].append(node)
            
            return list(clusters.values())
            
        except ImportError:
            # Fallback: use connected components
            components = list(nx.connected_components(undirected))
            return [list(comp) for comp in components]
    
    def get_graph_stats(self, repo_id: str) -> Dict[str, Any]:
        """Get statistics about the graph"""
        graph = self.load_graph(repo_id)
        
        return {
            "num_nodes": graph.number_of_nodes(),
            "num_edges": graph.number_of_edges(),
            "node_types": self._count_node_types(graph),
            "edge_types": self._count_edge_types(graph),
        }
    
    def _count_node_types(self, graph: nx.DiGraph) -> Dict[str, int]:
        """Count nodes by type"""
        counts: Dict[str, int] = {}
        for node in graph.nodes:
            node_type = graph.nodes[node].get("type", "unknown")
            counts[node_type] = counts.get(node_type, 0) + 1
        return counts
    
    def _count_edge_types(self, graph: nx.DiGraph) -> Dict[str, int]:
        """Count edges by relationship type"""
        counts: Dict[str, int] = {}
        for source, target in graph.edges:
            relationship = graph.edges[source, target].get("relationship", "unknown")
            counts[relationship] = counts.get(relationship, 0) + 1
        return counts
    
    def delete_graph(self, repo_id: str) -> None:
        """Delete graph from memory and disk"""
        if repo_id in self.graphs:
            del self.graphs[repo_id]
        
        graph_file = os.path.join(self.storage_path, f"{repo_id}_graph.json")
        if os.path.exists(graph_file):
            os.remove(graph_file)


# Global instance
knowledge_graph_manager = KnowledgeGraphManager()
