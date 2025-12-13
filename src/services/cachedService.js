

import Redis from "ioredis";

class CacheService {
    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            // Reconnect on error
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3
        });

        this.redis.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        this.redis.on('connect', () => {
            console.log('✅ Redis connected successfully');
        });

        // Default TTL values (in seconds)
        this.TTL = {
            SHORT: 60,           // 1 minute - for frequently changing data
            MEDIUM: 300,         // 5 minutes - for posts, comments
            LONG: 3600,          // 1 hour - for user profiles
            VERY_LONG: 86400     // 24 hours - for static content
        };
    }

    generateKey(prefix, identifier) {
        return `${prefix}:${identifier}`;
    }

    /**
     * Get cached data
     */
    async get(key) {
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Cache GET error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set cache with TTL
     */
    async set(key, value, ttl = this.TTL.MEDIUM) {
        try {
            await this.redis.setex(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Cache SET error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete specific cache key
     */
    async delete(key) {
        try {
            await this.redis.del(key);
            return true;
        } catch (error) {
            console.error(`Cache DELETE error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete multiple keys by pattern
     */
    async deletePattern(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
            return true;
        } catch (error) {
            console.error(`Cache DELETE PATTERN error for ${pattern}:`, error);
            return false;
        }
    }

    /**
     * Invalidate all caches related to a user
     */
    async invalidateUser(userId) {
        await this.deletePattern(`user:${userId}*`);
        await this.deletePattern(`posts:user:${userId}*`);
        await this.deletePattern(`comments:user:${userId}*`);
    }

    /**
     * Invalidate all caches related to a post
     */
    async invalidatePost(postId) {
        await this.delete(`post:${postId}`);
        await this.deletePattern(`comments:post:${postId}*`);
        await this.deletePattern(`posts:*`); // Invalidate post lists
    }

    /**
     * Invalidate all caches related to a comment
     */
    async invalidateComment(commentId) {
        await this.delete(`comment:${commentId}`);
        await this.deletePattern(`comments:*`);
    }

    /**
     * Clear all cache (use with caution!)
     */
    async clearAll() {
        try {
            await this.redis.flushdb();
            console.log('🧹 Cache cleared');
            return true;
        } catch (error) {
            console.error('Cache CLEAR error:', error);
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    async getStats() {
        try {
            const info = await this.redis.info('stats');
            const keyspace = await this.redis.info('keyspace');
            return { info, keyspace };
        } catch (error) {
            console.error('Cache STATS error:', error);
            return null;
        }
    }

    /**
     * Check if Redis is connected
     */
    isConnected() {
        return this.redis.status === 'ready';
    }

    /**
     * Close Redis connection
     */
    async close() {
        await this.redis.quit();
    }
}

export const cacheService = new CacheService();