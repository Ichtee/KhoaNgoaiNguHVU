// Categories are a flat list; a child has `parent` = the slug of a top-level category.
export const topLevel = (cats) => cats.filter((c) => !c.parent);
export const childrenOf = (cats, slug) => cats.filter((c) => c.parent === slug);
export const treeSlugs = (cats, slug) => [slug, ...childrenOf(cats, slug).map((c) => c.slug)];

