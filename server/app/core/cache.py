"""
Redis Cache Configuration
Caching layer for predictions and frequent queries
"""
import redis.asyncio as redis
import json
import logging
from typing import Optional, Any
from datetime import timedelta

from app.core.config import settings

logger = logging.getLogger(__name__)

# Redis client instance
redis_client: Optional[redis.Redis] = None


async def init_redis():
    """Initialize Redis connection"""
    global redis_client
    try:
        redis_client = await redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        await redis_client.ping()
        logger.info("Redis connected successfully")
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
        raise


async def close_redis():
    """Close Redis connection"""
    global redis_client
    if redis_client:
        await redis_client.close()
        logger.info("Redis connection closed")


async def get_cache(key: str) -> Optional[Any]:
    """Get value from cache"""
    try:
        value = await redis_client.get(key)
        if value:
            return json.loads(value)
        return None
    except Exception as e:
        logger.error(f"Cache get error: {e}")
        return None


async def set_cache(key: str, value: Any, ttl: int = None) -> bool:
    """Set value in cache with TTL"""
    try:
        ttl = ttl or settings.REDIS_CACHE_TTL
        serialized = json.dumps(value)
        await redis_client.setex(key, ttl, serialized)
        return True
    except Exception as e:
        logger.error(f"Cache set error: {e}")
        return False


async def delete_cache(key: str) -> bool:
    """Delete key from cache"""
    try:
        await redis_client.delete(key)
        return True
    except Exception as e:
        logger.error(f"Cache delete error: {e}")
        return False


async def clear_pattern(pattern: str) -> int:
    """Delete all keys matching pattern"""
    try:
        keys = await redis_client.keys(pattern)
        if keys:
            return await redis_client.delete(*keys)
        return 0
    except Exception as e:
        logger.error(f"Cache clear pattern error: {e}")
        return 0


def get_redis() -> redis.Redis:
    """Get Redis client instance"""
    return redis_client
