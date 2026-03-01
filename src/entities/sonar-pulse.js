/**
 * sonar-pulse.js -- Sonar pulse entity + pool.
 *
 * Each pulse is an expanding circle born at the orb's position.
 * Uses object pooling to avoid allocations during gameplay.
 */

import { CONFIG } from '../core/config.js';
import { createPool } from '../utils/object-pool.js';

const pulsePool = createPool(CONFIG.PULSE_MAX_ACTIVE, () => ({
    x: 0,
    y: 0,
    radius: 0,
    alpha: 1,
    age: 0,
    active: false,
}));

/**
 * Spawn a new pulse at (x, y) in world space.
 * If the pool is full, the request is silently dropped.
 */
export const spawnPulse = (x, y) => {
    const p = pulsePool.acquire();
    if (!p) return;
    p.x = x;
    p.y = y;
    p.radius = 0;
    p.alpha = 1;
    p.age = 0;
};

/** Advance all active pulses. Expired ones are returned to the pool. */
export const updatePulses = (dt) => {
    pulsePool.forEach((p) => {
        p.age += dt;
        if (p.age >= CONFIG.PULSE_LIFETIME) {
            pulsePool.release(p);
            return;
        }
        p.radius += CONFIG.PULSE_EXPAND_SPEED * dt;
        p.alpha = 1 - (p.age / CONFIG.PULSE_LIFETIME);
    });
};

/** Iterate all active pulses (read-only). */
export const forEachPulse = (fn) => {
    pulsePool.forEach(fn);
};

/** Offset all active pulse positions (used to scroll them with the world). */
export const scrollPulses = (dy) => {
    pulsePool.forEach((p) => {
        p.y += dy;
    });
};

export const releaseAllPulses = () => {
    pulsePool.releaseAll();
};

export const activePulseCount = () => pulsePool.activeCount;
