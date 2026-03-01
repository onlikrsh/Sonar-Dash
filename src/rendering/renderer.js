/**
 * renderer.js -- Master render orchestrator.
 *
 * Owns the canvas context. Calls sub-renderers in the correct order.
 * This module is PURE RENDERING -- no game state mutations.
 * For this prototype, sub-renderers are inlined as simple shape draws.
 * They will be extracted into dedicated modules when visual polish begins.
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

    // --- Obstacles (placeholder rectangles) ---
    // Invisible unless revealed by sonar. Debug mode shows them dimly.
    forEachObstacle((obs) => {
        let drawAlpha = 0;

        if (CONFIG.DEBUG_DRAW) {
            drawAlpha = 0.3;
        }

        // Afterglow: obstacle was recently illuminated by a pulse
        if (obs.revealedAt >= 0) {
            const elapsed = gameTime - obs.revealedAt;
            if (elapsed < CONFIG.AFTERGLOW_DURATION) {
                drawAlpha = Math.max(drawAlpha, 1 - elapsed / CONFIG.AFTERGLOW_DURATION);
            }
        }

        if (drawAlpha > 0.01) {
            ctx.fillStyle = CONFIG.WALL_COLOR_REVEALED;
            ctx.globalAlpha = drawAlpha;
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            ctx.globalAlpha = 1;
        }
    });

    // --- Sonar pulses (expanding rings) ---
    forEachPulse((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = CONFIG.PULSE_COLOR;
        ctx.globalAlpha = p.alpha;
        ctx.lineWidth = CONFIG.PULSE_RING_WIDTH;
        ctx.stroke();
        ctx.globalAlpha = 1;
    });

    // --- Particles (death burst) ---
    if (state === STATE.DEATH) {
        forEachParticle((px, py, pa) => {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = pa;
            ctx.fillRect(px - 2, py - 2, 4, 4);
            ctx.globalAlpha = 1;
        });
    }

    // --- Orb ---
    if (orb.alive || state === STATE.MENU) {
        const drawX = lerp(orb.prevX, orb.x, alpha);
        const drawY = lerp(orb.prevY, orb.y, alpha);

        // Glow (placeholder: larger, translucent circle)
        ctx.beginPath();
        ctx.arc(drawX, drawY, CONFIG.ORB_GLOW_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.ORB_GLOW_COLOR;
        ctx.fill();

        // Core orb
        ctx.beginPath();
        ctx.arc(drawX, drawY, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.ORB_COLOR;
        ctx.fill();

        // Menu state: gentle breathing pulse
        if (state === STATE.MENU) {
            const pulse = 0.5 + 0.5 * Math.sin(gameTime * 3);
            ctx.beginPath();
            ctx.arc(drawX, drawY, CONFIG.ORB_GLOW_RADIUS + pulse * 10, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + pulse * 0.1})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
};

export const getCanvasSize = () => ({ w: canvasW, h: canvasH });
