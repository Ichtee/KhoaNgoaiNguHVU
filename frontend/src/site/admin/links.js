// Where each ✎ on the public site leads. `here` is the page the admin is looking at;
// the editor goes back to it after saving or cancelling.

// only a path on this site: "//host" and "/\host" are other sites to a browser
export const safeReturn = (ve) => (typeof ve === 'string' && ve.startsWith('/') && !/^\/[/\\]/.test(ve) ? ve : '/');

const q = (params) => `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString()}`;

export const editPostHref = (slug, here) => `/quan-tri/bai/${slug}${q({ ve: here })}`;
export const newPostHref = (cat, here) => `/quan-tri/bai-moi${q({ muc: cat, ve: here })}`;
export const editPageHref = (slug, here) => `/quan-tri/sua-trang/${slug}${q({ ve: here })}`;
export const newPageHref = (group, here) => `/quan-tri/trang-moi${q({ muc: group, ve: here })}`;
export const settingsHref = (here) => `/quan-tri/quan-ly/thong-tin${q({ ve: here })}`;
export const menuHref = (here) => `/quan-tri/quan-ly/chuyen-muc${q({ ve: here })}`;

// The admin area is the same site under /quan-tri, with editing tools. Links inside it keep the prefix.
export const ADMIN_BASE = '/quan-tri';
export function sitePath(base, path) {
  if (!base) return path;
  if (path === '/') return base;
  if (path.startsWith('/#')) return base + path.slice(1);
  return base + path;
}

// the public page an admin address shows ("Xem như khách"); management screens have none, so the home page
export function publicPath(adminPath) {
  const rest = adminPath.slice(ADMIN_BASE.length) || '/';
  if (/^\/(muc|trang|bai-viet|tim-kiem)(\/|\?|$)/.test(rest) || rest === '/' || rest.startsWith('/?') || rest.startsWith('/#')) return rest;
  const post = /^\/bai\/([^/?#]+)/.exec(rest);
  if (post) return `/bai-viet/${post[1]}`;
  const page = /^\/sua-trang\/([^/?#]+)/.exec(rest);
  if (page) return `/trang/${page[1]}`;
  return '/';
}
