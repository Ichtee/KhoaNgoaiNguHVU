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
assert.equal(settingsHref('/'), '/quan-tri/quan-ly/thong-tin?ve=%2F');
assert.equal(menuHref('/'), '/quan-tri/quan-ly/chuyen-muc?ve=%2F');

// inside the admin area every site link keeps the /quan-tri prefix; outside it nothing changes
{
  const { sitePath, publicPath, ADMIN_BASE } = await import('../src/site/admin/links.js');
  assert.equal(ADMIN_BASE, '/quan-tri');
  assert.equal(sitePath('', '/muc/x'), '/muc/x');
  assert.equal(sitePath('', '/'), '/');
  assert.equal(sitePath('/quan-tri', '/'), '/quan-tri');
  assert.equal(sitePath('/quan-tri', '/muc/x'), '/quan-tri/muc/x');
  assert.equal(sitePath('/quan-tri', '/#gioi-thieu'), '/quan-tri#gioi-thieu');
  assert.equal(sitePath('/quan-tri', '/tim-kiem?q=a'), '/quan-tri/tim-kiem?q=a');
  // "Xem như khách": the same page on the public site
  assert.equal(publicPath('/quan-tri'), '/');
  assert.equal(publicPath('/quan-tri/trang/lich-su'), '/trang/lich-su');
  assert.equal(publicPath('/quan-tri/quan-ly/thong-tin'), '/');
  assert.equal(publicPath('/quan-tri/bai/abc'), '/bai-viet/abc');
  assert.equal(publicPath('/quan-tri/muc/x?loc=y'), '/muc/x?loc=y');
  console.log('site path checks pass');
}

{
  const { move } = await import('../src/site/admin/order.js');
  assert.deepEqual(move(['a', 'b', 'c'], 1, -1), ['b', 'a', 'c']);
  assert.deepEqual(move(['a', 'b', 'c'], 1, 1), ['a', 'c', 'b']);
  assert.equal(move(['a', 'b', 'c'], 0, -1), null);
  assert.equal(move(['a', 'b', 'c'], 2, 1), null);
  assert.equal(move(['a'], 0, 1), null);
  assert.equal(move(['a', 'b'], 5, -1), null);
  console.log('order checks pass');
}
console.log('link checks pass');
