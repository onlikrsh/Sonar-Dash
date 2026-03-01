/**
 * main.js -- Bootstrap and master update/render wiring.
 *
 * This is the only file that imports from every layer. It wires together
 * the game loop, state machine, entities, systems, and rendering.
 */

import { CONFIG } from './core/config.js';
import { startLoop } from './core/game-loop.js';
import { initInput, drainInput } from './core/input.js';
import {
    STATE, getState, getStateTime,
    toMenu, toPlaying, toDeath,
    tickStateTime, setStateChangeCallback,
} from './core/state-machine.js';
import { orb, resetOrb, savePrevPosition, updateOrb, reverseDirection } from './entities/orb.js';
import { spawnPulse, updatePulses, releaseAllPulses, scrollPulses } from './entities/sonar-pulse.js';
import { initWorldGen, updateWorldGen, getCorridorBounds } from './systems/world-gen.js';
import { checkOrbCollision } from './systems/collision.js';
import { initScoring, resetScore, addDistance, getScore, getHighScore, finalizeScore } from './systems/scoring.js';
import { spawnDeathBurst, updateParticles, clearParticles } from './systems/particle.js';
import { forEachObstacle } from './entities/obstacle.js';
import { initRenderer, resizeRenderer, render, getCanvasSize } from './rendering/renderer.js';
import { updateSonarReveal } from './systems/sonar-reveal.js';
import { initHUD, updateHUD } from './ui/hud.js';

// ----- Canvas setup -----
const canvas = document.getElementById('game-canvas');

const sizeCanvas = () => {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    resizeRenderer(canvas);
};

// ----- Initialisation -----
const init = () => {
    initRenderer(canvas);
    sizeCanvas();
    initInput(canvas);
    initHUD();
    initScoring();

    window.addEventListener('resize', sizeCanvas);

    // Pause on tab hide
    document.addEventListener('visibilitychange', () => {
        // The game loop naturally handles this via timestamp capping,
        // but we could freeze state here if needed in the future.
    });

    setStateChangeCallback((newState, _oldState) => {
        const { w, h } = getCanvasSize();
        switch (newState) {
            case STATE.MENU:
                resetOrb(w, h);
                releaseAllPulses();
                clearParticles();
                resetScore();
                initWorldGen(w, h);
                break;

            case STATE.PLAYING:
                resetOrb(w, h);
                releaseAllPulses();
                clearParticles();
                resetScore();
                initWorldGen(w, h);
                break;

            case STATE.DEATH:
                orb.alive = false;
                finalizeScore();
                forEachObstacle((obs) => { obs.revealedAt = -1; });
                spawnDeathBurst(orb.x, orb.y);
                break;
        }
    });

    toMenu();
    startLoop(update, renderFrame);
};

// ----- Fixed Update (runs at 60Hz) -----
const update = (dt) => {
    tickStateTime(dt);
    const state = getState();
    const taps = drainInput();

    switch (state) {
        case STATE.MENU:
            updateMenu(dt, taps);
            break;
        case STATE.PLAYING:
            updatePlaying(dt, taps);
            break;
        case STATE.DEATH:
            updateDeath(dt, taps);
            break;
    }
};

const updateMenu = (_dt, taps) => {
    if (taps > 0) {
        toPlaying();
    }
    updateHUD(STATE.MENU, 0, getHighScore());
};

const updatePlaying = (dt, taps) => {
    savePrevPosition();

    // Process each tap: reverse direction + spawn sonar
    for (let i = 0; i < taps; i++) {
        reverseDirection();
        spawnPulse(orb.x, orb.y);
    }

    // Get corridor bounds at orb position for clamping
    const bounds = getCorridorBounds(orb.y);

    // Move orb
    const scrollDy = updateOrb(dt, bounds.left, bounds.right);

    // Scroll the world
    updateWorldGen(scrollDy);

    // Scroll pulse origins with the world
    scrollPulses(scrollDy);

    // Update sonar pulses
    updatePulses(dt);

    // Mark obstacles revealed by pulse rings
    updateSonarReveal(getStateTime());

    // Collision
    if (checkOrbCollision()) {
        toDeath();
        return;
    }

    // Scoring
    addDistance(scrollDy);
    updateHUD(STATE.PLAYING, getScore(), getHighScore());
};

const updateDeath = (dt, taps) => {
    updateParticles(dt);
    updatePulses(dt);

    // Input lockout before restart
    if (taps > 0 && getStateTime() > CONFIG.DEATH_INPUT_LOCKOUT) {
        toPlaying();
    }

    updateHUD(STATE.DEATH, getScore(), getHighScore());
};

// ----- Render (runs at display refresh rate) -----
const renderFrame = (alpha) => {
    render(alpha);
};

// ----- Start -----
init();
