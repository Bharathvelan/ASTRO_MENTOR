"""Main RAG pipeline orchestrating all 5 stages."""

import logging
import time
from typing import Dict, Optional, TYPE_CHECKING

from .hyde import HyDEEnhancer
from .decomposer import QueryDecomposer
from .retriever import HybridRetriever
from .reranker import ThreePassReranker
from .assembler import ContextAssembler
from .cache import RAGCache

if TYPE_CHECKING:
    from src.services.bedrock.client import BedrockClient
    from src.services.vector.vector_store import VectorStoreManager
    from src.services.graph.knowledge_graph import KnowledgeGraphManager
    from src.db.redis import RedisClient

logger = logging.getLogger(__name__)


class RAGPipeline:
    """5-stage RAG pipeline for code understanding."""
    
    def __init__(
        self,
        bedrock_client: "BedrockClient",
        vector_store: "VectorStoreManager",
        knowledge_graph: "KnowledgeGraphManager",
        redis_client: Optional["RedisClient"] = None,
    ):
        """Initialize RAG pipeline.
        
        Args:
            bedrock_client: Bedrock client for AI operations
            vector_store: Vector store for semantic search
            knowledge_graph: Knowledge graph for relationship traversal
            redis_client: Optional Redis client for caching
        """
        self.bedrock = bedrock_client
        self.vector_store = vector_store
        self.kg = knowledge_graph
        
        # Initialize stage components
        self.hyde = HyDEEnhancer(bedrock_client)
        self.decomposer = QueryDecomposer()
        self.retriever = HybridRetriever(vector_store, knowledge_graph, bedrock_client)
        self.reranker = ThreePassReranker()
        self.assembler = ContextAssembler()
        
        # Initialize cache if Redis available
        self.cache = RAGCache(redis_client) if redis_client else None
    
    async def retrieve(
        self,
        query: str,
        repo_id: str,
        top_k: int = 20,
        max_tokens: int = 8000,
    ) -> Dict:
        """Execute complete RAG pipeline.
        
        Args:
            query: User query
            repo_id: Repository ID
            top_k: Number of results per sub-query
            max_tokens: Maximum tokens for context
            
        Returns:
            Dict with context items and metadata
        """
        start_time = time.time()
        logger.info(f"Starting RAG pipeline for query: {query[:100]}...")
        
        # Check cache first
        if self.cache:
            cached_result = await self.cache.get(query, repo_id)
            if cached_result:
                latency = time.time() - start_time
                self._log_metrics(query, cached_result, latency, cached=True)
                return cached_result
        
        # Stage 1: Query Enhancement (HyDE)
        enhanced_query = await self.hyde.enhance_query(query)
        
        # Stage 2: Query Decomposition
        sub_queries = self.decomposer.decompose_query(enhanced_query)
        logger.debug(f"Decomposed into {len(sub_queries)} sub-queries")
        
        # Stage 3: Hybrid Retrieval
        results = await self.retriever.retrieve(
            queries=sub_queries,
            repo_id=repo_id,
            top_k=top_k,
        )
        logger.debug(f"Retrieved {len(results)} results")
        
        # Stage 4: 3-Pass Reranking
        reranked = self.reranker.rerank(results, query)
        logger.debug(f"Reranked {len(reranked)} results")
        
        # Stage 5: Context Assembly
        context = self.assembler.assemble(reranked, max_tokens)
        logger.debug(f"Assembled {len(context)} context items")
        
        # Format context for LLM
        formatted_context = self.assembler.format_context(context)
        
        result = {
            "context": context,
            "formatted_context": formatted_context,
            "metadata": {
                "original_query": query,
                "enhanced_query": enhanced_query,
                "sub_queries": sub_queries,
                "total_results": len(results),
                "reranked_results": len(reranked),
                "context_items": len(context),
            },
        }
        
        # Cache result
        if self.cache:
            await self.cache.set(query, repo_id, result)
        
        # Log metrics
        latency = time.time() - start_time
        self._log_metrics(query, result, latency, cached=False)
        
        return result
    
    def _log_metrics(self, query: str, result: Dict, latency: float, cached: bool):
        """Log retrieval metrics.
        
        Args:
            query: Original query
            result: Pipeline result
            latency: Latency in seconds
            cached: Whether result was from cache
        """
        metadata = result.get("metadata", {})
        
        logger.info(
            "RAG pipeline metrics",
            extra={
                "query_length": len(query),
                "total_results": metadata.get("total_results", 0),
                "context_items": metadata.get("context_items", 0),
                "latency_ms": int(latency * 1000),
                "cached": cached,
                "sub_queries": len(metadata.get("sub_queries", [])),
            },
        )
