/**
 * sonar-reveal.js -- Marks obstacles as "revealed" when a sonar pulse ring
 * passes over them.
 *
 * This runs in the fixed update step, not the render pass, to keep
 * rendering side-effect free.
 */

import { CONFIG } from '../core/config.js';
import { forEachPulse } from '../entities/sonar-pulse.js';
import { forEachObstacle } from '../entities/obstacle.js';

/**
 * Quick test: does the thin ring of a pulse intersect an AABB?
 * Tests if the distance from the pulse center to the nearest point
 * on the AABB falls within the annular ring band.
 */
const pulseIntersectsAABB = (pulse, obs) => {
    const cx = pulse.x;
    const cy = pulse.y;
    const nearestX = cx < obs.x ? obs.x : cx > obs.x + obs.w ? obs.x + obs.w : cx;
    const nearestY = cy < obs.y ? obs.y : cy > obs.y + obs.h ? obs.y + obs.h : cy;
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    const distSq = dx * dx + dy * dy;
    const band = CONFIG.PULSE_RING_WIDTH * 4;
    const outer = pulse.radius + band;
    const inner = Math.max(0, pulse.radius - band);
    return distSq <= outer * outer && distSq >= inner * inner;
};

/**
 * Test all active pulses against all active obstacles.
 * Stamps `revealedAt` on any obstacle intersected by a pulse ring.
 */
export const updateSonarReveal = (gameTime) => {
    forEachPulse((pulse) => {
        forEachObstacle((obs) => {
            if (pulseIntersectsAABB(pulse, obs)) {
                obs.revealedAt = gameTime;
            }
        });
    });
};
