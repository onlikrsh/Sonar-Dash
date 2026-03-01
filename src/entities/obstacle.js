/**
 * obstacle.js -- Obstacle data structures.
 *
 * Obstacles are axis-aligned rectangles (walls) stored in a flat pool.
 * Each obstacle belongs to a "segment" (a horizontal band of the world).
 * The segment system recycles obstacles as the world scrolls.
 *
 * For this prototype, obstacles are the left/right corridor walls.
 * Spikes and interior obstacles will be added in a later pass.
 */

import { CONFIG } from '../core/config.js';
import { createPool } from '../utils/object-pool.js';

const MAX_OBSTACLES = 128;

const obstaclePool = createPool(MAX_OBSTACLES, () => ({
    // AABB in world coordinates
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    segmentId: -1,
    revealedAt: -1,   // timestamp (game time) when last illuminated by a pulse
    active: false,
}));

export const spawnObstacle = (x, y, w, h, segmentId) => {
    const o = obstaclePool.acquire();
    if (!o) return null;
    o.x = x;
    o.y = y;
    o.w = w;
    o.h = h;
    o.segmentId = segmentId;
    o.revealedAt = -1;
    return o;
};

export const releaseObstacle = (o) => {
    obstaclePool.release(o);
};

export const forEachObstacle = (fn) => {
    obstaclePool.forEach(fn);
};

export const releaseAllObstacles = () => {
    obstaclePool.releaseAll();
};

export const activeObstacleCount = () => obstaclePool.activeCount;
