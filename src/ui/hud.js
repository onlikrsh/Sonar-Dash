/**
 * hud.js -- DOM-based HUD overlay.
 *
 * Score and messages are rendered via HTML/CSS, not canvas fillText.
 * This gives us CSS transitions and avoids expensive text rasterization
 * in the render loop.
 */

import { STATE } from '../core/state-machine.js';

let scoreEl = null;
let messageEl = null;
let highScoreEl = null;

export const initHUD = () => {
    scoreEl = document.getElementById('hud-score');
    messageEl = document.getElementById('hud-message');
    highScoreEl = document.getElementById('hud-highscore');
};

export const updateHUD = (state, score, highScore) => {
    if (!scoreEl) return;

    switch (state) {
        case STATE.MENU:
            scoreEl.textContent = '';
            highScoreEl.textContent = highScore > 0 ? `BEST  ${highScore}` : '';
            messageEl.textContent = 'TAP TO START';
            messageEl.classList.add('visible');
            break;

        case STATE.PLAYING:
            scoreEl.textContent = score;
            highScoreEl.textContent = '';
            messageEl.classList.remove('visible');
            break;

        case STATE.DEATH:
            scoreEl.textContent = score;
            highScoreEl.textContent = highScore > 0 ? `BEST  ${highScore}` : '';
            messageEl.textContent = 'TAP TO RETRY';
            messageEl.classList.add('visible');
            break;
    }
};
