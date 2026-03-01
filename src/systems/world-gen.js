/**
 * world-gen.js -- Procedural corridor generation.
 *
 * The world is an infinite vertical corridor defined by left and right walls.
 * It is generated in discrete horizontal "segments" (bands) that tile vertically.
 *
 * As the camera scrolls upward, new segments are spawned above the viewport
 * and old ones below are recycled. Each segment is a pair of wall obstacles
 * (left wall + right wall).
 *
 * Corridor shape varies by adjusting the gap position and width per segment,
 * with constraints to prevent impossible jumps.
 */

import { CONFIG } from '../core/config.js';
import { clamp } from '../utils/math.js';
import {
    spawnObstacle,
    releaseObstacle,
    forEachObstacle,
    releaseAllObstacles,
} from '../entities/obstacle.js';

let nextSegmentId = 0;
let worldOffsetY = 0;          // cumulative scroll distance
let topEdge = 0;               // y-coordinate of the highest generated segment
let canvasW = 0;
let canvasH = 0;

// Current corridor state (used to ensure continuity between segments)
let gapCenterX = 0;
let gapWidth = 0;

// Track segments for cleanup
const segments = [];           // { id, y, leftObs, rightObs }

const MIN_GAP_SHIFT = -40;    // px per segment
const MAX_GAP_SHIFT = 40;

export const initWorldGen = (cw, ch) => {
    canvasW = cw;
    canvasH = ch;
    worldOffsetY = 0;
    topEdge = ch;  // start generating from the bottom of the screen upward
    nextSegmentId = 0;
    gapCenterX = cw / 2;
    gapWidth = cw * CONFIG.CORRIDOR_MAX_WIDTH_RATIO;
    segments.length = 0;
    releaseAllObstacles();

    // Pre-populate so getCorridorBounds has real data on frame 1
    const generateAheadY = -CONFIG.SEGMENT_HEIGHT * CONFIG.SEGMENT_BUFFER;
    while (topEdge > generateAheadY) {
        topEdge -= CONFIG.SEGMENT_HEIGHT;
        spawnSegment(topEdge);
    }
};

const spawnSegment = (y) => {
    const id = nextSegmentId++;

    // Shift corridor center randomly
    const shift = (Math.random() * (MAX_GAP_SHIFT - MIN_GAP_SHIFT)) + MIN_GAP_SHIFT;
    gapCenterX = clamp(
        gapCenterX + shift,
        canvasW * CONFIG.CORRIDOR_MIN_WIDTH_RATIO * 0.5 + 20,
        canvasW - canvasW * CONFIG.CORRIDOR_MIN_WIDTH_RATIO * 0.5 - 20
    );

    // Gradually narrow the corridor as distance increases for difficulty ramp
    const distanceFactor = clamp(worldOffsetY / 15000, 0, 1);
    const minW = canvasW * CONFIG.CORRIDOR_MIN_WIDTH_RATIO;
    const maxW = canvasW * CONFIG.CORRIDOR_MAX_WIDTH_RATIO;
    gapWidth = clamp(
        maxW - (maxW - minW) * distanceFactor * 0.6,
        minW,
        maxW
    );

    const halfGap = gapWidth / 2;
    const leftWallRight = gapCenterX - halfGap;
    const rightWallLeft = gapCenterX + halfGap;
    const h = CONFIG.SEGMENT_HEIGHT;

    // Left wall: from x=0 to leftWallRight
    const leftObs = spawnObstacle(0, y, Math.max(0, leftWallRight), h, id);

    // Right wall: from rightWallLeft to canvas edge
    const rightW = canvasW - rightWallLeft;
    const rightObs = spawnObstacle(rightWallLeft, y, Math.max(0, rightW), h, id);

    segments.push({ id, y, leftObs, rightObs });
};

/**
 * Called each fixed update with the scroll distance this step.
 * Generates new segments above viewport and recycles those below.
 */
export const updateWorldGen = (scrollDy) => {
    worldOffsetY += scrollDy;

    // How far above the viewport should we keep segments generated
    const generateAheadY = -CONFIG.SEGMENT_HEIGHT * CONFIG.SEGMENT_BUFFER;

    // Spawn new segments as needed
    while (topEdge > generateAheadY) {
        topEdge -= CONFIG.SEGMENT_HEIGHT;
        spawnSegment(topEdge);
    }

    // Scroll all segment y-positions down (world moves down as orb "ascends")
    for (let i = 0; i < segments.length; i++) {
        segments[i].y += scrollDy;
        if (segments[i].leftObs) segments[i].leftObs.y = segments[i].y;
        if (segments[i].rightObs) segments[i].rightObs.y = segments[i].y;
    }

    // Also scroll topEdge down so generation threshold stays correct
    topEdge += scrollDy;

    // Recycle segments that have scrolled below the viewport
    const cullY = canvasH + CONFIG.SEGMENT_HEIGHT;
    while (segments.length > 0 && segments[0].y > cullY) {
        const seg = segments.shift();
        if (seg.leftObs) releaseObstacle(seg.leftObs);
        if (seg.rightObs) releaseObstacle(seg.rightObs);
    }
};

/** Get current corridor bounds at the orb's y-position (screen space). */
export const getCorridorBounds = (screenY) => {
    // Find the segment the orb is in
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (screenY >= seg.y && screenY < seg.y + CONFIG.SEGMENT_HEIGHT) {
            const leftWallRight = seg.leftObs ? seg.leftObs.x + seg.leftObs.w : 0;
            const rightWallLeft = seg.rightObs ? seg.rightObs.x : canvasW;
            return { left: leftWallRight, right: rightWallLeft };
        }
    }
    // Fallback: full width
    return { left: 0, right: canvasW };
};

export const getWorldOffsetY = () => worldOffsetY;
