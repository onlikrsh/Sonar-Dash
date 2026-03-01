/**
 * orb.js -- Player orb entity.
 *
 * Pure data + mutation functions. No rendering logic.
 * Stores current AND previous positions to enable render interpolation.
 */

import { CONFIG } from '../core/config.js';
import { clamp } from '../utils/math.js';

export const orb = {
    // Current state (updated in fixed step)
    x: 0,
    y: 0,
    radius: CONFIG.ORB_RADIUS,
    direction: CONFIG.INITIAL_DIRECTION,  // 1 = right, -1 = left
    scrollSpeed: CONFIG.SCROLL_SPEED_INITIAL,
    alive: true,

    // Previous state (for interpolation)
    prevX: 0,
    prevY: 0,

    // World-space distance traveled (for scoring)
    distanceTraveled: 0,
};

export const resetOrb = (canvasWidth, canvasHeight) => {
    orb.x = canvasWidth / 2;
    orb.y = canvasHeight * 0.75;
    orb.prevX = orb.x;
    orb.prevY = orb.y;
    orb.direction = CONFIG.INITIAL_DIRECTION;
    orb.scrollSpeed = CONFIG.SCROLL_SPEED_INITIAL;
    orb.alive = true;
    orb.distanceTraveled = 0;
};

export const savePrevPosition = () => {
    orb.prevX = orb.x;
    orb.prevY = orb.y;
};

/**
 * Advance orb position by one fixed timestep.
 * Horizontal drift is clamped to the corridor bounds passed in.
 * Returns the vertical distance traveled this step (for scoring).
 */
export const updateOrb = (dt, corridorLeft, corridorRight) => {
    // Horizontal drift
    orb.x += CONFIG.DRIFT_SPEED * orb.direction * dt;

    // Clamp to corridor and bounce off walls
    const minX = corridorLeft + orb.radius;
    const maxX = corridorRight - orb.radius;

    if (orb.x < minX) {
        orb.x = minX;
        orb.direction = 1;
    } else if (orb.x > maxX) {
        orb.x = maxX;
        orb.direction = -1;
    }

    // Difficulty ramp: scroll speed increases over time
    orb.scrollSpeed = clamp(
        orb.scrollSpeed + CONFIG.SCROLL_SPEED_RAMP * dt,
        CONFIG.SCROLL_SPEED_INITIAL,
        CONFIG.SCROLL_SPEED_MAX
    );

    // Vertical scroll distance this step (orb stays on screen; world scrolls)
    const dy = orb.scrollSpeed * dt;
    orb.distanceTraveled += dy;

    return dy;
};

export const reverseDirection = () => {
    orb.direction *= -1;
};
