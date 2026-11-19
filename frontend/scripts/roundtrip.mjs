// Proves the editor never changes what readers see: every post and page is opened in the editor,
// written back to Markdown, and both versions are rendered the way the public site renders them.
// Run: npm run roundtrip   (needs the live API; exits 1 on any difference)
import { JSDOM } from 'jsdom';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
for (const key of ['window', 'document', 'navigator', 'Node', 'Element', 'HTMLElement', 'DOMParser', 'getComputedStyle', 'MutationObserver', 'Text', 'DocumentFragment']) {
  if (!(key in globalThis)) Object.defineProperty(globalThis, key, { value: dom.window[key] ?? dom.window, configurable: true, writable: true });
}
globalThis.window = dom.window;

const { Editor } = await import('@tiptap/core');
const { editorExtensions, fromMarkdown, toMarkdown } = await import('../src/site/editor/extensions.js');

const API = process.env.API || 'https://khoangoainguhvu.onrender.com';
const html = (md) => renderToStaticMarkup(createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, md))
  .replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();

function roundTrip(md) {
  const editor = new Editor({ extensions: editorExtensions(), content: fromMarkdown(md) });
  const out = toMarkdown(editor);
  editor.destroy();
  return out;
}

function check(name, md) {
  const out = roundTrip(md);
  const [a, b] = [html(md), html(out)];
  if (a === b) return true;
  let i = 0;
  while (a[i] === b[i]) i++;
  console.log(`✗ ${name}\n   trước: …${a.slice(Math.max(0, i - 60), i + 140)}\n   sau:   …${b.slice(Math.max(0, i - 60), i + 140)}\n`);
  return false;
}

const FIXED = {
  'đậm, nghiêng': 'Chữ **đậm** và *nghiêng* trong câu.',
  'danh sách lồng': '- Một\n  - Một a\n- Hai',
  'danh sách số': '1. Một\n2. Hai',
  'link': 'Xem [trang trường](https://www.hvu.edu.vn) nhé.',
  'bảng có tiêu đề': '| Chức vụ | Họ và tên |\n|---|---|\n| Trưởng khoa | TS. A |',
  'ảnh có chú thích': 'Đoạn.\n\n![Ảnh](https://res.cloudinary.com/x/image/upload/a.jpg)\n*Chú thích ảnh*\n\n*Nguồn: [X](https://x.vn).*',
  'tiêu đề': '## Phương thức xét tuyển\n\nĐoạn văn.',
  'xuống dòng trong đoạn': 'Dòng một\nDòng hai\nDòng ba',
  'xuống dòng cứng': 'Dòng một  \nDòng hai\\\nDòng ba',
  'tiêu đề gạch dưới nhiều dòng': 'Đoạn một dòng\nđoạn dòng hai\n-----\n\nSau tiêu đề.'
};

let ok = 0;
let total = 0;
for (const [name, md] of Object.entries(FIXED)) { total++; if (check(`mẫu: ${name}`, md)) ok++; }
console.log(`mẫu: ${ok}/${total} ok`);

const posts = await (await fetch(`${API}/api/posts`)).json();
const list = await (await fetch(`${API}/api/pages`)).json();
const pages = await Promise.all(list.map(async (p) => (await fetch(`${API}/api/pages/${p.slug}`)).json()));
let okReal = 0;
for (const item of [...posts, ...pages]) if (check(item.title, item.content)) okReal++;
const real = posts.length + pages.length;
console.log(`dữ liệu thật: ${okReal}/${real} ok (${posts.length} bài, ${pages.length} trang)`);
process.exit(ok === total && okReal === real ? 0 : 1);
