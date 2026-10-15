import type { ComponentType } from "react";

import { TermsOfUse20261012 } from "./versions/TermsOfUse20261012";

export type TermsOfUseVersion = {
	effectiveDate: string;
	Content: ComponentType;
};

export type TermsOfUseVersionLookup =
	| { kind: "current" }
	| { kind: "archived"; version: TermsOfUseVersion }
	| { kind: "not-found" };

// Most recent first: the first entry is the version in force, and it is the only one ever edited.
export const TERMS_OF_USE_VERSIONS: readonly TermsOfUseVersion[] = [
	{ effectiveDate: "2026-10-12", Content: TermsOfUse20261012 },
];

export function getCurrentTermsOfUseVersion(
	versions: readonly TermsOfUseVersion[] = TERMS_OF_USE_VERSIONS,
): TermsOfUseVersion {
	const [current] = versions;
	if (!current) {
		throw new Error("No terms of use version registered.");
	}
	return current;
}

export function resolveTermsOfUseVersion(
	effectiveDate: string,
	versions: readonly TermsOfUseVersion[] = TERMS_OF_USE_VERSIONS,
): TermsOfUseVersionLookup {
	const [current, ...archive] = versions;
	if (!current) {
		return { kind: "not-found" };
	}
	if (current.effectiveDate === effectiveDate) {
		return { kind: "current" };
	}
	const version = archive.find(
		(entry) => entry.effectiveDate === effectiveDate,
	);
	return version ? { kind: "archived", version } : { kind: "not-found" };
}
