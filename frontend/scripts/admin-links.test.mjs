// Run: npm run test:links
import assert from 'assert';
import { safeReturn, editPostHref, newPostHref, editPageHref, newPageHref, settingsHref, menuHref } from '../src/site/admin/links.js';

// the editor sends the admin back only to a page of this site
assert.equal(safeReturn('/trang/lich-su'), '/trang/lich-su');
assert.equal(safeReturn('/muc/x?loc=y'), '/muc/x?loc=y');
assert.equal(safeReturn('//evil.com'), '/');
assert.equal(safeReturn('https://evil.com'), '/');
assert.equal(safeReturn('/\\evil.com'), '/');
assert.equal(safeReturn(''), '/');
assert.equal(safeReturn(null), '/');

assert.equal(editPostHref('a-b', '/muc/x?loc=y'), '/quan-tri/bai/a-b?ve=%2Fmuc%2Fx%3Floc%3Dy');
assert.equal(newPostHref('dao-tao', '/'), '/quan-tri/bai-moi?muc=dao-tao&ve=%2F');
assert.equal(newPostHref('', '/'), '/quan-tri/bai-moi?ve=%2F');
assert.equal(editPageHref('lich-su', '/trang/lich-su'), '/quan-tri/sua-trang/lich-su?ve=%2Ftrang%2Flich-su');
assert.equal(newPageHref('gioi-thieu', '/muc/gioi-thieu'), '/quan-tri/trang-moi?muc=gioi-thieu&ve=%2Fmuc%2Fgioi-thieu');
assert.equal(settingsHref('/'), '/quan-tri/thong-tin?ve=%2F');
assert.equal(menuHref('/'), '/quan-tri/chuyen-muc?ve=%2F');

const order = await import('../src/site/admin/order.js').catch(() => null);
if (order) {
  const { move } = order;
  assert.deepEqual(move(['a', 'b', 'c'], 1, -1), ['b', 'a', 'c']);
  assert.deepEqual(move(['a', 'b', 'c'], 1, 1), ['a', 'c', 'b']);
  assert.equal(move(['a', 'b', 'c'], 0, -1), null);
  assert.equal(move(['a', 'b', 'c'], 2, 1), null);
  assert.equal(move(['a'], 0, 1), null);
  assert.equal(move(['a', 'b'], 5, -1), null);
  console.log('order checks pass');
}
console.log('link checks pass');
