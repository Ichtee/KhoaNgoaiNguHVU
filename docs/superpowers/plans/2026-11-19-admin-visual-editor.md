# Admin Visual Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the admin's field-by-field post/page forms with an editor that looks like the published article and edits in place (cover with corner buttons, title in place, rich text with a toolbar), while posts keep being stored as Markdown.

**Architecture:** A Tiptap editor configured once in `editor/extensions.js` reads and writes Markdown through `tiptap-markdown`; a Node round-trip script proves every existing post and page survives open-and-save unchanged in what readers see. `RichEditor.jsx` (lazy-loaded so the public site does not grow) wraps it with a toolbar and image handling. `PostForm`/`PageForm` keep their save/draft logic but render as an article canvas plus a settings column.

**Tech Stack:** React 18, plain CSS, `@tiptap/react` `@tiptap/starter-kit` `@tiptap/extension-image` `@tiptap/extension-table` `@tiptap/extensions` (Placeholder) all **3.32.2**, `tiptap-markdown` **0.9.0**; dev only: `jsdom` **29.1.1**.

**Spec:** `docs/superpowers/specs/2026-11-19-admin-visual-editor-design.md`

## Global Constraints

- Content stays Markdown in the database; the public site (`react-markdown` + `remark-gfm`) is not changed.
- The editor code must not be in the public bundle: `RichEditor` is imported with `React.lazy` only from the admin forms.
- Uploads go through the existing `api.upload(file) -> { url }`.
- Icons from `lucide-react`; plain CSS in `src/styles/index.css` using the existing tokens (`--navy`, `--line`, `--soft`, `--muted`, `--radius`).
- Exact Vietnamese labels: "Đổi ảnh bìa", "Gỡ", "+ Thêm ảnh bìa", "Làm ảnh bìa", "Xóa ảnh", "Sửa mã Markdown", "Quay lại trình soạn thảo", "Lưu", "Hủy", "Xem nháp trên website".
- Keep `useSave` (save, unsaved-changes guard), `useDraft` (draft tab), `FilesField`, `rememberedAuthor`/`rememberAuthor` as they are.
- Every touch target ≥ 44px tall; every icon-only button has an `aria-label`.

## Review Focus

1. A post whose photo has a caption line `*chữ*` right under it (hvu.edu.vn posts): after open-and-save the caption still renders under the photo — covered by the round-trip script (Task 1), which runs over the six hvu posts.
2. Tables (pages `tuyen-sinh`, `ban-chu-nhiem`): survive open-and-save — round-trip script.
3. Uploading several photos where one fails: the ones that uploaded are still inserted and the error is shown — Task 2 browser check step.
4. Pressing Lưu with the Markdown view open: the Markdown text is what gets saved — Task 2 browser check step.
5. Opening a post on a phone (390px): no horizontal page scroll; the toolbar scrolls sideways on its own — Task 3 browser check step.

---

### Task 1: Editor configuration + Markdown round-trip proof

**Files:**
- Modify: `frontend/package.json` (dependencies above; `jsdom` in devDependencies; script `"roundtrip": "node scripts/roundtrip.mjs"`)
- Create: `frontend/src/site/editor/extensions.js`
- Create: `frontend/scripts/roundtrip.mjs`

**Interfaces:**
- Produces: `editorExtensions({ placeholder?: string }) => Extension[]` — StarterKit (link: `openOnClick: false`, `autolink: true`), Image (`inline: false`), Table/TableRow/TableHeader/TableCell, Placeholder, `Markdown.configure({ html: false, tightLists: true, linkify: false, breaks: true, transformPastedText: true })`.
- Produces: `toMarkdown(editor) => string` = `editor.storage.markdown.getMarkdown()`.

- [ ] **Step 1: Install** `npm i @tiptap/react@3.32.2 @tiptap/starter-kit@3.32.2 @tiptap/extension-image@3.32.2 @tiptap/extension-table@3.32.2 @tiptap/extensions@3.32.2 @tiptap/pm@3.32.2 tiptap-markdown@0.9.0 && npm i -D jsdom@29.1.1`
- [ ] **Step 2: Write `scripts/roundtrip.mjs`** — sets up jsdom globals, fetches `/api/posts` and every `/api/pages/:slug` from `https://khoangoainguhvu.onrender.com`, and for each content: create `new Editor({ extensions: editorExtensions(), content: md })`, `out = toMarkdown(editor)`, then compare `render(md)` with `render(out)` where `render = renderToStaticMarkup(<ReactMarkdown remarkPlugins={[remarkGfm]}>…)` with whitespace between tags collapsed. Prints `N/N ok` or each failing title with the first differing 200 chars; exit code 1 on any failure. Also a few fixed cases asserted first: bold/italic, nested list, link, table with header, image followed by `\n*caption*`, `## heading`, line break inside a paragraph.
- [ ] **Step 3: Run before extensions exist** — `npm run roundtrip` → FAIL (module not found).
- [ ] **Step 4: Implement `editorExtensions`** in `src/site/editor/extensions.js`.
- [ ] **Step 5: Run** `npm run roundtrip` → `69/69 ok` (58 posts + 11 pages) and all fixed cases pass. A failure is fixed in the extension config (or a pre/post string normalisation in `extensions.js`, exported as `fromMarkdown(md)`/`toMarkdown(editor)`), never by changing stored content.
- [ ] **Step 6: Commit** `feat(admin): tiptap markdown config with round-trip check`

### Task 2: RichEditor component

**Files:**
- Create: `frontend/src/site/editor/RichEditor.jsx` (default export)
- Modify: `frontend/src/styles/index.css` (`.rte*` rules)

**Interfaces:**
- Consumes: `editorExtensions`, `toMarkdown` (Task 1); `api.upload`.
- Produces: `<RichEditor value: string, onChange(md: string), alt: string, onError(msg: string), onCover?(url: string), placeholder?: string />` — default export, so forms use `React.lazy(() => import('./editor/RichEditor'))`.

- [ ] **Step 1: Implement.** `useEditor` with `content: value` once; `onUpdate` → `onChange(toMarkdown(editor))`. Toolbar (sticky at `top: 64px`, scrolls horizontally on narrow screens), each button `aria-label` + `aria-pressed` for marks: Đậm, Nghiêng, Tiêu đề (H2), Tiêu đề nhỏ (H3), Danh sách, Danh sách số, Trích dẫn, Link (prompt for URL; empty removes), Ảnh (file input, `multiple`, `accept="image/jpeg,image/png,image/webp,image/gif"`), Bảng (3×3 with header row), Hoàn tác, Làm lại. Images: upload each with `api.upload`, insert `{ type: 'image', attrs: { src, alt } }` at the cursor in order; files that fail are skipped and `onError(message)` is called once; paste and drop of image files do the same (`editorProps.handlePaste` / `handleDrop`). When an image node is selected, a small bar over it shows "Làm ảnh bìa" (only if `onCover`) and "Xóa ảnh". A "Sửa mã Markdown" toggle swaps the editor for a `<textarea>` bound to `value`; "Quay lại trình soạn thảo" reloads the editor from the textarea (`editor.commands.setContent(value)`). Inside a table, show "Thêm hàng", "Thêm cột", "Xóa bảng".
- [ ] **Step 2: Build** `npx vite build` → succeeds; the main `index-*.js` chunk does not contain the string `ProseMirror` (`grep -c ProseMirror dist/assets/index-*.js` → `0`), a separate chunk does.
- [ ] **Step 3: Commit** `feat(admin): rich text editor with toolbar and image upload`

(Browser checks for this component run in Task 3, once it is on screen.)

### Task 3: Article-shaped post and page editors

**Files:**
- Modify: `frontend/src/site/AdminForms.jsx` — `PostForm`, `PageForm`; delete `Editor`, `ImagesField`, `imagesIn`, `removeImage`, `swapImages`, `addImages` (no longer used; grep first).
- Modify: `frontend/src/styles/index.css` (`.studio*`, `.cover-edit*` rules)

**Interfaces:**
- Consumes: `RichEditor` (Task 2, lazy), existing `useSave`, `useDraft`, `FilesField`, `Actions`.
- Produces: `CoverField({ url: string, onChange(url: string), onError(msg) })` inside `AdminForms.jsx`.

- [ ] **Step 1: Implement the layout.** `<form className="studio">` = two columns (`minmax(0,1fr) 300px`; one column under 900px). Left `.studio-canvas`, styled like `.article`: `CoverField` (posts only: the cover at 16:9 like the public post; buttons "Đổi ảnh bìa" (file input) and "Gỡ" in its top-right corner; empty state is a dashed 16:9 box "+ Thêm ảnh bìa"), the category name in `.cat` style above the title (read-only), the title as an auto-growing `<textarea>` styled like `.article h1` (`aria-label="Tiêu đề"`, required, Enter does not insert a newline), the excerpt (posts only) as an auto-growing textarea styled like the lead paragraph (`aria-label="Tóm tắt"`, placeholder "Tóm tắt ngắn hiện ở danh sách bài…"), then `<Suspense fallback="Đang mở trình soạn thảo…"><RichEditor …/></Suspense>`, then `FilesField`. Right `.studio-side` (sticky `top: 88px`): Lưu / Hủy / Xem nháp (existing `Actions`), then for posts: Mục lớn + Mục con selects, "Bài nổi bật", "Ghim" + date, "Người đăng"; for pages: "Hiện trong menu của mục". Pass `onCover` to RichEditor only in `PostForm`.
- [ ] **Step 2: Browser check (desktop 1280px).** With a temporary admin session (insert a `Session` with a random token's sha256 `tokenHash`, expiry +1h, via `backend/db.js`; put the token in `localStorage.hvu_admin_token`; delete the session afterwards), on the local dev site: create a new post in category `thong-bao-dao-tao` titled `ZZ thử trình soạn thảo`; set a cover via "+ Thêm ảnh bìa"; type a bold word and a list; insert two images at once; select one image → "Làm ảnh bìa" changes the cover; "Xóa ảnh" removes it; open "Sửa mã Markdown", edit a word, press Lưu while that view is open → the saved post (`/api/posts/<slug>`) contains that word (Review Focus 4). Then delete the test post. Open the existing post "Hội nghị tổng kết thực tập cho sinh viên năm thứ tư (K15)" and confirm captions show under photos; press Hủy.
- [ ] **Step 3: Browser check (failure + phone).** Simulate one failed upload by uploading a `.bmp` among two `.png` files → the two PNGs are inserted, one error message is shown (Review Focus 3). At 390px wide: `document.documentElement.scrollWidth - clientWidth === 0`, the settings column is below the canvas, the toolbar scrolls sideways (Review Focus 5).
- [ ] **Step 4: Re-run** `npm run roundtrip` → `69/69 ok`; `npx vite build` → succeeds.
- [ ] **Step 5: Commit** `feat(admin): edit posts and pages in an article-shaped editor`
