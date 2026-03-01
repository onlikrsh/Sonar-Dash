/**
 * object-pool.js -- Generic pre-allocated object pool.
 *
 * Usage:
 *   const pool = createPool(64, () => ({ x: 0, y: 0, active: false }));
 *   const obj = pool.acquire();   // returns null if exhausted
 *   pool.release(obj);
 *   pool.forEach(fn);             // iterates only active items
 */

export const createPool = (size, factory) => {
    const items = new Array(size);
    const inactive = [];

    for (let i = 0; i < size; i++) {
        const item = factory(i);
        item._poolIndex = i;
        item.active = false;
        items[i] = item;
        inactive.push(i);
    }

    return {
        acquire() {
            if (inactive.length === 0) return null;
            const idx = inactive.pop();
            const item = items[idx];
            item.active = true;
            return item;
        },

        release(item) {
            if (!item.active) return;
            item.active = false;
            inactive.push(item._poolIndex);
        },

        forEach(fn) {
            for (let i = 0; i < size; i++) {
                if (items[i].active) fn(items[i]);
            }
        },

        releaseAll() {
            for (let i = 0; i < size; i++) {
                if (items[i].active) {
                    items[i].active = false;
                    inactive.push(i);
                }
            }
        },

        get activeCount() {
            return size - inactive.length;
        }
    };
};
