# Admin On Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A logged-in admin browsing any public page sees an admin bar and ✎ buttons on every part of the page that open the right editor and return to that page after saving, plus in-place ★ / 📌 / 🗑 / ↑↓ actions, menu ordering and a short description per section.

**Architecture:** `Layout` checks the saved session once (`api.session()`) and passes `admin: boolean` through the outlet context; small presentational pieces (`AdminBar`, `EditPin`, `PostTools`, `MoveButtons`) render only when `admin` is true. The admin app gains deep-link routes that open `PostForm`/`PageForm` directly and go back to `?ve=` after save or cancel. The backend gains two reorder endpoints and a `description` on categories.

**Tech Stack:** React 18 + react-router 6, plain CSS, Express + Mongoose. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-19-admin-on-site-design.md`

## Global Constraints

- Visitors who are not logged in see nothing new (no buttons, no bar) and download no extra request beyond today's.
- Every ✎ opens the existing editors (`PostForm`, `PageForm`, `SettingsForm`, categories screen); save **and** cancel return to the page the admin came from.
- Delete always asks first (`window.confirm`).
- The return address is only ever a same-site path (`/…`, never `//…` or `http…`).
- Touch targets ≥ 44px on phones; icon-only buttons have `aria-label`; ✎ buttons always visible on touch screens.
- Exact labels: "Đang xem với quyền quản trị", "Trang quản trị", "+ Viết bài", "+ Trang mới", "Đăng xuất", "Sửa", "Sửa bài này", "Sửa trang này", "Sửa thông tin khoa", "Sửa menu", "Chọn bài nổi bật", "+ Viết bài trong mục này", "+ Thêm trang vào mục này".

## Review Focus

1. Session expired while the tab was open: the first admin action fails with 401 → admin tools disappear and a message says to log in again (Task 3 browser check).
2. A ✎ link whose `ve` points off-site (`?ve=//evil.com`) → after save the admin lands on `/`, not off-site (Task 2 unit test `safeReturn`).
3. Moving the first item up / last item down does nothing and sends no request (Task 4 unit test `move`).
4. Toggling ★ on a post edited elsewhere since the page loaded → the 409 conflict message is shown, nothing overwritten (Task 3: PostTools shows the API error).
5. Choosing a 6th featured post: unchecked boxes are disabled at 5 (Task 5 browser check).

---

### Task 1: Backend — order and section description

**Files:** Modify `backend/db.js` (Category: `description: { type: String, default: '' }`), `backend/server.js`.

**Interfaces — produces:**
- `PUT /api/categories/order` (admin) body `{ slugs: string[] }` → sets `order` = index for each listed slug; 400 if not an array of existing slugs; returns the category list.
- `PUT /api/pages/order` (admin) body `{ slugs: string[] }` → same for pages; returns the page list.
- `PUT /api/categories/:slug` now also accepts `description` (trimmed, ≤ 300 chars); name stays required. `category(c)` output includes `description`.
- Both order routes are declared **before** `/:slug` routes.

- [ ] **Step 1: Failing check** — with the local server and a temporary session (see Task 6 for how), `curl -X PUT /api/categories/order` → 404 today.
- [ ] **Step 2: Implement** the three changes.
- [ ] **Step 3: Verify** — reorder two top-level categories and put them back: responses 200 with the new order, then the original order; `PUT /api/categories/order` with `{ slugs: 'x' }` → 400; without a token → 401; rename with description → description returned by `GET /api/categories`.
- [ ] **Step 4: Commit** `feat(api): reorder categories and pages, section description`

### Task 2: Admin deep links that return to the page

**Files:** Create `frontend/src/site/admin/links.js`; modify `frontend/src/site/Admin.jsx`, `frontend/src/api.js` (`reorderCategories(slugs)`, `reorderPages(slugs)`, `updateCategory(slug, { name, description })` replacing `renameCategory`).

**Interfaces — produces:**
- `safeReturn(ve: string | null) => string` — returns `ve` when it starts with `/` and not `//`, else `'/'`.
- `editPostHref(slug, here) / newPostHref(cat, here) / editPageHref(slug, here) / newPageHref(group, here) / settingsHref(here) / menuHref(here)` → `/quan-tri/bai/<slug>?ve=…`, `/quan-tri/bai-moi?muc=<cat>&ve=…`, `/quan-tri/sua-trang/<slug>?ve=…`, `/quan-tri/trang-moi?muc=<group>&ve=…`, `/quan-tri/thong-tin?ve=…`, `/quan-tri/chuyen-muc?ve=…` (`ve` URL-encoded).
- Admin routes `bai/:slug`, `bai-moi`, `sua-trang/:slug`, `trang-moi`: load the item (`api.post(slug)` / `api.page(slug)`), render `PostForm`/`PageForm`; `onSaved` and `onCancel` → `navigate(safeReturn(ve))` and `reload()`; when no `ve`, fall back to today's behaviour (back to the admin list). `SettingsForm` after a successful save also navigates to `ve` when present.

- [ ] **Step 1: Failing test** `frontend/scripts/admin-links.test.mjs` (bundled with esbuild like before): `safeReturn('/trang/lich-su') === '/trang/lich-su'`, `safeReturn('//evil.com') === '/'`, `safeReturn('https://evil.com') === '/'`, `safeReturn(null) === '/'`, `editPostHref('a-b', '/muc/x?loc=y') === '/quan-tri/bai/a-b?ve=%2Fmuc%2Fx%3Floc%3Dy'`, `newPostHref('dao-tao', '/') === '/quan-tri/bai-moi?muc=dao-tao&ve=%2F'`. Script: `"test:links": "node scripts/admin-links.test.mjs"`.
- [ ] **Step 2: Run** → fails (module missing).
- [ ] **Step 3: Implement** `links.js`, api functions, the four routes.
- [ ] **Step 4: Run** `npm run test:links` → pass; `npx vite build` → ok.
- [ ] **Step 5: Commit** `feat(admin): deep links to editors that return to the page`

### Task 3: Admin bar, ✎ pins and post quick actions on the public site

**Files:** Create `frontend/src/site/admin/OnSite.jsx` (`AdminBar`, `EditPin`, `PostTools`); modify `Layout.jsx`, `Home.jsx`, `PostList.jsx`, `PostPage.jsx`, `PageView.jsx`, `SectionHub.jsx`, `parts.jsx` (`PostCard`, `DateLink` accept `tools` node), `styles/index.css`.

**Interfaces:**
- Consumes: Task 2 hrefs; `api.session()`, `api.savePost`, `api.deletePost`, `setToken`.
- Produces: outlet context gains `admin: boolean` and `signOut()`. `EditPin({ to, label = 'Sửa' })` (Link with ✎ icon, `aria-label`); `PostTools({ post, onChanged })` with ★ (aria-pressed isFeatured), 📌 (aria-pressed pinned), 🗑 (confirm "Xóa bài “…”?"), ✎ link; shows API errors inline; calls `onChanged()` after success; on 401 calls `signOut()` and alerts "Phiên đăng nhập đã hết, hãy đăng nhập lại.".
- Layout: if `getToken()` → `api.session()` once; success → `admin = true`; failure → `admin = false` and `setToken(null)` only on 401. `AdminBar` at the very top: "Đang xem với quyền quản trị · Trang quản trị · + Viết bài · + Trang mới · Đăng xuất". Header brand gets `EditPin` "Sửa thông tin khoa"; nav gets "Sửa menu"; footer gets "Sửa thông tin khoa".
- Home: hero → `EditPin` "Sửa thông tin khoa"; pinned rows and "Tin mới" rows and column posts get `PostTools`; current slide gets "Sửa bài này"; intro gets `EditPin` to `editPageHref('gioi-thieu')`; columns header gets "+ Viết bài trong mục này". Home refetches posts in `onChanged`.
- PostList: cards get `PostTools`; when a section is open, "+ Viết bài trong mục này" (and on the hub "+ Thêm trang vào mục này"); hub cards get `EditPin`. Refetch on change.
- PostPage: title row gets `PostTools`; delete → navigate to the section list. PageView: "Sửa trang này" by the title; side contact `EditPin` to settings.

- [ ] **Step 1: Failing check** — `npx vite build` then `grep -c "Đang xem với quyền quản trị" dist/assets/index-*.js` → 0.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Verify** — build ok, grep → 1; browser checks in Task 6.
- [ ] **Step 4: Commit** `feat(site): admin bar, edit pins and quick post actions`

### Task 4: Ordering and section description in place

**Files:** Create `frontend/src/site/admin/order.js`; modify `OnSite.jsx` (`MoveButtons`), `Admin.jsx` (categories screen: ↑↓ per sibling group, description field for top-level; pages screen ↑↓ within a group), `SectionHub.jsx` (↑↓ on cards, description under the title), `PageView.jsx` (↑↓ in side nav), `Home.jsx` (↑↓ on column headers), `PostList.jsx` (description under the title).

**Interfaces — produces:**
- `move(list: string[], i: number, dir: -1 | 1) => string[] | null` — new order, or `null` when the move is impossible (first up, last down, out of range).
- `MoveButtons({ index, count, onMove(dir) })` — two buttons "Đưa lên"/"Đưa xuống", disabled at the ends.
- Reordering a sibling group sends the **whole** list of top-level slugs or of one group's slugs as the server expects (Task 1), then `reload()` from the outlet context.

- [ ] **Step 1: Failing test** in `scripts/admin-links.test.mjs`: `move(['a','b','c'],1,-1)` → `['b','a','c']`; `move(['a','b','c'],0,-1)` → `null`; `move(['a','b','c'],2,1)` → `null`; `move(['a'],0,1)` → `null`.
- [ ] **Step 2: Run** → fails.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run test:links` → pass; build ok.
- [ ] **Step 5: Commit** `feat(site): reorder sections and pages, section descriptions`

### Task 5: Choose featured posts on the home page

**Files:** Create `frontend/src/site/admin/FeaturedPicker.jsx`; modify `Home.jsx`, `styles/index.css`.

**Interfaces:** `FeaturedPicker({ posts, onChanged, onClose })` — dialog (`role="dialog"`, `aria-modal`, Escape closes, focus moves into it) listing the 30 newest posts with checkboxes bound to `isFeatured`; each toggle saves with `api.savePost`; when 5 are checked the unchecked boxes are disabled with the hint "Trang chủ hiện tối đa 5 bài nổi bật."; errors shown inline. Opened by "Chọn bài nổi bật" next to the slides.

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Verify** in Task 6 browser run.
- [ ] **Step 3: Commit** `feat(site): pick featured posts from the home page`

### Task 6: Browser verification

Temporary session (create a `Session` with a random token's sha256 hash, 1h expiry, through `backend/db.js`; token into `localStorage.hvu_admin_token` on the local dev site; delete the session after). Local backend + `vite` dev server.

- [ ] Logged out: no `.admin-bar`, no `.edit-pin` anywhere on `/`, `/muc/gioi-thieu`, `/trang/lich-su`, one post.
- [ ] Logged in: bar shows; on `/trang/lich-su` "Sửa trang này" opens the editor; Hủy → back on `/trang/lich-su`. On a post, ★ toggles and the home slides change; toggle back.
- [ ] ↑↓ on the Giới thiệu hub: move "Lịch sử hình thành" down, order changes in menu and hub; move it back.
- [ ] Category description: set "Thử mô tả" on Giới thiệu → shows on the hub; clear it.
- [ ] Featured picker: at 5 checked, others disabled.
- [ ] Session revoked mid-way (delete the session, then press ★) → message, tools gone (Review Focus 1).
- [ ] 390px: no horizontal scroll on `/`, `/muc/gioi-thieu`, a post.
- [ ] Delete the temporary session; `npm run roundtrip` 69/69; build ok.
