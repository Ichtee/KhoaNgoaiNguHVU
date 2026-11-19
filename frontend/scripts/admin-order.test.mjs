// Run: npm run test:admin
import assert from 'assert';
import { move } from '../src/site/admin/order.js';

// Lên / Xuống in the advanced settings: a new order, or null when the item cannot move (nothing is sent)
assert.deepEqual(move(['a', 'b', 'c'], 1, -1), ['b', 'a', 'c']);
assert.deepEqual(move(['a', 'b', 'c'], 1, 1), ['a', 'c', 'b']);
assert.equal(move(['a', 'b', 'c'], 0, -1), null);
assert.equal(move(['a', 'b', 'c'], 2, 1), null);
assert.equal(move(['a'], 0, 1), null);
assert.equal(move(['a', 'b'], 5, -1), null);
console.log('order checks pass');
