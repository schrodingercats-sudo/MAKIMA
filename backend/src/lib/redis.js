import { Redis } from '@upstash/redis';

/**
 * Safely retrieve environment variables in Node / Backend environment
 * @param {string} key 
 * @returns {string}
 */
const getEnvVar = (key) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  return '';
};

const url = getEnvVar('UPSTASH_REDIS_REST_URL') || getEnvVar('VITE_UPSTASH_REDIS_REST_URL');
const token = getEnvVar('UPSTASH_REDIS_REST_TOKEN') || getEnvVar('VITE_UPSTASH_REDIS_REST_TOKEN');

export const redis = url && token && !url.includes('placeholder')
  ? new Redis({ url, token })
  : null;

export const CACHE_TTL = {
  TRENDING: 300, // 5 minutes (300 seconds)
  PROFILE: 600,  // 10 minutes (600 seconds)
  SEARCH: 120,   // 2 minutes (120 seconds)
};

/**
 * Cache trending artworks list
 * @param {Array|Object} artworks Array of artwork objects
 * @returns {Promise<boolean>} Success status
 */
export async function cacheTrendingArtworks(artworks) {
  if (!redis) return false;
  try {
    const key = 'cache:trending';
    await redis.set(key, JSON.stringify(artworks), { ex: CACHE_TTL.TRENDING });
    return true;
  } catch (error) {
    console.warn('[Redis Backend] Failed to cache trending artworks:', error.message);
    return false;
  }
}

/**
 * Retrieve cached trending artworks
 * @returns {Promise<Array|Object|null>} Cached trending artworks or null
 */
export async function getCachedTrendingArtworks() {
  if (!redis) return null;
  try {
    const key = 'cache:trending';
    const data = await redis.get(key);
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
    console.warn('[Redis Backend] Failed to get cached trending artworks:', error.message);
    return null;
  }
}

/**
 * Cache user profile by userId
 * @param {string} userId User UUID
 * @param {Object} profile User profile object
 * @returns {Promise<boolean>} Success status
 */
export async function cacheUserProfile(userId, profile) {
  if (!redis || !userId) return false;
  try {
    const key = `cache:profile:${userId}`;
    await redis.set(key, JSON.stringify(profile), { ex: CACHE_TTL.PROFILE });
    return true;
  } catch (error) {
    console.warn(`[Redis Backend] Failed to cache profile for user ${userId}:`, error.message);
    return false;
  }
}

/**
 * Retrieve cached user profile by userId
 * @param {string} userId User UUID
 * @returns {Promise<Object|null>} User profile object or null
 */
export async function getCachedUserProfile(userId) {
  if (!redis || !userId) return null;
  try {
    const key = `cache:profile:${userId}`;
    const data = await redis.get(key);
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
    console.warn(`[Redis Backend] Failed to get cached profile for user ${userId}:`, error.message);
    return null;
  }
}

/**
 * Cache search query results
 * @param {string} query Search query string
 * @param {Array|Object} results Search results object/array
 * @returns {Promise<boolean>} Success status
 */
export async function cacheSearchResults(query, results) {
  if (!redis || !query) return false;
  try {
    const normalizedQuery = query.toLowerCase().trim();
    const key = `cache:search:${normalizedQuery}`;
    await redis.set(key, JSON.stringify(results), { ex: CACHE_TTL.SEARCH });
    return true;
  } catch (error) {
    console.warn(`[Redis Backend] Failed to cache search results for query "${query}":`, error.message);
    return false;
  }
}

/**
 * Retrieve cached search query results
 * @param {string} query Search query string
 * @returns {Promise<Array|Object|null>} Cached search results or null
 */
export async function getCachedSearchResults(query) {
  if (!redis || !query) return null;
  try {
    const normalizedQuery = query.toLowerCase().trim();
    const key = `cache:search:${normalizedQuery}`;
    const data = await redis.get(key);
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
    console.warn(`[Redis Backend] Failed to get cached search results for query "${query}":`, error.message);
    return null;
  }
}

/**
 * Invalidate artwork caches (trending artworks)
 * @returns {Promise<boolean>} Success status
 */
export async function invalidateArtworkCache() {
  if (!redis) return false;
  try {
    await redis.del('cache:trending');
    return true;
  } catch (error) {
    console.warn('[Redis Backend] Failed to invalidate artwork cache:', error.message);
    return false;
  }
}

/**
 * Invalidate user profile cache for specified userId
 * @param {string} userId User UUID
 * @returns {Promise<boolean>} Success status
 */
export async function invalidateUserProfileCache(userId) {
  if (!redis || !userId) return false;
  try {
    const key = `cache:profile:${userId}`;
    await redis.del(key);
    return true;
  } catch (error) {
    console.warn(`[Redis Backend] Failed to invalidate profile cache for user ${userId}:`, error.message);
    return false;
  }
}

/**
 * Check action rate limit for a user (e.g. max 30 like/save actions per minute per user)
 * @param {string} userId User UUID
 * @param {string} actionType Action identifier (default: 'action')
 * @param {number} maxLimit Max allowed requests in window (default: 30)
 * @param {number} windowSeconds Time window in seconds (default: 60)
 * @returns {Promise<{ allowed: boolean, remaining: number, reset: number }>}
 */
export async function checkActionRateLimit(userId, actionType = 'action', maxLimit = 30, windowSeconds = 60) {
  const defaultReset = Date.now() + windowSeconds * 1000;
  if (!redis || !userId) {
    return { allowed: true, remaining: maxLimit, reset: defaultReset };
  }
  try {
    const key = `ratelimit:${actionType}:${userId}`;
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    let ttl = await redis.ttl(key);
    if (ttl < 0) {
      ttl = windowSeconds;
    }
    const resetTime = Date.now() + ttl * 1000;
    const remaining = Math.max(0, maxLimit - current);
    const allowed = current <= maxLimit;

    return {
      allowed,
      remaining,
      reset: resetTime
    };
  } catch (error) {
    console.warn(`[Redis Backend] Rate limit check error for user ${userId}:`, error.message);
    return { allowed: true, remaining: maxLimit, reset: defaultReset };
  }
}

export default {
  redis,
  CACHE_TTL,
  cacheTrendingArtworks,
  getCachedTrendingArtworks,
  cacheUserProfile,
  getCachedUserProfile,
  cacheSearchResults,
  getCachedSearchResults,
  invalidateArtworkCache,
  invalidateUserProfileCache,
  checkActionRateLimit,
};
