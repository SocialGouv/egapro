import Link from "next/link";

import { formatIsoDate } from "~/modules/domain";
import type { AppHref } from "~/modules/routes";
import { CGU, termsOfUseVersionHref } from "~/modules/routes";

import type { TermsOfUseVersion } from "./termsOfUseVersions";

type Props = {
	versions: readonly TermsOfUseVersion[];
	viewedEffectiveDate: string;
};

type HistoryEntry = {
	effectiveDate: string;
	label: string;
	href: AppHref | undefined;
};

// The version the visitor is currently reading never links to itself.
function buildHistoryEntries(
	versions: readonly TermsOfUseVersion[],
	viewedEffectiveDate: string,
): HistoryEntry[] {
	return versions.map((version, index) => {
		const isCurrent = index === 0;
		const isViewed = version.effectiveDate === viewedEffectiveDate;
		const label = `Version du ${formatIsoDate(version.effectiveDate)}${
			isCurrent ? " (en vigueur)" : ""
		}`;
		const href = isViewed
			? undefined
			: isCurrent
				? CGU
				: termsOfUseVersionHref(version.effectiveDate);
		return { effectiveDate: version.effectiveDate, label, href };
	});
}

/** Lists every registered CGU version; links to each one but the version currently displayed. */
export function TermsOfUseVersionHistory({
	versions,
	viewedEffectiveDate,
}: Props) {
	const entries = buildHistoryEntries(versions, viewedEffectiveDate);

	return (
		<>
			<h2 className="fr-h4" id="historique-des-versions">
				Historique des versions
			</h2>
			<ul>
				{entries.map((entry) => (
					<li key={entry.effectiveDate}>
						{entry.href ? (
							<Link href={entry.href}>{entry.label}</Link>
						) : (
							entry.label
						)}
					</li>
				))}
			</ul>
		</>
	);
}
