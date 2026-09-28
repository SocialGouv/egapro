import { env } from "~/env.js";

import { NewTabNotice } from "../shared/NewTabNotice";

/**
 * GitHub repository the footer links to. Hard-coded (not env-driven) so a
 * misconfigured variable can never inject an arbitrary `href` — only the PR
 * number / branch name / tag, all validated shapes, are interpolated.
 */
const REPOSITORY_URL = "https://github.com/SocialGouv/egapro";

/**
 * Owns its `<li>` so that an absent version leaves no empty list item — which
 * would still paint the DSFR separator bar.
 */
export function AppVersion() {
	const version = env.NEXT_PUBLIC_APP_VERSION;
	const prNumber = env.NEXT_PUBLIC_PR_NUMBER;
	if (!version) return null;

	const href = buildHref(version, prNumber);

	return (
		<li className="fr-footer__bottom-item">
			<a
				className="fr-footer__bottom-link"
				href={href}
				rel="noopener noreferrer"
				target="_blank"
			>
				Version {version}
				{/* The destination belongs to the accessible name: `title` does not
				    count as link context under WCAG 2.4.4. */}
				<span className="fr-sr-only"> : code source sur GitHub</span>
				<NewTabNotice />
			</a>
		</li>
	);
}

function buildHref(version: string, prNumber: string | undefined): string {
	// A git release tag (production). Direct link to the release page.
	if (version.startsWith("v")) {
		return `${REPOSITORY_URL}/releases/tag/${encodeURIComponent(version)}`;
	}
	// A long-lived environment branch (beta, master, alpha, dev…): no slash,
	// not a tag → link to the branch tree. Feature/ticket branches always
	// carry a slash (`ticket/4020-…`), so they never take this path.
	if (!version.includes("/")) {
		return `${REPOSITORY_URL}/tree/${encodeURIComponent(version)}`;
	}
	// A review-app feature branch with a resolved PR number → direct link.
	if (prNumber) {
		return `${REPOSITORY_URL}/pull/${prNumber}`;
	}
	// A review-app feature branch whose PR is not open yet (first push) → a
	// search scoped to the branch head.
	return `${REPOSITORY_URL}/pulls?q=${encodeURIComponent(`is:pr head:${version}`)}`;
}
