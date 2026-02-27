/**
 * hud.js -- DOM-based HUD overlay.
 *
 * Drives three visual states (MENU, PLAYING, DEATH) by toggling CSS
 * classes on pre-existing DOM elements. All animation is CSS-driven;
 * this module only mutates textContent and classList.
 */

import { STATE } from '../core/state-machine.js';

let scoreEl = null;
let menuOverlay = null;
let menuBest = null;
let deathOverlay = null;
let deathScore = null;
let deathBest = null;

let lastState = -1;
let lastScore = -1;

export const initHUD = () => {
    scoreEl      = document.getElementById('hud-score');
    menuOverlay  = document.getElementById('hud-menu');
    menuBest     = document.getElementById('hud-best');
    deathOverlay = document.getElementById('hud-death');
    deathScore   = document.getElementById('hud-death-score');
    deathBest    = document.getElementById('hud-death-best');
};

export const updateHUD = (state, score, highScore) => {
    if (!scoreEl) return;

    // Avoid redundant DOM writes -- only update on state change or score change
    const stateChanged = state !== lastState;
    const scoreChanged = score !== lastScore;

    if (!stateChanged && !scoreChanged) return;

    if (stateChanged) {
        lastState = state;

        // Reset all overlays
        menuOverlay.classList.remove('visible');
        deathOverlay.classList.remove('visible');
        scoreEl.classList.remove('visible');

        switch (state) {
            case STATE.MENU:
                menuOverlay.classList.add('visible');
                menuBest.textContent = highScore > 0 ? `BEST ${highScore}` : '';
                scoreEl.textContent = '';
                break;

            case STATE.PLAYING:
                scoreEl.classList.add('visible');
                break;

            case STATE.DEATH:
                deathOverlay.classList.add('visible');
                deathScore.textContent = score;
                deathBest.textContent = highScore > 0 ? `BEST ${highScore}` : '';
                break;
        }
    }

    // Live score update (playing and death)
    if (scoreChanged && (state === STATE.PLAYING || state === STATE.DEATH)) {
        lastScore = score;
        scoreEl.textContent = score;
    }
};
