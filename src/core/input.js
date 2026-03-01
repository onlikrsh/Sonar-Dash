/**
 * input.js -- Pointer/touch event buffering.
 *
 * Captures pointerdown events into a queue that the game loop drains
 * each fixed update. This decouples input timing from frame timing.
 */

const queue = [];

let bound = false;

export const initInput = (canvas) => {
    if (bound) return;
    bound = true;

    canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        queue.push(e.timeStamp);
    }, { passive: false });

    // Prevent context menu on long-press (mobile)
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
};

/** Drain all buffered inputs. Returns the count of taps since last drain. */
export const drainInput = () => {
    const count = queue.length;
    queue.length = 0;
    return count;
};

/** Peek at queue length without draining. */
export const pendingInputs = () => queue.length;
