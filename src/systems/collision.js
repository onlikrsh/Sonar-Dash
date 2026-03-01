/**
 * collision.js -- Collision detection between the orb and obstacles.
 *
 * Checks circle (orb) vs AABB (walls). Returns true on first hit.
 * Does not allocate -- uses the circleAABB helper from math.js.
 */

import { circleAABB } from '../utils/math.js';
import { orb } from '../entities/orb.js';
import { forEachObstacle } from '../entities/obstacle.js';

// Reusable result flag to avoid closures that allocate
let hitDetected = false;

/**
 * Test the orb against all active obstacles.
 * Returns true if any collision is found.
 */
export const checkOrbCollision = () => {
    hitDetected = false;

    forEachObstacle((obs) => {
        if (hitDetected) return; // skip circleAABB work (forEach still runs all slots)
        if (circleAABB(orb.x, orb.y, orb.radius, obs.x, obs.y, obs.w, obs.h)) {
            hitDetected = true;
        }
    });

    return hitDetected;
};
