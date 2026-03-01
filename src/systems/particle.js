/**
 * particle.js -- Death-burst particle system.
 *
 * Uses a flat typed-array pool for maximum update throughput.
 * No object creation during gameplay.
 */

import { CONFIG } from '../core/config.js';

const MAX = CONFIG.PARTICLE_POOL_SIZE;

// Flat typed arrays: one slot per particle
const posX  = new Float32Array(MAX);
const posY  = new Float32Array(MAX);
const velX  = new Float32Array(MAX);
const velY  = new Float32Array(MAX);
const life  = new Float32Array(MAX);  // remaining life in seconds
const alpha = new Float32Array(MAX);
const alive = new Uint8Array(MAX);    // 0 or 1

let activeCount = 0;

export const spawnDeathBurst = (cx, cy) => {
    const count = Math.min(CONFIG.PARTICLE_COUNT, MAX);
    activeCount = 0;

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = CONFIG.PARTICLE_SPEED_MIN +
            Math.random() * (CONFIG.PARTICLE_SPEED_MAX - CONFIG.PARTICLE_SPEED_MIN);

        posX[i] = cx;
        posY[i] = cy;
        velX[i] = Math.cos(angle) * speed;
        velY[i] = Math.sin(angle) * speed;
        life[i] = CONFIG.PARTICLE_LIFETIME * (0.5 + Math.random() * 0.5);
        alpha[i] = 1;
        alive[i] = 1;
        activeCount++;
    }
};

export const updateParticles = (dt) => {
    activeCount = 0;
    for (let i = 0; i < MAX; i++) {
        if (!alive[i]) continue;
        life[i] -= dt;
        if (life[i] <= 0) {
            alive[i] = 0;
            continue;
        }
        posX[i] += velX[i] * dt;
        posY[i] += velY[i] * dt;
        // Decelerate
        velX[i] *= 0.97;
        velY[i] *= 0.97;
        alpha[i] = life[i] / CONFIG.PARTICLE_LIFETIME;
        activeCount++;
    }
};

/**
 * Iterate alive particles. Callback receives (x, y, alpha, index).
 * No allocations.
 */
export const forEachParticle = (fn) => {
    for (let i = 0; i < MAX; i++) {
        if (alive[i]) fn(posX[i], posY[i], alpha[i], i);
    }
};

export const clearParticles = () => {
    for (let i = 0; i < MAX; i++) alive[i] = 0;
    activeCount = 0;
};

export const particleActiveCount = () => activeCount;
