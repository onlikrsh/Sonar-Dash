/**
 * scoring.js -- Score tracking and persistence.
 */

import { CONFIG } from '../core/config.js';

const STORAGE_KEY = 'sonar_dash_high_score';

let score = 0;
let highScore = 0;

export const initScoring = () => {
    score = 0;
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = parseInt(stored, 10);
    highScore = Number.isFinite(parsed) ? parsed : 0;
};

export const resetScore = () => {
    score = 0;
};

export const addDistance = (pixels) => {
    score += pixels * CONFIG.SCORE_PER_PIXEL;
};

export const getScore = () => Math.floor(score);

export const getHighScore = () => highScore;

export const finalizeScore = () => {
    const final = Math.floor(score);
    if (final > highScore) {
        highScore = final;
        try {
            localStorage.setItem(STORAGE_KEY, String(highScore));
        } catch (_) {
            // Storage full or blocked -- silently ignore
        }
    }
    return final;
};
