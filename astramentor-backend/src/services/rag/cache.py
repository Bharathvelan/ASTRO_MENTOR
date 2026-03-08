"""Redis caching for RAG pipeline results."""

import hashlib
import json
import logging
from typing import Dict, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from src.db.redis import RedisClient

logger = logging.getLogger(__name__)


class RAGCache:
    """Cache for RAG pipeline retrieval results."""
    
    def __init__(self, redis_client: "RedisClient", ttl: int = 3600):
        """Initialize RAG cache.
        
        Args:
            redis_client: Redis client
            ttl: Time-to-live for cache entries in seconds (default: 1 hour)
        """
        self.redis = redis_client
        self.ttl = ttl
        self.hit_count = 0
        self.miss_count = 0
    
    def _generate_cache_key(self, query: str, repo_id: str) -> str:
        """Generate cache key from query and repo_id.
        
        Args:
            query: Search query
            repo_id: Repository ID
            
        Returns:
            Cache key
        """
        # Create hash of query + repo_id
        key_str = f"{repo_id}:{query}"
        key_hash = hashlib.sha256(key_str.encode()).hexdigest()
        return f"rag:cache:{key_hash}"
    
    async def get(self, query: str, repo_id: str) -> Optional[Dict]:
        """Get cached results for query.
        
        Args:
            query: Search query
            repo_id: Repository ID
            
        Returns:
            Cached results or None if not found
        """
        cache_key = self._generate_cache_key(query, repo_id)
        
        try:
            cached_data = await self.redis.get(cache_key)
            
            if cached_data:
                self.hit_count += 1
                logger.debug(f"Cache hit for query: {query[:50]}...")
                return json.loads(cached_data)
            else:
                self.miss_count += 1
                logger.debug(f"Cache miss for query: {query[:50]}...")
                return None
                
        except Exception as e:
            logger.warning(f"Cache get error: {e}")
            self.miss_count += 1
            return None
    
    async def set(self, query: str, repo_id: str, results: Dict):
        """Cache results for query.
        
        Args:
            query: Search query
            repo_id: Repository ID
            results: Results to cache
        """
        cache_key = self._generate_cache_key(query, repo_id)
        
        try:
            # Serialize results to JSON
            cached_data = json.dumps(results)
            
            # Store with TTL
            await self.redis.setex(cache_key, self.ttl, cached_data)
            
            logger.debug(f"Cached results for query: {query[:50]}...")
            
        except Exception as e:
            logger.warning(f"Cache set error: {e}")
    
    def get_hit_rate(self) -> float:
        """Calculate cache hit rate.
        
        Returns:
            Hit rate as percentage (0-100)
        """
        total = self.hit_count + self.miss_count
        if total == 0:
            return 0.0
        return (self.hit_count / total) * 100
    
    def get_stats(self) -> Dict:
        """Get cache statistics.
        
        Returns:
            Dict with hit/miss counts and hit rate
        """
        return {
            "hits": self.hit_count,
            "misses": self.miss_count,
            "hit_rate": self.get_hit_rate(),
        }
    
    def reset_stats(self):
        """Reset cache statistics."""
        self.hit_count = 0
        self.miss_count = 0
