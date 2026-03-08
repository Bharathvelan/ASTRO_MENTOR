import redis.asyncio as redis
from typing import Optional, Any
import json
from src.core.config import settings


class RedisClient:
    """Client for Redis operations"""
    
    def __init__(self):
        self.redis: Optional[redis.Redis] = None
    
    async def connect(self):
        """Connect to Redis"""
        self.redis = await redis.from_url(
            settings.REDIS_URL,
            max_connections=settings.REDIS_MAX_CONNECTIONS,
            decode_responses=True
        )
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis:
            await self.redis.close()
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.redis:
            return None
        
        value = await self.redis.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> None:
        """Set value in cache with optional TTL"""
        if not self.redis:
            return
        
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        
        if ttl:
            await self.redis.setex(key, ttl, value)
        else:
            await self.redis.set(key, value)
    
    async def delete(self, key: str) -> None:
        """Delete key from cache"""
        if not self.redis:
            return
        
        await self.redis.delete(key)
    
    async def increment(self, key: str, amount: int = 1) -> int:
        """Increment counter"""
        if not self.redis:
            return 0
        
        return await self.redis.incrby(key, amount)
    
    async def expire(self, key: str, ttl: int) -> None:
        """Set expiration on key"""
        if not self.redis:
            return
        
        await self.redis.expire(key, ttl)
    
    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        if not self.redis:
            return False
        
        return await self.redis.exists(key) > 0


# Global instance
redis_client = RedisClient()
