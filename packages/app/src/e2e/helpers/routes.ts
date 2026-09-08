// The suite navigates by glob and asserts by regex, so it cannot consume an
// href from `~/modules/routes` directly. Without these two adapters it keeps its
// own copy of every URL, and a renamed route surfaces as a 404 in a `goto`
// rather than as a compile error at the caller.

// The origin varies with the environment under test.
export function urlGlob(path: string): string {
	return `**${path}`;
}

// Anchored on the end of the URL, like the hand-written regexes it replaces.
export function urlPattern(path: string): RegExp {
	return new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
}
