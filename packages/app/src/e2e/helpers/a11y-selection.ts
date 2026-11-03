export function parsePageSelection(
	raw: string | undefined,
): ReadonlySet<string> | null {
	const ids = (raw ?? "")
		.split(",")
		.map((id) => id.trim())
		.filter(Boolean);
	return ids.length > 0 ? new Set(ids) : null;
}

// Empty means every page: the weekly sweep and the baseline-writing push never set it.
const selection = parsePageSelection(process.env.ULTRA11Y_PAGES);

export function isPageSelected(
	id: string,
	pages: ReadonlySet<string> | null = selection,
): boolean {
	return pages === null || pages.has(id);
}
