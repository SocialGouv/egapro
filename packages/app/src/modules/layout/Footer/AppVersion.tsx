import { env } from "~/env.js";

import { NewTabNotice } from "../shared/NewTabNotice";

/**
 * GitHub repository the footer links to. Hard-coded (not env-driven) so a
 * misconfigured variable can never inject an arbitrary `href` — only the PR
 * number / branch name / tag, all validated shapes, are interpolated.
 */
const REPOSITORY_URL = "https://github.com/SocialGouv/egapro";

/**
 * Footer release indicator (issue #4020): lets a reviewer know which version
 * of the code a review app is running.
 *
 * - In production: the git tag → links to the release.
 * - On a review app: the branch name → links to the PR when its number is
 *   resolved at build time, otherwise to a branch-scoped PR search.
 * - In local dev / CI without the build var: renders nothing.
 *
 * The version comes from `NEXT_PUBLIC_APP_VERSION` (inlined at build time);
 * the PR number from `NEXT_PUBLIC_PR_NUMBER` (review builds only).
 */
export function AppVersion() {
	const version = env.NEXT_PUBLIC_APP_VERSION;
	const prNumber = env.NEXT_PUBLIC_PR_NUMBER;
	if (!version) return null;

	const href = buildHref(version, prNumber);

	return (
		<p className="fr-footer__bottom-copy">
			{"Version "}
			<a
				href={href}
				rel="noopener noreferrer"
				target="_blank"
				title={`Code source pour la version ${version} - nouvelle fenêtre`}
			>
				{version}
				<NewTabNotice />
			</a>
		</p>
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
