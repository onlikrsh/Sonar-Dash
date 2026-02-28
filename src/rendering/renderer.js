/**
 * renderer.js -- Master render orchestrator.
 *
 * Owns the canvas context. This module is PURE RENDERING -- no game
 * state mutations. Draws in order: background, obstacles (afterglow),
 * sonar pulses (additive), particles, orb (cached glow).
 *
 * Performance notes:
 *   - Orb glow is pre-rendered to an OffscreenCanvas on init/resize.
 *   - Pulse ring color string is pre-computed per-frame (not per-pulse).
 *   - globalCompositeOperation is set once per batch, not per-item.
 */

import { CONFIG } from '../core/config.js';
import { orb } from '../entities/orb.js';
import { forEachPulse } from '../entities/sonar-pulse.js';
import { forEachObstacle } from '../entities/obstacle.js';
import { forEachParticle } from '../systems/particle.js';
import { getState, STATE, getStateTime } from '../core/state-machine.js';
import { lerp } from '../utils/math.js';

let ctx = null;
let canvasW = 0;
let canvasH = 0;

// Pre-rendered orb glow (avoids radial gradient + shadowBlur per frame)
let glowCanvas = null;
let glowCtx = null;
let glowSize = 0;

export const initRenderer = (canvas) => {
    ctx = canvas.getContext('2d');
    resizeRenderer(canvas);
};

export const resizeRenderer = (canvas) => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvasW = rect.width;
    canvasH = rect.height;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Rebuild the cached orb glow at the new DPI
    buildGlowCache(dpr);
};

/**
 * Pre-render the orb radial gradient glow to a small offscreen canvas.
 * Drawn once on init and on resize; used via drawImage each frame.
 */
const buildGlowCache = (dpr) => {
    const radius = CONFIG.ORB_GLOW_RADIUS;
    const size = radius * 2 + 4;   // +4 for subpixel bleed
    glowSize = size;

    glowCanvas = document.createElement('canvas');
    glowCanvas.width = size * dpr;
    glowCanvas.height = size * dpr;
    glowCtx = glowCanvas.getContext('2d');
    glowCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2;
    const cy = size / 2;

    // Outer ambient glow
    const gOuter = glowCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gOuter.addColorStop(0, CONFIG.ORB_GLOW_INNER);
    gOuter.addColorStop(1, CONFIG.ORB_GLOW_OUTER);
    glowCtx.fillStyle = gOuter;
    glowCtx.fillRect(0, 0, size, size);

    // Core orb (solid)
    glowCtx.beginPath();
    glowCtx.arc(cx, cy, CONFIG.ORB_RADIUS, 0, Math.PI * 2);
    glowCtx.fillStyle = CONFIG.ORB_COLOR;
    glowCtx.fill();
};

/**
 * Main render pass.
 * @param {number} alpha -- interpolation factor (0..1) between last two fixed steps
 */
export const render = (alpha) => {
    const state = getState();
    const gameTime = getStateTime();

    // --- Clear ---
    ctx.fillStyle = CONFIG.CANVAS_BG;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // --- Obstacles ---
    // Invisible unless revealed by sonar or DEBUG_DRAW is on.
    ctx.fillStyle = CONFIG.WALL_COLOR_REVEALED;

    forEachObstacle((obs) => {
        let drawAlpha = 0;

        if (CONFIG.DEBUG_DRAW) {
            drawAlpha = 0.25;
        }

        if (obs.revealedAt >= 0) {
            const elapsed = gameTime - obs.revealedAt;
            if (elapsed < CONFIG.AFTERGLOW_DURATION) {
                const fade = 1 - elapsed / CONFIG.AFTERGLOW_DURATION;
                // Ease out the fade for a smoother decay
                drawAlpha = Math.max(drawAlpha, fade * fade);
            }
        }

        if (drawAlpha > 0.01) {
            ctx.globalAlpha = drawAlpha;
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        }
    });

    ctx.globalAlpha = 1;

    // --- Sonar pulses (additive blending) ---
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    forEachPulse((p) => {
        const a = p.alpha;
        if (a < 0.01) return;

        const r = CONFIG.PULSE_COLOR_R;
        const g = CONFIG.PULSE_COLOR_G;
        const b = CONFIG.PULSE_COLOR_B;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
        ctx.lineWidth = CONFIG.PULSE_RING_WIDTH;
        ctx.stroke();
    });

    ctx.restore();

    // --- Particles (death burst) ---
    if (state === STATE.DEATH) {
        ctx.fillStyle = CONFIG.PARTICLE_COLOR;

        forEachParticle((px, py, pa) => {
            if (pa < 0.01) return;
            ctx.globalAlpha = pa;
            ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
        });

        ctx.globalAlpha = 1;
    }

    // --- Orb ---
    if (orb.alive || state === STATE.MENU) {
        const drawX = lerp(orb.prevX, orb.x, alpha);
        const drawY = lerp(orb.prevY, orb.y, alpha);

        // Draw cached glow image (centered on orb)
        if (glowCanvas) {
            const half = glowSize / 2;
            ctx.drawImage(glowCanvas, drawX - half, drawY - half, glowSize, glowSize);
        }

        // Menu state: gentle breathing ring
        if (state === STATE.MENU) {
            const t = gameTime * 2.5;
            const breath = 0.5 + 0.5 * Math.sin(t);
            const r = CONFIG.ORB_GLOW_RADIUS + breath * 12;
            const a = 0.06 + breath * 0.08;

            ctx.beginPath();
            ctx.arc(drawX, drawY, r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(200, 210, 240, ${a})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
};

export const getCanvasSize = () => ({ w: canvasW, h: canvasH });
