"""Hybrid retrieval combining vector and graph search."""

import logging
import re
from typing import Dict, List, TYPE_CHECKING

if TYPE_CHECKING:
    from src.services.vector.vector_store import VectorStoreManager
    from src.services.graph.knowledge_graph import KnowledgeGraphManager
    from src.services.bedrock.client import BedrockClient

logger = logging.getLogger(__name__)


class HybridRetriever:
    """Hybrid retrieval using vector search and knowledge graph."""
    
    def __init__(
        self,
        vector_store: "VectorStoreManager",
        knowledge_graph: "KnowledgeGraphManager",
        bedrock_client: "BedrockClient",
    ):
        """Initialize hybrid retriever.
        
        Args:
            vector_store: Vector store for semantic search
            knowledge_graph: Knowledge graph for relationship traversal
            bedrock_client: Bedrock client for embeddings
        """
        self.vector_store = vector_store
        self.kg = knowledge_graph
        self.bedrock = bedrock_client
    
    async def retrieve(
        self,
        queries: List[str],
        repo_id: str,
        top_k: int = 20,
    ) -> List[Dict]:
        """Perform hybrid retrieval for queries.
        
        Args:
            queries: List of queries (from decomposition)
            repo_id: Repository ID
            top_k: Number of results per query
            
        Returns:
            Combined results from vector and graph search
        """
        all_results = []
        
        for query in queries:
            # Vector search
            vector_results = await self._vector_retrieve(query, repo_id, top_k)
            all_results.extend(vector_results)
            
            # Graph search
            graph_results = await self._graph_retrieve(query, repo_id, top_k)
            all_results.extend(graph_results)
        
        # Deduplicate results by content hash
        unique_results = self._deduplicate_results(all_results)
        
        logger.debug(
            f"Hybrid retrieval: {len(all_results)} total, "
            f"{len(unique_results)} unique results"
        )
        
        return unique_results
    
    async def _vector_retrieve(
        self,
        query: str,
        repo_id: str,
        top_k: int,
    ) -> List[Dict]:
        """Retrieve using vector similarity search.
        
        Args:
            query: Search query
            repo_id: Repository ID
            top_k: Number of results
            
        Returns:
            List of search results with scores
        """
        try:
            # Generate query embedding
            embedding = await self.bedrock.get_embedding(query)
            
            # Search vector store
            results = self.vector_store.search(
                repo_id=repo_id,
                embedding=embedding,
                top_k=top_k,
            )
            
            # Add source type
            for result in results:
                result["source"] = "vector"
            
            return results
            
        except Exception as e:
            logger.warning(f"Vector retrieval failed: {e}")
            return []
    
    async def _graph_retrieve(
        self,
        query: str,
        repo_id: str,
        top_k: int,
    ) -> List[Dict]:
        """Retrieve using knowledge graph traversal.
        
        Args:
            query: Search query
            repo_id: Repository ID
            top_k: Number of results
            
        Returns:
            List of related nodes from graph
        """
        try:
            # Extract entities from query (simple keyword extraction)
            entities = self._extract_entities(query)
            
            if not entities:
                return []
            
            all_nodes = []
            
            # Find related nodes for each entity
            for entity in entities[:3]:  # Limit to top 3 entities
                related = self.kg.get_related_nodes(
                    repo_id=repo_id,
                    entity=entity,
                    max_depth=2,
                )
                all_nodes.extend(related)
            
            # Convert graph nodes to result format
            results = []
            for node in all_nodes[:top_k]:
                results.append({
                    "content": node.get("attributes", {}).get("content", ""),
                    "file_path": node.get("attributes", {}).get("file_path", ""),
                    "entity_type": node.get("type", ""),
                    "node_id": node.get("node_id", ""),
                    "depth": node.get("depth", 0),
                    "score": 1.0 / (node.get("depth", 0) + 1),  # Inverse depth score
                    "source": "graph",
                })
            
            return results
            
        except Exception as e:
            logger.warning(f"Graph retrieval failed: {e}")
            return []
    
    def _extract_entities(self, query: str) -> List[str]:
        """Extract potential entity names from query.
        
        Args:
            query: Search query
            
        Returns:
            List of entity names
        """
        # Simple extraction: look for capitalized words and function-like patterns
        entities = []
        
        # Find capitalized words (potential class names)
        capitalized = re.findall(r'\b[A-Z][a-zA-Z0-9_]*\b', query)
        entities.extend(capitalized)
        
        # Find function-like patterns (word followed by parentheses)
        functions = re.findall(r'\b([a-z_][a-zA-Z0-9_]*)\s*\(', query)
        entities.extend(functions)
        
        # Find quoted strings (potential identifiers)
        quoted = re.findall(r'["\']([^"\']+)["\']', query)
        entities.extend(quoted)
        
        return list(set(entities))  # Remove duplicates
    
    def _deduplicate_results(self, results: List[Dict]) -> List[Dict]:
        """Remove duplicate results based on content.
        
        Args:
            results: List of results
            
        Returns:
            Deduplicated results
        """
        seen_content = set()
        unique = []
        
        for result in results:
            content = result.get("content", "")
            if content and content not in seen_content:
                seen_content.add(content)
                unique.append(result)
        
        return unique
