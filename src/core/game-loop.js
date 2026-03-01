/**
 * game-loop.js -- Fixed-timestep update with variable-rate rendering.
 *
 * The loop accumulates real elapsed time and runs fixed-step updates
 * until caught up, then renders once with an interpolation alpha.
 * A cap of MAX_FRAME_STEPS prevents the spiral of death when the
 * browser throttles or the tab is backgrounded.
 */

import { CONFIG } from './config.js';

let running = false;
let lastTimestamp = 0;
let accumulator = 0;
let updateFn = null;   // (dt: number) => void
let renderFn = null;   // (alpha: number) => void
let frameId = 0;

const tick = (timestamp) => {
    if (!running) return;
    frameId = requestAnimationFrame(tick);

    // First frame: no delta
    if (lastTimestamp === 0) {
        lastTimestamp = timestamp;
        return;
    }

    // Delta in seconds, clamped to avoid huge jumps
    let delta = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    // Cap total frame time to prevent spiral of death
    if (delta > CONFIG.FIXED_DT * CONFIG.MAX_FRAME_STEPS) {
        delta = CONFIG.FIXED_DT * CONFIG.MAX_FRAME_STEPS;
    }

    accumulator += delta;

    // Fixed-step updates
    while (accumulator >= CONFIG.FIXED_DT) {
        updateFn(CONFIG.FIXED_DT);
        accumulator -= CONFIG.FIXED_DT;
    }

    // Render with interpolation alpha (0..1 fraction of a step remaining)
    const alpha = accumulator / CONFIG.FIXED_DT;
    renderFn(alpha);
};

export const startLoop = (update, render) => {
    updateFn = update;
    renderFn = render;
    running = true;
    lastTimestamp = 0;
    accumulator = 0;
    frameId = requestAnimationFrame(tick);
};

export const stopLoop = () => {
    running = false;
    cancelAnimationFrame(frameId);
};

export const isRunning = () => running;
