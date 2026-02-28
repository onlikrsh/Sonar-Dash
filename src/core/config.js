/**
 * config.js -- All tunable game constants.
 * Centralised here so balancing never requires hunting through modules.
 */

export const CONFIG = {
    // --- Canvas ---
    CANVAS_BG: '#050508',

    // --- Orb ---
    ORB_RADIUS: 10,
    ORB_COLOR: '#e8e8ec',
    ORB_GLOW_RADIUS: 28,
    ORB_GLOW_INNER: 'rgba(232, 232, 236, 0.30)',
    ORB_GLOW_OUTER: 'rgba(232, 232, 236, 0.00)',

    // --- Movement ---
    SCROLL_SPEED_INITIAL: 180,      // px/s  (upward)
    SCROLL_SPEED_MAX: 400,          // px/s
    SCROLL_SPEED_RAMP: 0.4,         // px/s per second of play
    DRIFT_SPEED: 160,               // px/s  (horizontal)
    INITIAL_DIRECTION: 1,           // 1 = right, -1 = left

    // --- World / Corridor ---
    CORRIDOR_MIN_WIDTH_RATIO: 0.35, // fraction of canvas width
    CORRIDOR_MAX_WIDTH_RATIO: 0.70,
    SEGMENT_HEIGHT: 200,            // px per generated band
    SEGMENT_BUFFER: 3,              // how many segments ahead to keep generated
    WALL_COLOR_REVEALED: '#c0c4d0', // cool light grey with slight blue tone

    // --- Sonar ---
    PULSE_EXPAND_SPEED: 420,        // px/s
    PULSE_LIFETIME: 0.85,           // seconds
    PULSE_RING_WIDTH: 3,            // px (slightly thinner for refinement)
    PULSE_MAX_ACTIVE: 6,
    PULSE_COLOR_R: 200,             // pulse ring colour (split for perf)
    PULSE_COLOR_G: 210,
    PULSE_COLOR_B: 240,

    // --- Afterglow ---
    AFTERGLOW_DURATION: 0.5,        // seconds after pulse reveals an obstacle

    // --- Particles ---
    PARTICLE_COUNT: 80,
    PARTICLE_POOL_SIZE: 128,
    PARTICLE_SPEED_MIN: 60,
    PARTICLE_SPEED_MAX: 300,
    PARTICLE_LIFETIME: 0.8,         // seconds
    PARTICLE_COLOR: '#e8e8ec',

    // --- Scoring ---
    SCORE_PER_PIXEL: 0.1,

    // --- State ---
    DEATH_INPUT_LOCKOUT: 0.35,      // seconds before restart is allowed

    // --- Physics ---
    FIXED_DT: 1 / 60,              // 16.667ms
    MAX_FRAME_STEPS: 4,             // spiral-of-death cap

    // --- Debug ---
    DEBUG_DRAW: false,              // set true to see obstacles permanently
};
