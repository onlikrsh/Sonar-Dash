/**
 * math.js -- Shared math helpers.
 * No allocations. All functions are pure and operate on primitives.
 */

export const clamp = (value, min, max) =>
    value < min ? min : value > max ? max : value;

export const lerp = (a, b, t) => a + (b - a) * t;

export const distance = (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Circle vs AABB overlap test.
 * Returns true if the circle (cx, cy, r) intersects the axis-aligned
 * rectangle defined by (rx, ry, rw, rh).
 */
export const circleAABB = (cx, cy, cr, rx, ry, rw, rh) => {
    const nearestX = clamp(cx, rx, rx + rw);
    const nearestY = clamp(cy, ry, ry + rh);
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return (dx * dx + dy * dy) < (cr * cr);
};
