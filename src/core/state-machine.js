/**
 * state-machine.js -- Game state management.
 *
 * States: MENU, PLAYING, DEATH
 * Transitions are explicit functions, not a generic FSM, because
 * each transition has unique side-effects that a table-driven approach
 * would obscure.
 */

export const STATE = Object.freeze({
    MENU: 0,
    PLAYING: 1,
    DEATH: 2,
});

let current = STATE.MENU;
let stateTime = 0;          // seconds spent in current state
let onStateChange = null;    // optional callback: (newState, oldState) => void

export const getState = () => current;
export const getStateTime = () => stateTime;

export const setStateChangeCallback = (fn) => {
    onStateChange = fn;
};

const transition = (next) => {
    const prev = current;
    current = next;
    stateTime = 0;
    onStateChange?.(next, prev);
};

export const toMenu = () => transition(STATE.MENU);
export const toPlaying = () => transition(STATE.PLAYING);
export const toDeath = () => transition(STATE.DEATH);

export const tickStateTime = (dt) => {
    stateTime += dt;
};
