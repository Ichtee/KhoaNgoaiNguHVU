// Where each ✎ on the public site leads. `here` is the page the admin is looking at;
// the editor goes back to it after saving or cancelling.

// only a path on this site: "//host" and "/\host" are other sites to a browser
export const safeReturn = (ve) => (typeof ve === 'string' && ve.startsWith('/') && !/^\/[/\\]/.test(ve) ? ve : '/');

const q = (params) => `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString()}`;

export const editPostHref = (slug, here) => `/quan-tri/bai/${slug}${q({ ve: here })}`;
export const newPostHref = (cat, here) => `/quan-tri/bai-moi${q({ muc: cat, ve: here })}`;
export const editPageHref = (slug, here) => `/quan-tri/sua-trang/${slug}${q({ ve: here })}`;
export const newPageHref = (group, here) => `/quan-tri/trang-moi${q({ muc: group, ve: here })}`;
export const settingsHref = (here) => `/quan-tri/thong-tin${q({ ve: here })}`;
export const menuHref = (here) => `/quan-tri/chuyen-muc${q({ ve: here })}`;
