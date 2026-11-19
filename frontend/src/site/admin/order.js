// The group's slugs after moving item i one step up (-1) or down (1); null when it cannot move,
// so the caller sends nothing.
export function move(list, i, dir) {
  const j = i + dir;
  if (i < 0 || i >= list.length || j < 0 || j >= list.length) return null;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
